"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/*
 * False during SSR and on the first client render, true afterwards.
 *
 * Anything restored from localStorage (cart, wishlist, session) differs between
 * the server and the browser, so components must render the server-safe value
 * until this flips — otherwise React hydrates against markup that doesn't match.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/* Reads JSON out of localStorage, tolerating absent or corrupt values. */
export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode or a full quota — not worth breaking the page over. */
  }
}
