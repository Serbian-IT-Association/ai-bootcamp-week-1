import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/main.ts";

test("one of eight items rounds to 13 percent, not 12", function testOneOfEightProgress() {

  const progress = calculateProgress(1, 8);

  assert.equal(progress.percentage, 13);
  assert.notEqual(progress.percentage, 12);
});
