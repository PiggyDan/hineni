-- Preserve all Scripture and personal records. Add edition metadata/search support.
ALTER TABLE "bible_translation" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "bible_verse" ADD COLUMN "search_text" TEXT NOT NULL DEFAULT '';
UPDATE "bible_verse" SET "search_text" = lower("text");
ALTER TABLE "bible_verse" ADD COLUMN "search_vector_normalized" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "search_text")) STORED;
CREATE INDEX "bible_verse_normalized_search_idx" ON "bible_verse" USING GIN ("search_vector_normalized");
ALTER TABLE "note" ADD COLUMN "translationId" TEXT;
-- Relax edition-blind uniqueness without deleting records; create replacements first.
CREATE UNIQUE INDEX "bookmark_userId_passageKey_translationId_key" ON "bookmark"("userId", "passageKey", "translationId");
DROP INDEX "bookmark_userId_passageKey_key";
CREATE UNIQUE INDEX "highlight_userId_bookId_chapter_verse_translationId_key" ON "highlight"("userId", "bookId", "chapter", "verse", "translationId");
DROP INDEX "highlight_userId_bookId_chapter_verse_key";
CREATE UNIQUE INDEX "reading_history_userId_bookId_chapter_translationId_key" ON "reading_history"("userId", "bookId", "chapter", "translationId");
DROP INDEX "reading_history_userId_bookId_chapter_key";
