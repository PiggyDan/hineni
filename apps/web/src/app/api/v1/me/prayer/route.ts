import { prisma } from "@cp/db";
import { prayerCreateSchema, prayerQuerySchema } from "@cp/shared";
import { ApiError, body, handler, query } from "@/lib/api";
import { decryptForUser, encryptForUser } from "@/lib/crypto";

const serialize = (userId: string, prayer: Awaited<ReturnType<typeof prisma.prayer.findMany>>[number]) => ({
  id: prayer.id,
  title: decryptForUser(userId, prayer.titleCipher),
  body: decryptForUser(userId, prayer.bodyCipher),
  category: prayer.category,
  answered: prayer.answered,
  answerNote: prayer.answerNoteCipher ? decryptForUser(userId, prayer.answerNoteCipher) : null,
  createdAt: prayer.createdAt.toISOString(),
  updatedAt: prayer.updatedAt.toISOString(),
});

export const GET = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const params = query(req, prayerQuerySchema);
  const where = {
    userId: user.id,
    ...(params.category ? { category: params.category } : {}),
    ...(params.status === "answered" ? { answered: true } : params.status === "open" ? { answered: false } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.prayer.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.prayer.count({ where }),
  ]);

  return {
    items: items.map((prayer) => serialize(user.id, prayer)),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
});

export const POST = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, prayerCreateSchema);
  const created = await prisma.prayer.create({
    data: {
      userId: user.id,
      titleCipher: encryptForUser(user.id, data.title),
      bodyCipher: encryptForUser(user.id, data.body),
      category: data.category,
    },
  });

  return serialize(user.id, created);
});
