import "server-only";
import { prisma } from "@cp/db";
import { BIBLE_BOOKS, type Passage } from "@cp/shared";

export const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);

/** Distinct chapters a reader has opened, across all editions. */
export async function chaptersReadCount(userId: string): Promise<number> {
  const rows = await prisma.readingHistory.groupBy({ by: ["bookId", "chapter"], where: { userId } }).catch(() => []);
  return rows.length;
}

export const planDays = (plan: { days: unknown }): Passage[][] =>
  (Array.isArray(plan.days) ? plan.days : []).filter(Array.isArray).map((day) => day as Passage[]);

export function planProgress(dayCount: number, completedDays: number[]) {
  const done = new Set(completedDays.filter((day) => day >= 1 && day <= dayCount));
  let nextDay = 1;
  while (done.has(nextDay) && nextDay <= dayCount) nextDay++;
  return {
    completed: done.size,
    percent: dayCount ? Math.round((done.size / dayCount) * 100) : 0,
    nextDay: nextDay > dayCount ? null : nextDay,
  };
}

export function readingHref(passage: Passage, translationId?: string) {
  const query = translationId ? `?t=${encodeURIComponent(translationId)}` : "";
  const anchor = passage.verseStart ? `#v${passage.verseStart}` : "";
  return `/bible/${passage.bookId.toLowerCase()}/${passage.chapter}${query}${anchor}`;
}
