import { test } from "node:test";
import assert from "node:assert/strict";
import { CompletedItemsStore } from "../src/storage.ts";
import { calculateProgress } from "../src/progress.ts";

test("a missing value parses to no completed items", function testMissingValue() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds(null), []);
});

test("a valid JSON array of ids parses unchanged", function testValidArray() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[\"prep-item-1\",\"prep-item-4\"]"), ["prep-item-1", "prep-item-4"]);
});

test("an empty JSON array parses to no completed items", function testEmptyArray() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[]"), []);
});

test("invalid JSON parses to no completed items", function testInvalidJson() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("not json"), []);
});

test("a JSON value that is not an array parses to no completed items", function testNonArrayJson() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("{\"prep-item-1\":true}"), []);
});

test("a JSON array with a non-string element parses to no completed items", function testNonStringElement() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[\"prep-item-1\",42]"), []);
});

test("progress preserves all nine exact percentage steps", function testProgressSteps() {

  const percentages = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

  for (const [completed, percentage] of percentages.entries()) {

    assert.deepEqual(calculateProgress(completed, 8), { completed, total: 8, percentage });
  }

  assert.deepEqual(calculateProgress(1, 4), { completed: 1, total: 4, percentage: 25 });
});

test("progress rejects invalid completed counts and totals", function testInvalidProgress() {

  const invalidCompleted = [-1, 9, 0.5, NaN, Infinity, -Infinity];
  const invalidTotals = [0, -1, 8.5, NaN, Infinity, -Infinity];

  for (const completed of invalidCompleted) {

    assert.throws(function calculateInvalidCompleted() {

      calculateProgress(completed, 8);
    }, /calculateProgress: completed/);
  }

  for (const total of invalidTotals) {

    assert.throws(function calculateInvalidTotal() {

      calculateProgress(0, total);
    }, /calculateProgress: total/);
  }
});

/** Minimal text element and event target for controller integration tests. */
class TestElement extends EventTarget {

  public textContent: string;

  /** Starts with stale content so tests also check the initial render. */
  constructor() {

    super();
    this.textContent = "stale";
  }
}

/** Checkbox state used by the real controller's DOM queries. */
class TestCheckbox extends TestElement {

  public readonly id: string;
  public readonly type: string;
  public checked: boolean;

  /** Assigns an id matching the existing page contract. */
  constructor(id: string) {

    super();
    this.id = id;
    this.type = "checkbox";
    this.checked = false;
  }
}

/** Native progress properties needed by the controller. */
class TestProgressBar extends TestElement {

  public max: number;
  public value: number;

  /** Uses deliberately stale values to verify both properties are updated. */
  constructor() {

    super();
    this.max = 1;
    this.value = 1;
  }
}

/** Isolated DOM and storage substitutes; restores every global after use. */
class PageTestEnvironment {

  public readonly checkboxes: TestCheckbox[];
  public readonly elements: Map<string, TestElement>;
  public readonly bar: TestProgressBar;
  public readonly savedValues: Map<string, string>;
  public failSaving: boolean;
  private readonly originalGlobals: Map<string, PropertyDescriptor | undefined>;

  /** Builds the eight checkboxes and all existing progress elements. */
  constructor(rawValue: string | null) {

    this.checkboxes = [];
    this.elements = new Map();
    this.bar = new TestProgressBar();
    this.savedValues = new Map();
    this.failSaving = false;
    this.originalGlobals = new Map();

    for (let index = 1; index <= 8; index += 1) {

      this.checkboxes.push(new TestCheckbox(`prep-item-${index}`));
    }

    for (const selector of ["#progress-text", "#progress-percentage", "#progress-message", "#reset-progress"]) {

      this.elements.set(selector, new TestElement());
    }

    this.elements.set("#progress-bar", this.bar);

    if (rawValue !== null) {

      this.savedValues.set("priprema-za-intervju:completed-items", rawValue);
    }
  }

  /** Installs substitutes before importing the page entry point. */
  public install(): void {

    const environment = this;
    const replacements = {
      HTMLElement: TestElement,
      HTMLInputElement: TestCheckbox,
      HTMLProgressElement: TestProgressBar,
      document: {
        querySelectorAll: function querySelectorAll(selector: string) {

          assert.equal(selector, "[data-prep-item]");
          return environment.checkboxes;
        },
        querySelector: function querySelector(selector: string) {

          return environment.elements.get(selector) ?? null;
        }
      },
      localStorage: {
        getItem: function getItem(key: string) {

          return environment.savedValues.get(key) ?? null;
        },
        setItem: function setItem(key: string, value: string) {

          if (environment.failSaving) {

            throw new Error("Simulated storage failure");
          }

          environment.savedValues.set(key, value);
        },
        removeItem: function removeItem(key: string) {

          environment.savedValues.delete(key);
        }
      }
    };

    for (const [name, value] of Object.entries(replacements)) {

      this.originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    }
  }

  /** Prevents DOM and storage substitutes from leaking into other tests. */
  public dispose(): void {

    for (const [name, descriptor] of this.originalGlobals) {

      if (descriptor === undefined) {

        Reflect.deleteProperty(globalThis, name);
      }
      else {

        Object.defineProperty(globalThis, name, descriptor);
      }
    }
  }

  /** Checks the four displays, including the bar's fallback text. */
  public assertProgress(completed: number, percentage: string, message: string): void {

    assert.equal(this.elements.get("#progress-text")?.textContent, `${completed} od 8 završeno`);
    assert.equal(this.elements.get("#progress-percentage")?.textContent, percentage);
    assert.equal(this.elements.get("#progress-message")?.textContent, message);
    assert.equal(this.bar.max, 8);
    assert.equal(this.bar.value, completed);
    assert.equal(this.bar.textContent, percentage);
  }
}

test("page restores progress, handles changes and keeps reset inactive", async function testPageProgress(context) {

  const errors: unknown[][] = [];
  context.mock.method(console, "error", function recordError(...values: unknown[]) {

    errors.push(values);
  });

  const scenarios = [
    { raw: null, completed: 0, percentage: "0%", message: "Počni pripremu" },
    { raw: "not json", completed: 0, percentage: "0%", message: "Počni pripremu" },
    { raw: '["prep-item-1",42]', completed: 0, percentage: "0%", message: "Počni pripremu" },
    { raw: '["prep-item-1","prep-item-4","prep-item-8"]', completed: 3, percentage: "37,5%", message: "Priprema je u toku" },
    { raw: '["prep-item-1","prep-item-1","unknown"]', completed: 1, percentage: "12,5%", message: "Priprema je u toku" },
    { raw: '["prep-item-1","prep-item-2","prep-item-3","prep-item-4","prep-item-5","prep-item-6","prep-item-7","prep-item-8"]', completed: 8, percentage: "100%", message: "Priprema je završena" }
  ];
  const percentages = ["0%", "12,5%", "25%", "37,5%", "50%", "62,5%", "75%", "87,5%", "100%"];

  for (const [scenarioIndex, scenario] of scenarios.entries()) {

    const environment = new PageTestEnvironment(scenario.raw);

    try {

      environment.install();
      // A unique module URL runs the real startup again, like a fresh page load.
      const moduleUrl = `../src/main.ts?progress-test=${scenarioIndex}`;
      await import(moduleUrl);
      environment.assertProgress(scenario.completed, scenario.percentage, scenario.message);

      for (const checkbox of environment.checkboxes) {

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change"));
      }

      environment.assertProgress(0, "0%", "Počni pripremu");
      const checkedIds: string[] = [];

      for (const [index, checkbox] of environment.checkboxes.entries()) {

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change"));
        checkedIds.push(checkbox.id);
        const percentage = percentages[index + 1];
        assert.ok(percentage);
        const message = index === 7 ? "Priprema je završena" : "Priprema je u toku";
        environment.assertProgress(index + 1, percentage, message);
        assert.deepEqual(new CompletedItemsStore().load(), checkedIds);
      }

      const resetButton = environment.elements.get("#reset-progress");
      assert.ok(resetButton);
      resetButton.dispatchEvent(new Event("click"));
      environment.assertProgress(8, "100%", "Priprema je završena");
      assert.deepEqual(new CompletedItemsStore().load(), checkedIds);
      assert.ok(environment.checkboxes.every(function isChecked(checkbox) {

        return checkbox.checked;
      }));

      for (const [index, checkbox] of environment.checkboxes.entries()) {

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change"));
        const completed = 7 - index;
        const percentage = percentages[completed];
        assert.ok(percentage);
        const message = completed === 0 ? "Počni pripremu" : "Priprema je u toku";
        environment.assertProgress(completed, percentage, message);
        assert.deepEqual(new CompletedItemsStore().load(), checkedIds.slice(index + 1));
      }

      assert.equal(errors.length, 0);
      environment.failSaving = true;
      const firstCheckbox = environment.checkboxes[0];
      assert.ok(firstCheckbox);
      firstCheckbox.checked = true;
      firstCheckbox.dispatchEvent(new Event("change"));
      environment.assertProgress(1, "12,5%", "Priprema je u toku");
      assert.equal(errors.length, 1);
      const loggedError = errors[0];
      assert.ok(loggedError);
      assert.equal(loggedError[0], "InterviewPreparationPage.onCheckboxChange: čuvanje stanja nije uspelo");
      assert.ok(loggedError[1] instanceof Error);
      assert.equal(loggedError[1].message, "Simulated storage failure");
      assert.deepEqual(new CompletedItemsStore().load(), []);
      errors.length = 0;
    }
    finally {

      environment.dispose();
    }
  }
});
