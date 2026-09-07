import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress } from "../src/main.ts";

test("progress starts with no completed items", function testInitialProgress() {

  assert.deepEqual(calculateProgress(0), {
    completedItems: 0,
    percentage: 0,
    message: "Počni pripremu"
  });
});

test("progress uses a rounded percentage while preparation is underway", function testPartialProgress() {

  assert.deepEqual(calculateProgress(3), {
    completedItems: 3,
    percentage: 38,
    message: "Nastavi pripremu"
  });
});

test("progress identifies when exactly one item remains", function testOneRemainingProgress() {

  assert.deepEqual(calculateProgress(7), {
    completedItems: 7,
    percentage: 88,
    message: "Još samo jedan korak!"
  });
});

test("progress identifies when every preparation item is complete", function testCompleteProgress() {

  assert.deepEqual(calculateProgress(8), {
    completedItems: 8,
    percentage: 100,
    message: "Spreman/na si za intervju!"
  });
});
