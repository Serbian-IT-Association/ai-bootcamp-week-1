import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/progress.ts";

test("no completed items reports 0% and the starting message", function testNoneCompleted() {

  const progress = calculateProgress(0, 8);

  assert.equal(progress.percentage, 0);
  assert.equal(progress.message, "Počni pripremu");
});

test("one of eight completed rounds 12.5% up to 13%, not down to 12%", function testRoundsHalfUp() {

  const progress = calculateProgress(1, 8);

  assert.equal(progress.percentage, 13);
});

test("some but not all items completed reports an in-progress message", function testPartiallyCompleted() {

  const progress = calculateProgress(4, 8);

  assert.equal(progress.percentage, 50);
  assert.equal(progress.message, "Nastavi, dobro ti ide");
});

test("every item completed reports 100% and the completion message", function testAllCompleted() {

  const progress = calculateProgress(8, 8);

  assert.equal(progress.percentage, 100);
  assert.equal(progress.message, "Spreman/na si za intervju!");
});

test("completedCount and totalCount are carried through unchanged", function testCountsPassThrough() {

  const progress = calculateProgress(3, 8);

  assert.equal(progress.completedCount, 3);
  assert.equal(progress.totalCount, 8);
});
