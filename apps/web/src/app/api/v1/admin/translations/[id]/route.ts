import { prisma } from "@cp/db";
import { adminTranslationSchema } from "@cp/shared";
import { ApiError, body, clientIp, handler } from "@/lib/api";
import { audit } from "@/lib/audit";

/** Enable or disable an imported edition. Enabling requires recorded display rights. */
export const PATCH = handler<{ id: string }>({ roles: ["ADMIN"], limit: [30, 60] }, async ({ req, params, user }) => {
  const data = await body(req, adminTranslationSchema);
  const translation = await prisma.bibleTranslation.findUnique({ where: { id: params.id }, include: { license: true } });
  if (!translation) throw new ApiError(404, "not_found");
  if (data.enabled && !translation.license.displayAllowed) throw new ApiError(409, "display_not_allowed");
  const updated = await prisma.bibleTranslation.update({ where: { id: params.id }, data: { enabled: data.enabled } });
  await audit({ actorId: user?.id, action: data.enabled ? "bible.translation.enable" : "bible.translation.disable", entityType: "bible_translation", entityId: params.id, ip: clientIp(req) });
  return { id: updated.id, enabled: updated.enabled };
});
