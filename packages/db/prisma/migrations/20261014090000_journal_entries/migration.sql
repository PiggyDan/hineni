-- Additive: private, encrypted journal entries. No existing table is altered.
CREATE TABLE "journal_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleCipher" TEXT NOT NULL,
    "bodyCipher" TEXT NOT NULL,
    "refsCipher" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "journal_entry_userId_updatedAt_idx" ON "journal_entry"("userId", "updatedAt");

ALTER TABLE "journal_entry" ADD CONSTRAINT "journal_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
