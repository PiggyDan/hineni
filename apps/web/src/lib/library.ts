import "server-only";
import { prisma } from "@cp/db";
import { decryptForUser } from "./crypto";

/** Everything the reader needs about one chapter for one user. Ownership is enforced by userId. */
export async function chapterUserData(userId: string, bookId: string, chapter: number, translationId: string) {
  const [highlights, bookmarks, notes] = await Promise.all([
    prisma.highlight.findMany({ where: { userId, bookId, chapter, translationId }, select: { verse: true, color: true } }),
    prisma.bookmark.findMany({
      where: { userId, bookId, chapter, translationId },
      select: { id: true, passageKey: true, verseStart: true, verseEnd: true },
    }),
    prisma.note.findMany({ where: { userId, bookId, chapter, OR: [{ translationId }, ...(translationId === "kjv" ? [{ translationId: null }] : [])] }, orderBy: { createdAt: "asc" } }),
  ]);
  return {
    highlights: Object.fromEntries(highlights.map((h) => [h.verse, h.color])) as Record<number, string>,
    bookmarks,
    notes: notes.map((n) => ({
      id: n.id,
      verseStart: n.verseStart,
      verseEnd: n.verseEnd,
      body: decryptForUser(userId, n.bodyCipher),
      updatedAt: n.updatedAt.toISOString(),
    })),
  };
}

export type ChapterUserData = Awaited<ReturnType<typeof chapterUserData>>;
