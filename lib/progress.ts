"use client";

import { useSyncExternalStore } from "react";
import { LEGACY_ROADMAP_IDS } from "@/lib/roadmap-legacy";

/**
 * Reading progress, kept in this browser only (no accounts yet).
 *
 * - done pages: the same key the homepage roadmap has always used, so marks
 *   made on the roadmap, the sidebar and "Mark as done" are one list;
 * - last read: the page a reader was on and how far down, for
 *   "Continue where you left off".
 */
const DONE_KEY = "sd-roadmap-visited";
const LAST_KEY = "masst-last-read";
const EVENT = "masst-progress";

export type LastRead = { url: string; title: string; percent: number; at: number };

function readJson<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: progress just isn't kept.
  }
  window.dispatchEvent(new Event(EVENT));
}

let doneCache: { raw: string | null; set: Set<string> } = { raw: null, set: new Set() };
function getDone(): Set<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DONE_KEY);
  } catch {}
  if (raw !== doneCache.raw) {
    const ids: string[] = raw ? JSON.parse(raw) : [];
    doneCache = { raw, set: new Set(ids.map((id) => LEGACY_ROADMAP_IDS[id] ?? id)) };
  }
  return doneCache.set;
}
const EMPTY = new Set<string>();

let lastCache: { raw: string | null; value: LastRead | null } = { raw: null, value: null };
function getLast(): LastRead | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LAST_KEY);
  } catch {}
  if (raw !== lastCache.raw) lastCache = { raw, value: raw ? (JSON.parse(raw) as LastRead) : null };
  return lastCache.value;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Pages marked done. Empty during server render and first paint. */
export function useDone(): Set<string> {
  return useSyncExternalStore(subscribe, getDone, () => EMPTY);
}

export function useLastRead(): LastRead | null {
  return useSyncExternalStore(subscribe, getLast, () => null);
}

export function setDone(url: string, done: boolean) {
  const next = new Set(getDone());
  if (done) next.add(url);
  else next.delete(url);
  writeJson(DONE_KEY, [...next]);
}

/** Remember the page and the furthest point reached on it (scrolling back up keeps it). */
export function saveLastRead(entry: Omit<LastRead, "at">) {
  const prev = readJson<LastRead>(LAST_KEY);
  const percent = prev && prev.url === entry.url ? Math.max(prev.percent, entry.percent) : entry.percent;
  // Avoid a write per scroll event when nothing meaningful changed.
  if (prev && prev.url === entry.url && percent - prev.percent < 3) return;
  writeJson(LAST_KEY, { ...entry, percent, at: Date.now() });
}
