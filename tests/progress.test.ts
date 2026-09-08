import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/progress.ts";

test("0/8 returns initial progress", function testInitialProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completed: 0,
    percentage: 0,
    message: "Počni pripremu",
  });
});

test("1/8 rounds 12.5 percent up to 13", function testRoundedProgress() {

  assert.deepEqual(calculateProgress(1, 8), {
    completed: 1,
    percentage: 13,
    message: "Na dobrom si putu",
  });
});

test("4/8 returns halfway progress", function testHalfwayProgress() {

  assert.deepEqual(calculateProgress(4, 8), {
    completed: 4,
    percentage: 50,
    message: "Na dobrom si putu",
  });
});

test("7/8 keeps the in-progress message near completion", function testNearlyCompleteProgress() {

  assert.deepEqual(calculateProgress(7, 8), {
    completed: 7,
    percentage: 88,
    message: "Na dobrom si putu",
  });
});

test("8/8 returns complete progress", function testCompleteProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completed: 8,
    percentage: 100,
    message: "Spreman/na si za intervju",
  });
});

test("invalid completed counts throw an error", function testInvalidCompleted() {

  const invalidCounts = [-1, 9, 0.5, NaN, Infinity, -Infinity];

  for (const completed of invalidCounts) {

    function calculateInvalidProgress(): void {

      calculateProgress(completed, 8);
    }

    assert.throws(calculateInvalidProgress, Error, `completed=${completed}`);
  }
});

test("invalid totals throw an error", function testInvalidTotal() {

  const invalidTotals = [0, -1, 8.5, NaN, Infinity, -Infinity];

  for (const total of invalidTotals) {

    function calculateInvalidProgress(): void {

      calculateProgress(0, total);
    }

    assert.throws(calculateInvalidProgress, Error, `total=${total}`);
  }
});
