import { test } from "node:test";
import assert from "node:assert/strict";
import { CompletedItemsStore } from "../src/storage.ts";

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
