import assert from "node:assert/strict";
import test from "node:test";

import {
  MESSAGE_CACHE_KEY,
  readCachedMessage,
  writeCachedMessage,
} from "../src/preferences.mjs";

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("writeCachedMessage stores the previous message in local storage", () => {
  const storage = createMemoryStorage();

  writeCachedMessage("오늘도 파이팅", storage);

  assert.equal(storage.getItem(MESSAGE_CACHE_KEY), "오늘도 파이팅");
  assert.equal(readCachedMessage(storage), "오늘도 파이팅");
});

test("writeCachedMessage clears the cached message when the input is empty", () => {
  const storage = createMemoryStorage();
  storage.setItem(MESSAGE_CACHE_KEY, "OLD");

  writeCachedMessage("", storage);

  assert.equal(storage.getItem(MESSAGE_CACHE_KEY), null);
  assert.equal(readCachedMessage(storage), "");
});

test("message cache helpers tolerate unavailable storage", () => {
  const blockedStorage = {
    getItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(readCachedMessage(blockedStorage), "");
  assert.doesNotThrow(() => writeCachedMessage("문구", blockedStorage));
});
