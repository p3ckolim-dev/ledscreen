export const MESSAGE_CACHE_KEY = "ledscreen:last-message";

function resolveStorage(storage) {
  if (storage) {
    return storage;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readCachedMessage(storage) {
  try {
    const value = resolveStorage(storage)?.getItem(MESSAGE_CACHE_KEY);
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export function writeCachedMessage(message, storage) {
  try {
    const targetStorage = resolveStorage(storage);

    if (!targetStorage) {
      return;
    }

    const value = String(message ?? "");

    if (value.length === 0) {
      targetStorage.removeItem(MESSAGE_CACHE_KEY);
      return;
    }

    targetStorage.setItem(MESSAGE_CACHE_KEY, value);
  } catch {
    // Private browsing or blocked storage should not prevent the sign from working.
  }
}
