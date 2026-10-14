import { prisma } from "@cp/db";
import { ApiError, handler } from "@/lib/api";

export const DELETE = handler<{ id: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const bookmark = await prisma.bookmark.findUnique({ where: { id: params.id } });
  if (!bookmark || bookmark.userId !== user.id) throw new ApiError(404, "not_found");

  await prisma.bookmark.delete({ where: { id: params.id } });
  return { ok: true };
});
