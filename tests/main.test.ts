import { test } from "node:test";
import assert from "node:assert/strict";

test("importing main.ts outside a browser does not throw", async function testImportWithoutDocument() {

  await assert.doesNotReject(async function importMain() {

    await import("../src/main.ts");
  });
});
