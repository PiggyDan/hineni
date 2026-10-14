import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { JournalView } from "@/components/journal/journal-view";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "@/i18n/navigation";
import { decryptForUser } from "@/lib/crypto";
import { serializeJournalEntry } from "@/lib/journal";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.journal" }))("title"), robots: { index: false, follow: false } };
}

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }
  const t = await getTranslations("app.journal");
  // Both queries are scoped to the signed-in owner before decryption.
  const [entries, notes] = await Promise.all([
    prisma.journalEntry.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 500 }),
    prisma.note.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 500 }),
  ]);

  return (
    <>
      <PageHeader eyebrow={t("entries")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page pt-8">
        <JournalView
          entries={entries.map((entry) => serializeJournalEntry(user.id, entry))}
          notes={notes.map((note) => ({
            id: note.id,
            bookId: note.bookId,
            chapter: note.chapter,
            verseStart: note.verseStart,
            verseEnd: note.verseEnd,
            translationId: note.translationId,
            body: decryptForUser(user.id, note.bodyCipher),
            updatedAt: note.updatedAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
