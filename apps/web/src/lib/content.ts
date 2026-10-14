import "server-only";
import { prisma, type ContentType } from "@cp/db";

/** Published CMS content for a locale. Drafts are never returned to the public site. */
export async function publishedContent(opts: {
  locale: string;
  type?: ContentType;
  featured?: boolean;
  take?: number;
  skip?: number;
  q?: string;
  /** Hide items scheduled for a future date. */
  releasedOnly?: boolean;
}) {
  return prisma.content
    .findMany({
      where: {
        status: "PUBLISHED",
        locale: opts.locale,
        ...(opts.type ? { type: opts.type } : {}),
        ...(opts.featured ? { featured: true } : {}),
        // AND keeps this separate from the search OR below.
        ...(opts.releasedOnly ? { AND: [{ OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] }] } : {}),
        ...(opts.q
          ? {
              OR: [
                { title: { contains: opts.q, mode: "insensitive" } },
                { summary: { contains: opts.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ publishDate: "desc" }, { publishedAt: "desc" }],
      take: opts.take ?? 12,
      skip: opts.skip ?? 0,
      select: {
        id: true,
        type: true,
        slug: true,
        title: true,
        summary: true,
        author: true,
        publishDate: true,
        publishedAt: true,
        scriptureRefs: true,
      },
    })
    .catch(() => []);
}

export type ContentSummary = Awaited<ReturnType<typeof publishedContent>>[number];

export const contentHref = (c: Pick<ContentSummary, "type" | "slug">) =>
  c.type === "DEVOTIONAL" ? `/daily/devotionals/${c.slug}` : `/study/${c.slug}`;
