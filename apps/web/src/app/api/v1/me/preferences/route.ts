import { prisma } from "@cp/db";
import { preferencesSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { getTranslation } from "@/lib/bible";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      locale: true,
      theme: true,
      readerFontSize: true,
      translationId: true,
      dailyReminder: true,
      reminderTime: true,
      timezone: true,
    },
  });
  return row ?? {};
});

export const PATCH = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, preferencesSchema);
  if (data.translationId && !(await getTranslation(data.translationId))) throw new ApiError(400, "translation_unavailable");
  const row = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      locale: true,
      theme: true,
      readerFontSize: true,
      translationId: true,
      dailyReminder: true,
      reminderTime: true,
      timezone: true,
    },
  });
  return row;
});
