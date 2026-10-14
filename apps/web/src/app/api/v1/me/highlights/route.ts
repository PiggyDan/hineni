import { validateSelection } from "@/lib/bible/validate-selection";
import { prisma } from "@cp/db";
import { highlightUpsertSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  return prisma.highlight.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
});

export const PUT = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, highlightUpsertSchema);
  await validateSelection(data.translationId, { bookId: data.bookId, chapter: data.chapter }, data.verses);
  const color = data.color;

  await prisma.$transaction(async (tx) => {
    await tx.highlight.deleteMany({
      where: {
        userId: user.id,
        bookId: data.bookId,
        chapter: data.chapter,
        translationId: data.translationId,
        verse: { in: data.verses },
      },
    });

    if (color === null) return;

    await Promise.all(
      data.verses.map((verse) =>
        tx.highlight.upsert({
          where: {
            userId_bookId_chapter_verse_translationId: { userId: user.id, bookId: data.bookId, chapter: data.chapter, verse, translationId: data.translationId },
          },
          update: { color, translationId: data.translationId, updatedAt: new Date() },
          create: {
            userId: user.id,
            bookId: data.bookId,
            chapter: data.chapter,
            verse,
            color,
            translationId: data.translationId,
          },
        }),
      ),
    );
  });

  return { ok: true };
});
