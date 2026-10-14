import { validateSelection } from "@/lib/bible/validate-selection";
import { prisma } from "@cp/db";
import { historyCreateSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  return prisma.readingHistory.findMany({
    where: { userId: user.id },
    orderBy: { readAt: "desc" },
    take: 20,
    select: { id: true, bookId: true, chapter: true, translationId: true, readAt: true },
  });
});

export const POST = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, historyCreateSchema);
  await validateSelection(data.translationId, { bookId: data.bookId, chapter: data.chapter });
  await prisma.readingHistory.upsert({
    where: {
      userId_bookId_chapter_translationId: { userId: user.id, bookId: data.bookId, chapter: data.chapter, translationId: data.translationId },
    },
    update: { translationId: data.translationId, readAt: new Date() },
    create: {
      userId: user.id,
      bookId: data.bookId,
      chapter: data.chapter,
      translationId: data.translationId,
    },
  });

  return { ok: true };
});
