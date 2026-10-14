import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { BIBLE_BOOKS, bibleDatasetSchema } from "@cp/shared";
import { prisma } from "../src";

async function main() {
  const filename = process.argv[2];
  if (!filename || !process.argv.includes("--confirm-rights")) throw new Error("Usage: import:bible <verified-dataset.json> --confirm-rights. Confirm rights only after reviewing documentary evidence.");
  const raw = await readFile(filename);
  const dataset = bibleDatasetSchema.parse(JSON.parse(raw.toString("utf8")));
  const { license, ...translation } = dataset.translation;
  const checksum = createHash("sha256").update(raw).digest("hex");
  const existing = await prisma.bibleTranslation.findUnique({ where: { id: translation.id } });
  if (existing) {
    if (existing.sourceChecksum !== checksum) throw new Error("Translation already exists with different content. Import a new version id; never overwrite published Scripture.");
    console.log(`Already imported: ${translation.id}`); return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.bibleLicense.create({ data: { id: `${translation.id}-license`, ...license } });
    await tx.bibleTranslation.create({ data: { ...translation, metadata: translation.metadata ?? {}, sourceChecksum: checksum, licenseId: `${translation.id}-license`, enabled: false } });
    for (const book of dataset.books) {
      const canonical = BIBLE_BOOKS.find((value) => value.id === book.bookId)!;
      await tx.bibleBook.upsert({ where: { id: book.bookId }, create: { id: canonical.id, order: canonical.order, testament: canonical.testament, chapters: canonical.chapters, nameEn: canonical.name.en, nameMn: canonical.name.mn }, update: {} });
      for (const chapter of book.chapters) {
        await tx.bibleChapter.create({ data: { translationId: translation.id, bookId: book.bookId, chapter: chapter.chapter } });
        await tx.bibleVerse.createMany({ data: chapter.verses.map((verse) => ({ translationId: translation.id, bookId: book.bookId, chapter: chapter.chapter, ...verse, searchText: verse.text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase() })) });
      }
    }
    await tx.bibleTranslation.update({ where: { id: translation.id }, data: { enabled: true } });
    await tx.auditLog.create({ data: { action: "bible.import", entityType: "bible_translation", entityId: translation.id, metadata: { checksum, books: dataset.books.length, evidenceUrl: license.evidenceUrl } } });
  }, { timeout: 180000, maxWait: 10000 });
  console.log(`Imported ${translation.id}: ${dataset.books.length} books with license evidence and indexed canonical verses`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Import failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
