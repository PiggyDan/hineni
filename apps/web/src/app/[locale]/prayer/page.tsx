import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { PrayerJournal } from "@/components/prayer/prayer-journal";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "@/i18n/navigation";
import { decryptForUser } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.prayer" }))("title"), robots: { index: false, follow: false } };
}

export default async function PrayerPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ new?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  const [t, { new: startNew }] = await Promise.all([getTranslations("app.prayer"), searchParams]);
  // Ownership is enforced by the userId filter; prayers are decrypted only for their owner.
  const prayers = await prisma.prayer.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 500 });

  return (
    <>
      <PageHeader eyebrow={t("all")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page pt-8">
        <PrayerJournal
          startNew={startNew === "1"}
          initial={prayers.map((prayer) => ({
            id: prayer.id,
            title: decryptForUser(user.id, prayer.titleCipher),
            body: decryptForUser(user.id, prayer.bodyCipher),
            category: prayer.category,
            answered: prayer.answered,
            answerNote: prayer.answerNoteCipher ? decryptForUser(user.id, prayer.answerNoteCipher) : null,
            createdAt: prayer.createdAt.toISOString(),
            updatedAt: prayer.updatedAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
