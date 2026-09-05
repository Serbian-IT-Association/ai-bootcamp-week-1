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

test("a negative completedCount throws instead of returning a nonsensical percentage", function testRejectsNegativeCompletedCount() {

  assert.throws(function callWithNegativeCompletedCount() {

    calculateProgress(-1, 8);
  }, /completedCount must be an integer between 0 and 8/);
});

test("a completedCount greater than totalCount throws", function testRejectsCompletedCountAboveTotal() {

  assert.throws(function callWithCompletedCountAboveTotal() {

    calculateProgress(9, 8);
  }, /completedCount must be an integer between 0 and 8/);
});

test("a non-integer completedCount throws", function testRejectsFractionalCompletedCount() {

  assert.throws(function callWithFractionalCompletedCount() {

    calculateProgress(1.5, 8);
  }, /completedCount must be an integer/);
});

test("a totalCount of zero throws instead of dividing by zero", function testRejectsZeroTotalCount() {

  assert.throws(function callWithZeroTotalCount() {

    calculateProgress(0, 0);
  }, /totalCount must be a positive integer/);
});

test("a negative totalCount throws", function testRejectsNegativeTotalCount() {

  assert.throws(function callWithNegativeTotalCount() {

    calculateProgress(0, -8);
  }, /totalCount must be a positive integer/);
});
