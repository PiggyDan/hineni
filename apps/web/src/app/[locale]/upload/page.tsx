import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { SubmissionForm } from "@/components/ui/submission-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: "interface" }))("uploadTitle"), robots: { index: false, follow: false } };
}

export default async function UploadMediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const user = await getCurrentUser();

  if (!user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="eyebrow">{t("common.submit")}</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">{t("foundation.linkSubmission")}</h1>
          <p className="mt-3 text-sm text-ink-muted">
            {t("interface.uploadBody")}
          </p>
        </div>

        <SubmissionForm>
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">{t("interface.type")}</label>
            <select name="kind" defaultValue="song" className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent">
              <option value="song">{t("interface.song")}</option>
              <option value="sermon">{t("interface.sermon")}</option>
            </select>
          </div>

          <div>
            <p className="text-sm text-ink-muted">{t("foundation.filesUnavailable")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.title")}</label>
              <input name="title" required className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" placeholder={t("interface.title")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.artistOrSpeaker")}</label>
              <input name="artist" required minLength={2} maxLength={160} className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" placeholder={t("interface.artistOrSpeaker")} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.link")}</label>
              <input name="url" type="url" required className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.provider")}</label>
              <select name="provider" defaultValue="YOUTUBE" className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent">
                <option value="YOUTUBE">YouTube</option>
                <option value="SPOTIFY">Spotify</option>
                <option value="APPLE_MUSIC">Apple Music</option>
                <option value="SOUNDCLOUD">SoundCloud</option>
                <option value="VIMEO">Vimeo</option>
                <option value="AUDIO_URL">{t("interface.audioUrl")}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.duration")}</label>
              <input name="duration" className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" placeholder="4:12" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">{t("interface.date")}</label>
              <input name="date" type="date" className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">{t("interface.category")}</label>
            <input name="category" className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" placeholder={t("interface.categoryPlaceholder")} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">{t("interface.shortDescription")}</label>
            <textarea name="description" rows={5} className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-accent" placeholder={t("interface.descriptionPlaceholder")} />
          </div>

          <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="rightsConfirmed" required className="mt-1" />{t("foundation.rightsDeclaration")}</label>
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-sm text-ink-muted">{t("interface.uploadReview")}</p>
            <button type="submit" className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:opacity-95">
              {t("admin.submitForReview")}
            </button>
          </div>
        </SubmissionForm>
      </div>
    </div>
  );
}
