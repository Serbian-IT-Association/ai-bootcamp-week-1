import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/progress.ts";

test("zero completed items returns initial progress", function testZeroProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completed: 0,
    percentage: 0,
    message: "Počni pripremu",
  });
});

test("one of eight completed items rounds to thirteen percent", function testRoundedProgress() {

  assert.deepEqual(calculateProgress(1, 8), {
    completed: 1,
    percentage: 13,
    message: "Na dobrom si putu",
  });
});

test("partial completion returns the in-progress message", function testPartialProgress() {

  assert.deepEqual(calculateProgress(4, 8), {
    completed: 4,
    percentage: 50,
    message: "Na dobrom si putu",
  });
});

test("all completed items returns complete progress", function testFullProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completed: 8,
    percentage: 100,
    message: "Spreman/na si za intervju",
  });
});

test("invalid progress counts throw an error", function testInvalidProgressCounts() {

  const invalidInputs = [
    { completed: -1, total: 8 },
    { completed: 9, total: 8 },
    { completed: 0, total: 0 },
    { completed: 0, total: -1 },
    { completed: 0.5, total: 8 },
    { completed: 1, total: 8.5 },
  ];

  for (const input of invalidInputs) {

    function calculateInvalidProgress(): void {

      calculateProgress(input.completed, input.total);
    }

    assert.throws(calculateInvalidProgress, Error);
  }
});
