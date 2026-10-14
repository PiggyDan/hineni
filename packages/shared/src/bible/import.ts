import { z } from "zod";
import { getBook } from "./books";
import { editionMetadataSchema } from "./edition";

export const bibleDatasetSchema = z.object({
  version: z.literal(1),
  translation: z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/), name: z.string().min(1).max(200), abbreviation: z.string().min(1).max(30),
    language: z.string().min(2).max(20), publisher: z.string().min(1).max(200), sourceUrl: z.url(),
    metadata: editionMetadataSchema.optional(),
    license: z.object({ copyrightStatus: z.enum(["public-domain", "licensed"]), license: z.string().min(1), evidenceUrl: z.url(), attribution: z.string().min(1), displayAllowed: z.literal(true), downloadAllowed: z.boolean(), audioAvailable: z.boolean() }),
  }),
  books: z.array(z.object({
    bookId: z.string().refine((id) => !!getBook(id) && getBook(id)?.id === id, "Use canonical USFM ids"),
    chapters: z.array(z.object({ chapter: z.number().int().positive(), verses: z.array(z.object({ verse: z.number().int().positive(), text: z.string().trim().min(1).max(10000) })).min(1) })).min(1),
  })).min(1).max(66),
}).superRefine((dataset, ctx) => {
  const seen = new Set<string>();
  dataset.books.forEach((book, index) => {
    if (seen.has(book.bookId)) ctx.addIssue({ code: "custom", path: ["books", index], message: "Duplicate book" });
    seen.add(book.bookId);
    const declared = dataset.translation.metadata?.books.find(value => value.id === book.bookId);
    const chapterCount = declared?.chapters ?? getBook(book.bookId)?.chapters;
    if (dataset.translation.metadata && !declared) ctx.addIssue({ code: "custom", path: ["books", index], message: "Book is missing from edition metadata" });
    if (book.chapters.length !== chapterCount) ctx.addIssue({ code: "custom", path: ["books", index, "chapters"], message: "Import complete books only" });
    book.chapters.forEach((chapter, c) => {
      if (chapter.chapter !== c + 1) ctx.addIssue({ code: "custom", path: ["books", index, "chapters", c], message: "Chapters must be contiguous" });
      chapter.verses.forEach((verse, v) => {
        if (dataset.translation.metadata ? (v > 0 && verse.verse <= chapter.verses[v - 1]!.verse) : verse.verse !== v + 1) ctx.addIssue({ code: "custom", path: ["books", index, "chapters", c, "verses", v], message: "Preserve unique source verse numbers in order" });
      });
    });
  });
  if (dataset.translation.metadata && dataset.translation.metadata.books.length !== dataset.books.length) ctx.addIssue({ code: "custom", path: ["books"], message: "Declared coverage does not match dataset" });
});
export type BibleDataset = z.infer<typeof bibleDatasetSchema>;
