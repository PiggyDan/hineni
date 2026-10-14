import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BIBLE_BOOKS, bibleDatasetSchema } from "@cp/shared";

async function main() {
  const sourceUrl = "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json";
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Dataset download failed: HTTP ${response.status}`);
  const source = await response.json() as { abbrev: string; chapters: string[][] }[];
  if (source.length !== 66) throw new Error("Expected the 66-book KJV dataset");
  const dataset = bibleDatasetSchema.parse({
    version: 1,
    translation: {
      id: "kjv", name: "King James Version", abbreviation: "KJV", language: "en", publisher: "King James Version (1769 text)", sourceUrl,
      license: { copyrightStatus: "public-domain", license: "Public Domain; regional restrictions may apply", evidenceUrl: "https://ebible.org/eng-kjv2006/copyright.htm", attribution: "King James Version — Public Domain (outside applicable regional restrictions). Dataset: thiagobodruk/bible.", displayAllowed: true, downloadAllowed: true, audioAvailable: false },
    },
    books: source.map((book, index) => ({ bookId: BIBLE_BOOKS[index]!.id, chapters: book.chapters.map((verses, c) => ({ chapter: c + 1, verses: verses.map((text, v) => ({ verse: v + 1, text })) })) })),
  });
  const output = resolve(process.argv[2] || "../../.local/bible/kjv.json");
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, JSON.stringify(dataset));
  console.log(`Prepared ${dataset.books.length} canonical books at ${output}. Review source/license evidence before import --confirm-rights.`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Preparation failed"); process.exitCode = 1; });
