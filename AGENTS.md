# Coding style guide

This file governs every `.js`, `.mjs`, and `.ts` file in this project (build
scripts, browser source, and tests). It exists because this project is a
teaching artifact: the code must be easy for a human reviewer to read line by
line, not just correct. Follow it exactly; do not silently mix in a
different style "because it's shorter."

The functional and DOM contracts in `project-specification.md` still win on
any conflict. In particular, exported symbols, function names, and type
shapes required by that document (for example `calculateProgress` in
section 9) must keep their exact required shape even where this guide would
otherwise prefer a class.

## 1. Structure: classes, not loose globals

- Group related state and behaviour into a class with an explicit
  constructor. Do not scatter module-level `let`/`var` state across a file.
- If a class owns a resource that must be released (a server socket, a
  handle, a timer), give it an explicit lifecycle method (`start()`/`stop()`,
  `open()`/`close()`, `init()`/`dispose()`). Do not rely on the process
  exiting to clean things up.
- A file may still export small, pure, stateless helper functions when they
  have no meaningful state to own (for example `calculateProgress`, which
  section 9 of the specification requires to be a plain exported function).
  Do not build a class around a function just to satisfy this rule; only use
  a class when there is actual state or a lifecycle to manage.
- One `main` async function per script is the entry point. It stays short:
  build the objects, call their methods, handle the top-level error.

## 2. Exception handling

- Wrap every operation that can realistically fail (filesystem access,
  network I/O, JSON parsing, external process calls) in `try`/`catch`.
- When you catch an error only to add context, throw a **new** `Error` that
  includes the original message and enough detail to locate the problem
  (which file, which path, which class). Do not swallow an error silently.
- Define a dedicated `Error` subclass when a caller needs to distinguish a
  specific failure by type (see `PathTraversalError` in `serve.mjs`) rather
  than by parsing a message string.
- The top-level `main` function is the last line of defence: catch any error
  it lets through, print one clear line to `stderr`, and exit with a
  non-zero status. Do not let a script crash with a raw stack trace as the
  only feedback.

## 3. Comments and documentation

- Use JSDoc (`/** ... */`) above every class and above every public method,
  including one-line methods. State what it does and, for parameters/return
  values that are not obvious from their names, what they mean.
- Do not restate the code in prose ("increments the counter by one"). Use
  comments for the *why*, or for anything a reader could otherwise get
  wrong (units, ordering requirements, edge cases already considered).
- Skip JSDoc on trivial private one-line getters only when the method name
  already says everything; when in doubt, write the JSDoc.

## 4. Keep expressions simple

- Avoid deeply nested ternaries, chained optional-access expressions, or
  boolean expressions with more than two operands inline. Give the
  intermediate result a name.
- Prefer an explicit `if`/`else` over a ternary whenever the ternary would
  need a comment to explain it.
- A statement should read as one clear thought. If you have to pause to
  parse operator precedence, extract a local variable or a small private
  method instead.

```js
// Avoid:
const type = extname(p) === ".html" ? "text/html" : extname(p) === ".css" ? "text/css" : "application/octet-stream";

// Prefer:
const fileExtension = extname(resolvedPath);
const contentType = CONTENT_TYPES_BY_EXTENSION[fileExtension] ?? "application/octet-stream";
```

## 5. No arrow functions, no anonymous functions

- Every function is a named `function` declaration, a named function
  expression, or a class method. This applies to callbacks too: when an API
  requires a callback (for example a Node event emitter), pass a named
  function, not an inline arrow function.
- When a named function used as a callback needs the enclosing instance,
  capture it explicitly first (`const server = this;`) and reference that
  local variable, rather than relying on an arrow function's implicit
  closure over `this`.

## 6. Async style

- Use `async`/`await` everywhere. Do not use `.then()`/`.catch()` chains.
- If a Node API is callback-only (for example `httpServer.listen` combined
  with its `"error"`/`"listening"` events), wrap it once in a small
  `async` method that returns a `Promise` built with named functions, so
  every call site above it can still use `await`.

## 7. Formatting and spacing

- Two-space indentation, semicolons, double-quoted strings — matches the
  existing files.
- The line right after an opening `{` that starts a function, class, `if`,
  `for`, `while`, or `try`/`catch` block is a **blank line**, unless the
  block has no body. The closing `}` has no blank line before it.
- `else`, `catch`, and `finally` start on their **own new line**, not on the
  same line as the preceding `}`.

```js
if (condition) {

  doSomething();
}
else {

  doSomethingElse();
}

try {

  await riskyOperation();
}
catch (error) {

  throw new Error(`Context: ${error.message}`);
}
```

## 8. TypeScript specifics

- Prefer explicit `public`/`private` class members over relying on
  convention, the same way you would in C# or Java.
- `PascalCase` for classes and types, `camelCase` for methods, variables,
  and parameters.
- No `any`, no non-null assertions, no unchecked casts — this also matches
  section 9, rule 5 of the specification.

## 9. Documentation in this project only

This rule applies only to documentation inside this training project
(`README-sr.md` and any other file the student reads directly here). It
does **not** apply to anything above this project in the repository
(session materials, tutor guides, specification, review/ledger files) —
those keep their existing plain-Markdown conventions.

Student-facing documentation in this project should use the web as a
learning aid, not just describe the code in prose:

- When you introduce a term a student may not already know (a language,
  API, file format, or web concept — for example TypeScript, JavaScript,
  ES module, the DOM, `localStorage`, JSON, HTML, CSS, a bundler, a
  framework, Node.js, npm), link it inline to an authoritative external
  source on first use in a section: MDN Web Docs for web-platform and
  JavaScript/TypeScript topics, the official project documentation for a
  named tool (Node.js, npm, TypeScript), or Wikipedia only when no
  first-party or MDN reference exists for the general concept. Do not
  link a term more than once per section; do not link generic English
  words or project-specific names (`main.ts`, `CompletedItemsStore`).
- Collect reused links as Markdown reference-style links at the bottom of
  the file (`[label]: https://...`), grouped under their own heading if
  the file is long, so the prose stays readable.
- When explaining how two or more modules, files, or events interact
  (for example: a DOM event flowing into persistence and into a rendered
  result, or the build pipeline from `src/` to `dist/`), add a Mermaid
  diagram (` ```mermaid ` code block) instead of, or in addition to,
  prose. Prefer `flowchart` for structure/data-flow and `sequenceDiagram`
  for step-by-step interactions. Keep each diagram focused on one
  relationship; do not build one diagram that tries to show everything.
- Keep diagrams and links honest about the project's actual current
  state: mark what is already implemented versus what is the student's
  task to build (for example with a dashed edge or an explicit label),
  rather than describing the finished target state as if it already
  worked.
