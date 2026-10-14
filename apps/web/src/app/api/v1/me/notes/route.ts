import { validateSelection } from "@/lib/bible/validate-selection";
import { prisma } from "@cp/db";
import { noteCreateSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { decryptForUser, encryptForUser } from "@/lib/crypto";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return notes.map((note) => ({
    id: note.id,
    bookId: note.bookId,
    chapter: note.chapter,
    translationId: note.translationId,
    verseStart: note.verseStart,
    verseEnd: note.verseEnd,
    body: decryptForUser(user.id, note.bodyCipher),
    updatedAt: note.updatedAt.toISOString(),
  }));
});

export const POST = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, noteCreateSchema);
  await validateSelection(data.translationId ?? "kjv", data.passage);
  const created = await prisma.note.create({
    data: {
      userId: user.id,
      bookId: data.passage.bookId,
      chapter: data.passage.chapter,
      translationId: data.translationId ?? null,
      verseStart: data.passage.verseStart ?? null,
      verseEnd: data.passage.verseEnd ?? null,
      bodyCipher: encryptForUser(user.id, data.body),
    },
  });

  return {
    id: created.id,
    verseStart: created.verseStart,
    verseEnd: created.verseEnd,
    body: data.body,
  };
});
