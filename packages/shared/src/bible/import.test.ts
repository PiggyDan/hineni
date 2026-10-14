import { describe, expect, it } from "vitest";
import { bibleDatasetSchema } from "./import";
const manifest = {
  version: 1,
  translation: { id: "test-kjv", name: "KJV validation fixture", abbreviation: "KJV", language: "en", publisher: "KJV", sourceUrl: "https://example.org/fixture", license: { copyrightStatus: "public-domain", license: "Public Domain", evidenceUrl: "https://ebible.org/eng-kjv2006/copyright.htm", attribution: "King James Version — Public Domain", displayAllowed: true, downloadAllowed: true, audioAvailable: false } },
  books: [{ bookId: "PHM", chapters: [{ chapter: 1, verses: [{ verse: 1, text: "Paul, a prisoner of Jesus Christ, and Timothy our brother, unto Philemon our dearly beloved, and fellowlabourer," }] }] }],
};
describe("licensed Scripture import validation", () => {
  it("requires display permission and documentary evidence", () => {
    expect(bibleDatasetSchema.safeParse(manifest).success).toBe(true);
    const denied = structuredClone(manifest); denied.translation.license.displayAllowed = false;
    expect(bibleDatasetSchema.safeParse(denied).success).toBe(false);
    const noEvidence = structuredClone(manifest); noEvidence.translation.license.evidenceUrl = "";
    expect(bibleDatasetSchema.safeParse(noEvidence).success).toBe(false);
  });
  it("rejects duplicate books, missing chapters and noncontiguous verses", () => {
    const duplicate = structuredClone(manifest); duplicate.books.push(duplicate.books[0]!);
    expect(bibleDatasetSchema.safeParse(duplicate).success).toBe(false);
    const incomplete = structuredClone(manifest); incomplete.books[0]!.bookId = "GEN";
    expect(bibleDatasetSchema.safeParse(incomplete).success).toBe(false);
    const gap = structuredClone(manifest); gap.books[0]!.chapters[0]!.verses[0]!.verse = 2;
    expect(bibleDatasetSchema.safeParse(gap).success).toBe(false);
  });
});
