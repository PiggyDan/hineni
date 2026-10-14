import "server-only";
import { prisma } from "@cp/db";
import { resolveTranslation } from "./bible";
import { cookies } from "next/headers";
import { getCurrentUser } from "./session";

/** Translation + reader preferences for the current visitor (URL param > saved preference > locale default). */
export async function readerContext(locale: string, requested?: string | null) {
  const user = await getCurrentUser();
  const prefs = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { translationId: true, readerFontSize: true },
      })
    : null;
  const savedCookie = (await cookies()).get("hineni-bible")?.value;
  const saved = savedCookie && /^[a-z0-9][a-z0-9-]{0,39}$/.test(savedCookie) ? savedCookie : prefs?.translationId;
  const requestedId = requested || saved || undefined;
  const { translation, fallback } = await resolveTranslation(requestedId, locale);
  return { user, translation, fallback, requestedId, fontSize: prefs?.readerFontSize ?? 18 };
}
