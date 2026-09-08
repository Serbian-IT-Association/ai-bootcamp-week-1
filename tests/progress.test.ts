import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/progress.ts";

test("no completed items produces the initial progress", function testInitialProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completed: 0,
    total: 8,
    percentage: 0,
    message: "Počni pripremu",
  });
});

test("one of eight items rounds to thirteen percent", function testRoundedProgress() {

  assert.deepEqual(calculateProgress(1, 8), {
    completed: 1,
    total: 8,
    percentage: 13,
    message: "Samo napred",
  });
});

test("incomplete progress uses the encouraging message", function testIncompleteProgress() {

  assert.deepEqual(calculateProgress(7, 8), {
    completed: 7,
    total: 8,
    percentage: 88,
    message: "Samo napred",
  });
});

test("all completed items produce the finished progress", function testFinishedProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completed: 8,
    total: 8,
    percentage: 100,
    message: "Spreman/na si za intervju!",
  });
});
