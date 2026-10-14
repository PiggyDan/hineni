import { prisma } from "@cp/db";
import { noteUpdateSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { decryptForUser, encryptForUser } from "@/lib/crypto";

async function ownedNote(id: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) throw new ApiError(404, "not_found");
  return note;
}

export const PATCH = handler<{ id: string }>({ auth: true }, async ({ req, params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  await ownedNote(params.id, user.id);
  const data = await body(req, noteUpdateSchema);
  const updated = await prisma.note.update({ where: { id: params.id }, data: { bodyCipher: encryptForUser(user.id, data.body) } });
  return {
    id: updated.id,
    verseStart: updated.verseStart,
    verseEnd: updated.verseEnd,
    body: decryptForUser(user.id, updated.bodyCipher),
    updatedAt: updated.updatedAt.toISOString(),
  };
});

export const DELETE = handler<{ id: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  await ownedNote(params.id, user.id);
  await prisma.note.delete({ where: { id: params.id } });
  return { ok: true };
});
