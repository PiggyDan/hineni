/** Device-local "continue reading" position. Contains only a reference, never Scripture text. */
export interface LastLocation {
  bookId: string;
  chapter: number;
  translationId: string;
  at: string;
}

const KEY = "hineni:last-read";
let cached: { raw: string | null; value: LastLocation | null } = { raw: null, value: null };

export function readLastLocation(): LastLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    // useSyncExternalStore requires a stable snapshot for unchanged storage.
    if (raw === cached.raw) return cached.value;
    const parsed = raw ? (JSON.parse(raw) as LastLocation) : null;
    const value =
      parsed && /^[1-3A-Z]{3}$/.test(parsed.bookId) && Number.isInteger(parsed.chapter) && typeof parsed.translationId === "string"
        ? parsed
        : null;
    cached = { raw, value };
    return value;
  } catch {
    return null;
  }
}

export function writeLastLocation(location: Omit<LastLocation, "at">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...location, at: new Date().toISOString() }));
  } catch {
    /* storage unavailable (private mode) */
  }
}
