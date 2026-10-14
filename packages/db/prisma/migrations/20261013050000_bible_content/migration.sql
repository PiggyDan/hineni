-- Additive only: no existing tables, records, or encryption keys are modified.
CREATE TABLE "bible_license" (
  "id" TEXT PRIMARY KEY,
  "copyrightStatus" TEXT NOT NULL,
  "license" TEXT NOT NULL,
  "evidenceUrl" TEXT NOT NULL,
  "attribution" TEXT NOT NULL,
  "displayAllowed" BOOLEAN NOT NULL DEFAULT false,
  "downloadAllowed" BOOLEAN NOT NULL DEFAULT false,
  "audioAvailable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "bible_translation" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "abbreviation" TEXT NOT NULL,
  "language" TEXT NOT NULL, "publisher" TEXT NOT NULL, "sourceUrl" TEXT NOT NULL,
  "sourceChecksum" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false,
  "licenseId" TEXT NOT NULL, "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bible_translation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "bible_license"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "bible_translation_licenseId_key" ON "bible_translation"("licenseId");
CREATE INDEX "bible_translation_enabled_language_idx" ON "bible_translation"("enabled", "language");
CREATE TABLE "bible_book" (
  "id" TEXT PRIMARY KEY, "order" INTEGER NOT NULL, "testament" TEXT NOT NULL,
  "chapters" INTEGER NOT NULL, "nameEn" TEXT NOT NULL, "nameMn" TEXT NOT NULL
);
CREATE UNIQUE INDEX "bible_book_order_key" ON "bible_book"("order");
CREATE TABLE "bible_chapter" (
  "translationId" TEXT NOT NULL, "bookId" TEXT NOT NULL, "chapter" INTEGER NOT NULL CHECK ("chapter" > 0),
  PRIMARY KEY ("translationId", "bookId", "chapter"),
  CONSTRAINT "bible_chapter_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "bible_translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bible_chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "bible_book"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "bible_verse" (
  "translationId" TEXT NOT NULL, "bookId" TEXT NOT NULL,
  "chapter" INTEGER NOT NULL CHECK ("chapter" > 0), "verse" INTEGER NOT NULL CHECK ("verse" > 0), "text" TEXT NOT NULL,
  "search_vector" TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, "text")) STORED,
  PRIMARY KEY ("translationId", "bookId", "chapter", "verse"),
  CONSTRAINT "bible_verse_translationId_bookId_chapter_fkey" FOREIGN KEY ("translationId", "bookId", "chapter") REFERENCES "bible_chapter"("translationId", "bookId", "chapter") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "bible_verse_search_idx" ON "bible_verse" USING GIN ("search_vector");
