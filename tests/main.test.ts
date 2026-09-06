import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/main.ts";

test("zero completed items show the initial progress", function testInitialProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completedItems: 0,
    percentage: 0,
    message: "Počni pripremu"
  });
});

test("partially completed items show a calculated percentage", function testPartialProgress() {

  assert.deepEqual(calculateProgress(4, 8), {
    completedItems: 4,
    percentage: 50,
    message: "Skoro gotovo!"
  });
});

test("all completed items show the final progress", function testCompletedProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completedItems: 8,
    percentage: 100,
    message: "Spreman/na si za intervju!"
  });
});
