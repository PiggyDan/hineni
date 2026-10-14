import { validateSelection } from "@/lib/bible/validate-selection";
import { prisma } from "@cp/db";
import { bookmarkCreateSchema, passageKey } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  return prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      passageKey: true,
      verseStart: true,
      verseEnd: true,
      label: true,
      bookId: true,
      chapter: true,
      translationId: true,
      createdAt: true,
    },
  });
});

export const POST = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, bookmarkCreateSchema);
  await validateSelection(data.translationId , data.passage);
  const passageKeyValue = passageKey(data.passage);

  const existing = await prisma.bookmark.findUnique({
    where: { userId_passageKey_translationId: { userId: user.id, passageKey: passageKeyValue, translationId: data.translationId } },
  });

  if (existing) {
    return {
      id: existing.id,
      passageKey: existing.passageKey,
      verseStart: existing.verseStart,
      verseEnd: existing.verseEnd,
    };
  }

  const created = await prisma.bookmark.create({
    data: {
      userId: user.id,
      passageKey: passageKeyValue,
      bookId: data.passage.bookId,
      chapter: data.passage.chapter,
      verseStart: data.passage.verseStart ?? null,
      verseEnd: data.passage.verseEnd ?? null,
      translationId: data.translationId,
      label: data.label ?? null,
    },
  });

  return {
    id: created.id,
    passageKey: created.passageKey,
    verseStart: created.verseStart,
    verseEnd: created.verseEnd,
  };
});
