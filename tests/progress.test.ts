import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProgress, InvalidProgressError } from "../src/progress.ts";

test("zero completed items returns the initial progress", function testZeroProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completed: 0,
    total: 8,
    percentage: 0,
    message: "Počni pripremu",
  });
});

test("partial progress rounds the percentage and uses the in-progress message", function testPartialProgress() {

  assert.deepEqual(calculateProgress(1, 8), {
    completed: 1,
    total: 8,
    percentage: 13,
    message: "Na dobrom si putu",
  });

  assert.deepEqual(calculateProgress(4, 8), {
    completed: 4,
    total: 8,
    percentage: 50,
    message: "Na dobrom si putu",
  });
});

test("complete progress returns the interview-ready message", function testCompleteProgress() {

  assert.deepEqual(calculateProgress(8, 8), {
    completed: 8,
    total: 8,
    percentage: 100,
    message: "Spreman/na si za intervju",
  });
});

test("invalid progress input throws InvalidProgressError", function testInvalidProgress() {

  assert.throws(function callWithInvalidCompletedCount() {

    calculateProgress(-1, 8);
  }, InvalidProgressError);

  assert.throws(function callWithInvalidTotal() {

    calculateProgress(1, 0);
  }, InvalidProgressError);

  assert.throws(function callWithCompletedCountAboveTotal() {

    calculateProgress(9, 8);
  }, InvalidProgressError);
});