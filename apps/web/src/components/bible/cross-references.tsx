import { getTranslations } from "next-intl/server";
import { formatReference, parsePassageKey } from "@cp/shared";
import { prisma } from "@cp/db";
import { Link } from "@/i18n/navigation";

/** Top cross-references per verse (OpenBible.info dataset, CC BY). Renders nothing until imported. */
export async function CrossReferences({
  locale,
  bookId,
  chapter,
  qs,
}: {
  locale: string;
  bookId: string;
  chapter: number;
  qs: string;
}) {
  const rows = await prisma.crossReference
    .findMany({ where: { bookId, chapter, votes: { gte: 5 } }, orderBy: [{ verse: "asc" }, { votes: "desc" }] })
    .catch(() => []);
  if (!rows.length) return null;
  const t = await getTranslations("study");

  const byVerse = new Map<number, typeof rows>();
  for (const r of rows) {
    const list = byVerse.get(r.verse) ?? [];
    if (list.length < 4) byVerse.set(r.verse, [...list, r]);
  }

  return (
    <details className="card group mt-6 p-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold text-ink">
        {t("crossReferences")}
        <span aria-hidden className="text-ink-muted transition group-open:rotate-45">+</span>
      </summary>
      <dl className="mt-4 space-y-2 text-sm">
        {[...byVerse.entries()].map(([verse, refs]) => (
          <div key={verse} className="flex gap-3">
            <dt className="w-8 shrink-0 text-end font-semibold text-accent-ink">{verse}</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-1">
              {refs.map((r) => {
                const p = parsePassageKey(r.toKey);
                if (!p) return null;
                return (
                  <Link
                    key={r.id}
                    href={`/bible/${p.bookId.toLowerCase()}/${p.chapter}${qs}#v${p.verseStart ?? 1}`}
                    className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {formatReference(p, locale)}
                  </Link>
                );
              })}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-ink-muted">
        Cross-reference data: OpenBible.info (CC BY)
      </p>
    </details>
  );
}
