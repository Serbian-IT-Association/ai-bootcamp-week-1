import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/progress.ts";

test("no completed items reports zero progress", function testNoCompletedItems() {

  assert.deepEqual(calculateProgress(0, 8), {
    completedCount: 0,
    totalCount: 8,
    percentage: 0,
    message: "Počni pripremu"
  });
});

test("one of eight completed items rounds to thirteen percent", function testRoundedPercentage() {

  assert.deepEqual(calculateProgress(1, 8), {
    completedCount: 1,
    totalCount: 8,
    percentage: 13,
    message: "Na dobrom si putu"
  });
});

test("partial completion reports the matching count and percentage", function testPartialProgress() {

  assert.deepEqual(calculateProgress(4, 8), {
    completedCount: 4,
    totalCount: 8,
    percentage: 50,
    message: "Na dobrom si putu"
  });
});

test("all completed items reports one hundred percent", function testCompleteProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completedCount: 8,
    totalCount: 8,
    percentage: 100,
    message: "Spreman/na si za intervju"
  });
});

test("a negative completed count is rejected", function testNegativeCompletedCount() {

  assert.throws(function calculateInvalidProgress() {

    calculateProgress(-1, 8);
  }, /completedCount must be an integer between 0 and 8/);
});

test("a completed count above the total is rejected", function testCompletedCountAboveTotal() {

  assert.throws(function calculateInvalidProgress() {

    calculateProgress(9, 8);
  }, /completedCount must be an integer between 0 and 8/);
});

test("a non-positive total count is rejected", function testNonPositiveTotalCount() {

  assert.throws(function calculateInvalidProgress() {

    calculateProgress(0, 0);
  }, /totalCount must be a positive integer/);
});
