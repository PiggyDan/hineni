import { prisma } from "@cp/db";
import { ScriptureUnavailableError, type BibleProvider } from "./types";
import { editionMetadataSchema, getBook, scriptureDirection, type EditionMetadata } from "@cp/shared";

export const databaseBibleProvider: BibleProvider = {
  id: "postgresql",
  async translations() {
    const rows = await prisma.bibleTranslation.findMany({ where: { enabled: true, license: { displayAllowed: true } }, include: { license: true }, orderBy: { language: "asc" } });
    return Promise.all(rows.map(async (row) => {
      const parsed = editionMetadataSchema.safeParse(row.metadata);
      let metadata: EditionMetadata | undefined = parsed.success ? parsed.data : undefined;
      if (!metadata) {
        const chapters = await prisma.bibleChapter.groupBy({ by: ["bookId"], where: { translationId: row.id }, _max: { chapter: true } });
        const books = chapters.map(item => ({ id: item.bookId, chapters: item._max.chapter ?? 1 })).sort((a, b) => (getBook(a.id)?.order ?? 1000) - (getBook(b.id)?.order ?? 1000));
        if (books.length) metadata = { direction: scriptureDirection(row.language), canon: "protestant", versification: row.id === "kjv" ? "kjv" : "provider", books };
      }
      return {
      id: row.id, name: row.name, abbreviation: row.abbreviation, language: row.language,
      providerId: "postgresql", providerTranslationId: row.id, license: row.license.license, cacheable: false,
      publisher: row.publisher, copyrightStatus: row.license.copyrightStatus === "public-domain" ? "public-domain" as const : "licensed" as const,
      attribution: row.license.attribution, downloadAllowed: row.license.downloadAllowed, audioAvailable: row.license.audioAvailable,
      metadata,
    }; }));
  },
  async getChapter(translation, bookId, chapter) {
    const record = await prisma.bibleTranslation.findFirst({ where: { id: translation.id, enabled: true, license: { displayAllowed: true } }, include: { license: true } });
    if (!record) throw new ScriptureUnavailableError("Imported translation is disabled or lacks display rights");
    const verses = await prisma.bibleVerse.findMany({ where: { translationId: translation.id, bookId, chapter }, orderBy: { verse: "asc" }, select: { verse: true, text: true } });
    if (!verses.length) throw new ScriptureUnavailableError("This chapter is not included in the imported edition");
    return { translationId: translation.id, bookId, chapter, verses, copyright: record.license.attribution };
  },
};
