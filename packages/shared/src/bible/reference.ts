import { BIBLE_BOOKS, getBook, bookName, type BibleBook } from "./books";
import { locales } from "../i18n";
import type { EditionMetadata } from "./edition";
import { globalBookNames } from "./global-book-names";

export interface Passage {
  bookId: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[\s.]/g, "");

const exact = new Map<string, BibleBook>();
for (const b of BIBLE_BOOKS) {
  for (const key of [b.id, ...locales.map((locale) => bookName(b.id, locale)), ...Object.values(globalBookNames).map(names => names[b.order - 1]!).filter(Boolean), ...b.aliases]) {
    const k = normalize(key);
    if (!exact.has(k)) exact.set(k, b);
  }
}

export function findBook(input: string): BibleBook | undefined {
  const key = normalize(input);
  if (!key) return undefined;
  const hit = exact.get(key);
  if (hit) return hit;
  // Unambiguous prefix of a localized book name.
  const matches = BIBLE_BOOKS.filter(
    (b) => locales.some((locale) => normalize(bookName(b.id, locale)).startsWith(key)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

const REF_RE = /^\s*(\d?\s*[^\d:]+?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\s*$/u;

/** Parses "John 3:16", "1 Cor 13:4-7", "Ps 23", "Иохан 3:16". Returns null if invalid. */
export function parseReference(input: string, metadata?: EditionMetadata): Passage | null {
  const m = REF_RE.exec(input);
  if (!m) {
    // A bare book name ("Romans") resolves to chapter 1.
    const book = findBook(input);
    return book && (!metadata || metadata.books.some(item => item.id === book.id)) ? { bookId: book.id, chapter: 1 } : null;
  }
  const book = findBook(m[1]!);
  if (!book) return null;
  const chapter = Number(m[2]);
  const chapters = metadata ? metadata.books.find(item => item.id === book.id)?.chapters : book.chapters;
  if (!chapters || chapter < 1 || chapter > chapters) return null;
  const passage: Passage = { bookId: book.id, chapter };
  if (m[3]) {
    passage.verseStart = Number(m[3]);
    if (passage.verseStart < 1) return null;
    if (m[4]) {
      passage.verseEnd = Number(m[4]);
      if (passage.verseEnd < passage.verseStart) return null;
    }
  }
  return passage;
}

export function formatReference(p: Passage, locale = "en"): string {
  let s = `${bookName(p.bookId, locale)} ${p.chapter}`;
  if (p.verseStart) {
    s += `:${p.verseStart}`;
    if (p.verseEnd && p.verseEnd !== p.verseStart) s += `–${p.verseEnd}`;
  }
  return s;
}

/** Stable machine key, e.g. "JHN.3.16-18". */
export function passageKey(p: Passage): string {
  let s = `${p.bookId}.${p.chapter}`;
  if (p.verseStart) s += `.${p.verseStart}`;
  if (p.verseEnd && p.verseEnd !== p.verseStart) s += `-${p.verseEnd}`;
  return s;
}

export function parsePassageKey(key: string): Passage | null {
  const m = /^([1-3A-Z]{3})\.(\d+)(?:\.(\d+)(?:-(\d+))?)?$/.exec(key);
  if (!m || !getBook(m[1]!)) return null;
  const p: Passage = { bookId: m[1]!, chapter: Number(m[2]) };
  if (m[3]) p.verseStart = Number(m[3]);
  if (m[4]) p.verseEnd = Number(m[4]);
  return p;
}
