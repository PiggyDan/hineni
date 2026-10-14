"use client";

import { useSyncExternalStore } from "react";
import { typography } from "@cp/shared";

/** Device-level reading preferences shared by the settings sheet, the reader and Settings page. */
export interface ReaderPrefs {
  font: "serif" | "sans";
  size: number;
  leading: keyof typeof typography.readerLineHeights;
  layout: "paragraph" | "verses";
  numbers: boolean;
}

const KEY = "hineni:reader";
const LEGACY_SIZE_KEY = "reader:fontSize";
const LEGACY_NUMBERS_KEY = "reader:verseNumbers";

export const defaultPrefs: ReaderPrefs = { font: "serif", size: 20, leading: "comfortable", layout: "paragraph", numbers: true };
export const readerSizes = typography.readerSizes;

const listeners = new Set<() => void>();
let snapshot: ReaderPrefs | null = null;

function sanitize(value: Partial<ReaderPrefs>): ReaderPrefs {
  return {
    font: value.font === "sans" ? "sans" : "serif",
    size: typeof value.size === "number" && value.size >= 14 && value.size <= 32 ? value.size : defaultPrefs.size,
    leading: value.leading && value.leading in typography.readerLineHeights ? value.leading : defaultPrefs.leading,
    layout: value.layout === "verses" ? "verses" : "paragraph",
    numbers: value.numbers !== false,
  };
}

function load(): ReaderPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw) as Partial<ReaderPrefs>);
    // Carry over preferences saved by the previous reader.
    const size = localStorage.getItem(LEGACY_SIZE_KEY);
    const numbers = localStorage.getItem(LEGACY_NUMBERS_KEY);
    return sanitize({ size: size ? Number(JSON.parse(size)) : undefined, numbers: numbers ? JSON.parse(numbers) !== false : undefined });
  } catch {
    return defaultPrefs;
  }
}

function getSnapshot(): ReaderPrefs {
  snapshot ??= load();
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    snapshot = load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setReaderPrefs(patch: Partial<ReaderPrefs>) {
  snapshot = sanitize({ ...getSnapshot(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* storage unavailable: keep the in-memory value for this session */
  }
  listeners.forEach((listener) => listener());
}

/** `serverSize` seeds the first render (e.g. a signed-in reader's account font size). */
export function useReaderPrefs(serverSize?: number): ReaderPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, () => (serverSize ? { ...defaultPrefs, size: serverSize } : defaultPrefs));
}

export function readerStyle(prefs: ReaderPrefs): React.CSSProperties {
  return {
    "--reader-font": prefs.font === "sans" ? "var(--font-inter), system-ui, sans-serif" : "var(--font-serif), Georgia, serif",
    "--reader-size": `${prefs.size}px`,
    "--reader-leading": String(typography.readerLineHeights[prefs.leading]),
  } as React.CSSProperties;
}
