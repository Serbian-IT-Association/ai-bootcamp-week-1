import { test } from "node:test";
import assert from "node:assert/strict";
import { CompletedItemsStore } from "../src/storage.ts";
import { calculateProgress } from "../src/main.ts";

test("a missing value parses to no completed items", function testMissingValue() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds(null), []);
});

test("a valid JSON array of ids parses unchanged", function testValidArray() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[\"prep-item-1\",\"prep-item-4\"]"), ["prep-item-1", "prep-item-4"]);
});

test("an empty JSON array parses to no completed items", function testEmptyArray() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[]"), []);
});

test("invalid JSON parses to no completed items", function testInvalidJson() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("not json"), []);
});

test("a JSON value that is not an array parses to no completed items", function testNonArrayJson() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("{\"prep-item-1\":true}"), []);
});

test("a JSON array with a non-string element parses to no completed items", function testNonStringElement() {

  const store = new CompletedItemsStore();

  assert.deepEqual(store.parseCompletedItemIds("[\"prep-item-1\",42]"), []);
});

test("progress summary rounds the completion percentage for each checked item count", function testCalculateProgress() {

  assert.deepEqual(calculateProgress(0, 8), {
    completedCount: 0,
    percentage: 0,
    text: "0 od 8 završeno",
    percentageText: "0%",
    statusMessage: "Počni pripremu!",
    message: "Počni pripremu!",
  });

  assert.deepEqual(calculateProgress(2, 8), {
    completedCount: 2,
    percentage: 25,
    text: "2 od 8 završeno",
    percentageText: "25%",
    statusMessage: "U toku...",
    message: "U toku...",
  });

  assert.deepEqual(calculateProgress(4, 8), {
    completedCount: 4,
    percentage: 50,
    text: "4 od 8 završeno",
    percentageText: "50%",
    statusMessage: "Polovina je završena!",
    message: "Polovina je završena!",
  });

  assert.deepEqual(calculateProgress(6, 8), {
    completedCount: 6,
    percentage: 75,
    text: "6 od 8 završeno",
    percentageText: "75%",
    statusMessage: "Skoro si spreman/a!",
    message: "Skoro si spreman/a!",
  });

  assert.deepEqual(calculateProgress(8, 8), {
    completedCount: 8,
    percentage: 100,
    text: "8 od 8 završeno",
    percentageText: "100%",
    statusMessage: "Priprema je završena!",
    message: "Priprema je završena!",
  });
});
