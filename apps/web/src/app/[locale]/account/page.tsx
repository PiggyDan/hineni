import { ArrowRight, Upload } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { NameForm, PasswordForm } from "@/components/account/profile-forms";
import { VerificationNotice } from "@/components/auth/verification-notice";
import { Avatar, SignOutButton } from "@/components/layout/shell-parts";
import { Link, redirect } from "@/i18n/navigation";
import { chaptersReadCount } from "@/lib/progress";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "app.profile" }))("title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }
  const [t, ta, legacy] = await Promise.all([getTranslations("app.profile"), getTranslations("app"), getTranslations("interface")]);
  const [profile, chapters, bookmarks, prayers, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, createdAt: true } }),
    chaptersReadCount(user.id),
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.prayer.count({ where: { userId: user.id } }),
    prisma.journalEntry.count({ where: { userId: user.id } }),
  ]);
  const stats = [
    { label: t("chaptersRead"), value: chapters, href: "/bookmarks" },
    { label: t("bookmarks"), value: bookmarks, href: "/bookmarks" },
    { label: t("prayers"), value: prayers, href: "/prayer" },
    { label: t("entries"), value: entries, href: "/journal" },
  ];

  return (
    <div className="page-narrow">
      {!user.emailVerified && <VerificationNotice email={user.email} />}
      <header className="flex animate-rise items-center gap-5">
        <Avatar name={profile?.name ?? user.name} className="size-16 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl font-semibold text-ink">{profile?.name}</h1>
          <p className="truncate text-sm text-ink-muted">{profile?.email}</p>
          {profile && (
            <p className="mt-1 text-xs text-ink-muted">
              {t("memberSince", { date: profile.createdAt.toLocaleDateString(locale, { year: "numeric", month: "long" }) })}
              {user.role !== "USER" && ` · ${t("role")}: ${ta(`admin.roles.${user.role}`)}`}
            </p>
          )}
        </div>
        <SignOutButton className="icon-btn border border-line" />
      </header>

      <section className="mt-10" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="eyebrow mb-4">{t("stats")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Link href={stat.href} className="card block p-5 transition hover:border-accent">
                <span className="block font-display text-3xl font-semibold text-ink tabular-nums">{stat.value}</span>
                <span className="mt-1 block text-sm text-ink-muted">{stat.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-8 p-6">
        <NameForm initialName={profile?.name ?? user.name} />
        <p className="mt-4 text-sm text-ink-muted">
          {t("email")}: <span className="text-ink">{profile?.email}</span>
        </p>
      </section>

      <section className="card mt-5 p-6">
        <h2 className="mb-4 font-semibold text-ink">{t("password")}</h2>
        <PasswordForm />
      </section>

      <nav className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link href="/settings" className="card flex items-center justify-between p-5 font-medium text-ink hover:border-accent">
          {ta("nav.settings")}
          <ArrowRight className="size-4 text-ink-muted rtl:rotate-180" aria-hidden />
        </Link>
        <Link href="/upload" className="card flex items-center justify-between p-5 font-medium text-ink hover:border-accent">
          <span className="flex items-center gap-2">
            <Upload className="size-4 text-accent-ink" aria-hidden />
            {legacy("uploadTitle")}
          </span>
          <ArrowRight className="size-4 text-ink-muted rtl:rotate-180" aria-hidden />
        </Link>
      </nav>
    </div>
  );
}
