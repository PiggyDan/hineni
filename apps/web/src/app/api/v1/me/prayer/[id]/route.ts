import { prisma } from "@cp/db";
import { prayerUpdateSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { decryptForUser, encryptForUser } from "@/lib/crypto";

const serialize = (userId: string, prayer: { id: string; titleCipher: string; bodyCipher: string; category: string; answered: boolean; answerNoteCipher: string | null; createdAt: Date; updatedAt: Date }) => ({
  id: prayer.id,
  title: decryptForUser(userId, prayer.titleCipher),
  body: decryptForUser(userId, prayer.bodyCipher),
  category: prayer.category,
  answered: prayer.answered,
  answerNote: prayer.answerNoteCipher ? decryptForUser(userId, prayer.answerNoteCipher) : null,
  createdAt: prayer.createdAt.toISOString(),
  updatedAt: prayer.updatedAt.toISOString(),
});

export const PATCH = handler<{ id: string }>({ auth: true }, async ({ req, params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const prayer = await prisma.prayer.findUnique({ where: { id: params.id } });
  if (!prayer || prayer.userId !== user.id) throw new ApiError(404, "not_found");

  const data = await body(req, prayerUpdateSchema);
  const updated = await prisma.prayer.update({
    where: { id: params.id },
    data: {
      ...(data.title ? { titleCipher: encryptForUser(user.id, data.title) } : {}),
      ...(data.body ? { bodyCipher: encryptForUser(user.id, data.body) } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.answered !== undefined ? { answered: data.answered, answeredAt: data.answered ? new Date() : null } : {}),
      ...(data.answerNote !== undefined ? { answerNoteCipher: data.answerNote ? encryptForUser(user.id, data.answerNote) : null } : {}),
    },
  });

  return serialize(user.id, updated);
});

export const DELETE = handler<{ id: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const prayer = await prisma.prayer.findUnique({ where: { id: params.id } });
  if (!prayer || prayer.userId !== user.id) throw new ApiError(404, "not_found");

  await prisma.prayer.delete({ where: { id: params.id } });
  return { ok: true };
});
