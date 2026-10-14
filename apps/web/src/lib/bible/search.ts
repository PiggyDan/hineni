import "server-only";
import { Prisma, prisma } from "@cp/db";
import { bibleSearchSchema, parseReference } from "@cp/shared";
import { ScriptureUnavailableError } from "./types";
import { getTranslation } from "./index";

export async function searchBible(input: unknown) {
  const query = bibleSearchSchema.parse(input);
  const edition = await getTranslation(query.t);
  if (!edition) throw new ScriptureUnavailableError("Selected edition is unavailable");
  const reference = parseReference(query.q, edition.metadata);
  if (reference) return { items: [], reference, page: query.page, hasNext: false };
  const translation = await prisma.bibleTranslation.findFirst({ where: { id: query.t, enabled: true, license: { displayAllowed: true } }, select: { id: true } });
  if (!translation) throw new ScriptureUnavailableError("Search requires an enabled, licensed imported edition");
  const normalized = query.q.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const search = query.mode === "phrase" ? Prisma.sql`phraseto_tsquery('simple', ${normalized})` : Prisma.sql`plainto_tsquery('simple', ${normalized})`;
  const items = await prisma.$queryRaw<{ bookId: string; chapter: number; verse: number; text: string }[]>(Prisma.sql`
    SELECT v."bookId", v."chapter", v."verse", v."text"
    FROM "bible_verse" v JOIN "bible_book" b ON b."id" = v."bookId"
    WHERE v."translationId" = ${translation.id} AND v."search_vector_normalized" @@ ${search}
    ${query.book ? Prisma.sql`AND v."bookId" = ${query.book}` : Prisma.empty}
    ${query.chapter ? Prisma.sql`AND v."chapter" = ${query.chapter}` : Prisma.empty}
    ORDER BY b."order", v."chapter", v."verse"
    LIMIT ${query.pageSize + 1} OFFSET ${(query.page - 1) * query.pageSize}`);
  return { items: items.slice(0, query.pageSize), reference: null, page: query.page, hasNext: items.length > query.pageSize };
}
