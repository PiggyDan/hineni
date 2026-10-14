import { CircleCheck, CircleX } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@cp/db";
import { AdminAction } from "@/components/admin/admin-controls";
import { listTranslations } from "@/lib/bible";
import { staffUser } from "@/lib/admin";

const configured = (value: string | undefined) => !!value?.trim();

/** Edition and provider status. Shows only whether secrets are set — never their values. */
export default async function AdminEditions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.admin");
  const { allowed } = await staffUser(["ADMIN"]);
  if (!allowed) return <p role="alert" className="text-ink-muted">{t("forbidden")}</p>;

  const [imported, available] = await Promise.all([
    prisma.bibleTranslation.findMany({ include: { license: true, _count: { select: { chapters: true } } }, orderBy: { id: "asc" } }),
    listTranslations().catch(() => []),
  ]);
  const importedIds = new Set(imported.map((item) => item.id));
  const remote = available.filter((item) => !importedIds.has(item.id));
  const hasMongolian = available.some((item) => item.language === "mn");
  const providers = [
    { name: "API.Bible", key: configured(process.env.API_BIBLE_KEY), rights: process.env.API_BIBLE_RIGHTS_CONFIRMED === "true" },
    { name: "YouVersion Platform", key: configured(process.env.YVP_APP_KEY), rights: null },
    { name: "Mongolian (MonKJV)", key: null, rights: process.env.MONGOLIAN_BIBLE_RIGHTS_CONFIRMED === "true" },
  ];
  const Flag = ({ ok, yes, no }: { ok: boolean; yes: string; no: string }) => (
    <span className={`inline-flex items-center gap-1 text-xs ${ok ? "text-secondary" : "text-ink-muted"}`}>
      {ok ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleX className="size-3.5" aria-hidden />}
      {ok ? yes : no}
    </span>
  );

  return (
    <div className="space-y-10">
      <h1 className="page-title">{t("editions")}</h1>

      {!hasMongolian && (
        <p role="status" className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-ink">
          <strong className="font-semibold">{t("mongolianStatus")}:</strong> {t("mongolianBlocked")}
        </p>
      )}

      <section aria-labelledby="imported-heading">
        <h2 id="imported-heading" className="mb-3 font-semibold text-ink">{t("imported")}</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
          {imported.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{item.name} <span className="text-ink-muted">· {item.abbreviation}</span></p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {t("language")}: {item.language} · {t("publisher")}: {item.publisher} · {t("license")}: {item.license.license} · {item._count.chapters} ch.
                </p>
                <p className="mt-1 text-xs text-ink-muted">{item.license.attribution}</p>
              </div>
              <Flag ok={item.license.displayAllowed} yes={t("rightsConfirmed")} no={t("rightsNotConfirmed")} />
              <AdminAction path={`/admin/translations/${item.id}`} body={{ enabled: !item.enabled }} variant={item.enabled ? "outline" : "primary"}>
                {item.enabled ? t("disable") : t("enable")}
              </AdminAction>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="remote-heading">
        <h2 id="remote-heading" className="mb-3 font-semibold text-ink">{t("remote")}</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface text-sm">
          {remote.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
              <span className="text-ink">{item.name} <span className="text-ink-muted">· {item.abbreviation} · {item.language}</span></span>
              <span className="text-xs text-ink-muted">{item.providerId} · {item.license}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="providers-heading">
        <h2 id="providers-heading" className="mb-3 font-semibold text-ink">{t("providers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {providers.map((provider) => (
            <li key={provider.name} className="card space-y-2 p-5">
              <p className="font-medium text-ink">{provider.name}</p>
              {provider.key !== null && <Flag ok={provider.key} yes={t("configured")} no={t("notConfigured")} />}
              {provider.rights !== null && <div><Flag ok={provider.rights} yes={t("rightsConfirmed")} no={t("rightsNotConfirmed")} /></div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
