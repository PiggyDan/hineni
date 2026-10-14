import { z } from "zod";
import { BIBLE_BOOKS, bookName } from "./books";

export const editionMetadataSchema = z.object({
  direction: z.enum(["ltr", "rtl"]), versification: z.string().min(1).max(50),
  canon: z.enum(["protestant", "tanakh", "greek-nt", "provider"]),
  books: z.array(z.object({ id: z.string(), name: z.string().optional(), chapters: z.number().int().min(1).max(200) })).min(1),
});
export type EditionMetadata = z.infer<typeof editionMetadataSchema>;
export function scriptureLanguageMatches(language: string, locale: string) {
  const primary = new Intl.Locale(language).language;
  return primary === new Intl.Locale(locale).language || (primary === "hbo" && locale === "he") || (primary === "grc" && locale === "el");
}
export function scriptureDirection(language: string): "rtl" | "ltr" {
  const primary = new Intl.Locale(language).language;
  return ["he", "hbo", "ar", "fa", "ur"].includes(primary) ? "rtl" : "ltr";
}
export function editionBooks(metadata: EditionMetadata | undefined, locale: string) {
  const books: EditionMetadata["books"] = metadata?.books ?? BIBLE_BOOKS.map(book => ({ id: book.id, chapters: book.chapters }));
  return books.flatMap(book => {
    const canonical = BIBLE_BOOKS.find(value => value.id === book.id);
    return canonical ? [{ id: book.id, name: book.name || bookName(book.id, locale), chapters: book.chapters, testament: canonical.testament }] : [];
  });
}
export function editionAdjacent(metadata: EditionMetadata | undefined, bookId: string, chapter: number, delta: -1 | 1) {
  const books = editionBooks(metadata, "en"); const index = books.findIndex(book => book.id === bookId); const book = books[index];
  if (!book) return null;
  const next = chapter + delta;
  if (next >= 1 && next <= book.chapters) return { bookId, chapter: next };
  const adjacent = books[index + delta];
  return adjacent ? { bookId: adjacent.id, chapter: delta === 1 ? 1 : adjacent.chapters } : null;
}
