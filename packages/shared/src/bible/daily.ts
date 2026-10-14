import type { Passage } from "./reference";

/**
 * Curated references for the verse of the day. Only references are stored here —
 * the text is always fetched from the configured licensed/public-domain provider.
 */
export const DAILY_VERSE_REFERENCES: Passage[] = [
  { bookId: "JHN", chapter: 3, verseStart: 16 },
  { bookId: "PSA", chapter: 23, verseStart: 1 },
  { bookId: "PRO", chapter: 3, verseStart: 5, verseEnd: 6 },
  { bookId: "ISA", chapter: 40, verseStart: 31 },
  { bookId: "ROM", chapter: 8, verseStart: 28 },
  { bookId: "PHP", chapter: 4, verseStart: 6, verseEnd: 7 },
  { bookId: "MAT", chapter: 11, verseStart: 28 },
  { bookId: "JER", chapter: 29, verseStart: 11 },
  { bookId: "PSA", chapter: 46, verseStart: 1 },
  { bookId: "LAM", chapter: 3, verseStart: 22, verseEnd: 23 },
  { bookId: "2CO", chapter: 5, verseStart: 17 },
  { bookId: "GAL", chapter: 5, verseStart: 22, verseEnd: 23 },
  { bookId: "EPH", chapter: 2, verseStart: 8, verseEnd: 9 },
  { bookId: "HEB", chapter: 11, verseStart: 1 },
  { bookId: "JOS", chapter: 1, verseStart: 9 },
  { bookId: "PSA", chapter: 119, verseStart: 105 },
  { bookId: "MIC", chapter: 6, verseStart: 8 },
  { bookId: "1JN", chapter: 4, verseStart: 19 },
  { bookId: "ROM", chapter: 12, verseStart: 2 },
  { bookId: "MAT", chapter: 6, verseStart: 33 },
  { bookId: "PSA", chapter: 27, verseStart: 1 },
  { bookId: "JHN", chapter: 14, verseStart: 6 },
  { bookId: "ISA", chapter: 41, verseStart: 10 },
  { bookId: "1CO", chapter: 13, verseStart: 4, verseEnd: 7 },
  { bookId: "PHP", chapter: 4, verseStart: 13 },
  { bookId: "PSA", chapter: 37, verseStart: 4 },
  { bookId: "ROM", chapter: 15, verseStart: 13 },
  { bookId: "JHN", chapter: 16, verseStart: 33 },
  { bookId: "COL", chapter: 3, verseStart: 23 },
  { bookId: "DEU", chapter: 31, verseStart: 6 },
  { bookId: "PSA", chapter: 34, verseStart: 18 },
  { bookId: "MAT", chapter: 5, verseStart: 14, verseEnd: 16 },
  { bookId: "JAS", chapter: 1, verseStart: 5 },
  { bookId: "2TI", chapter: 1, verseStart: 7 },
  { bookId: "ISA", chapter: 26, verseStart: 3 },
  { bookId: "1PE", chapter: 5, verseStart: 7 },
  { bookId: "PSA", chapter: 121, verseStart: 1, verseEnd: 2 },
  { bookId: "ROM", chapter: 5, verseStart: 8 },
  { bookId: "JHN", chapter: 15, verseStart: 5 },
  { bookId: "HEB", chapter: 12, verseStart: 1, verseEnd: 2 },
  { bookId: "ZEP", chapter: 3, verseStart: 17 },
  { bookId: "PSA", chapter: 139, verseStart: 14 },
  { bookId: "MAT", chapter: 28, verseStart: 19, verseEnd: 20 },
  { bookId: "EPH", chapter: 3, verseStart: 20 },
  { bookId: "NUM", chapter: 6, verseStart: 24, verseEnd: 26 },
  { bookId: "JHN", chapter: 1, verseStart: 14 },
  { bookId: "ROM", chapter: 10, verseStart: 9 },
  { bookId: "1TH", chapter: 5, verseStart: 16, verseEnd: 18 },
  { bookId: "PSA", chapter: 91, verseStart: 1, verseEnd: 2 },
  { bookId: "REV", chapter: 21, verseStart: 4 },
];

/** Days since 1970-01-01 (UTC) for a date or YYYY-MM-DD string. */
export function dayNumber(date: Date | string = new Date()): number {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
}

export function dailyVerseReference(date: Date | string = new Date()): Passage {
  const list = DAILY_VERSE_REFERENCES;
  return list[dayNumber(date) % list.length]!;
}

export const isoDate = (d: Date = new Date()) => d.toISOString().slice(0, 10);
