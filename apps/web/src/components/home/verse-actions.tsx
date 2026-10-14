"use client";

import { ArrowRight, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api-client";
import type { Passage } from "@cp/shared";

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-[#EEEAE2] transition hover:border-[#C5A46D]/60 hover:bg-white/10";

/** Save / share / read actions for a verse shown on a dark card. */
export function VerseActions({
  passage,
  translationId,
  shareText,
  chapterHref,
  signedIn,
  initiallySaved,
}: {
  passage: Passage;
  translationId: string;
  shareText: string;
  chapterHref: string;
  signedIn: boolean;
  initiallySaved: boolean;
}) {
  const t = useTranslations("app.home");
  const tb = useTranslations("bible");
  const tc = useTranslations("app.common");
  const locale = useLocale();
  const [saved, setSaved] = useState(initiallySaved);
  const [status, setStatus] = useState<string | null>(null);

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2200);
  };

  async function save() {
    try {
      await api("/me/bookmarks", { body: { passage, translationId } });
      setSaved(true);
      flash(t("saved"));
    } catch {
      flash(tc("error"));
    }
  }

  async function share() {
    const url = `${location.origin}/${locale}${chapterHref}`;
    if (navigator.share) {
      await navigator.share({ text: shareText, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${shareText}\n${url}`).then(() => flash(tb("copied")), () => flash(tc("error")));
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      {signedIn ? (
        <button type="button" onClick={save} disabled={saved} aria-pressed={saved} className={pill}>
          {saved ? <BookmarkCheck className="size-4 text-[#C5A46D]" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {saved ? t("saved") : t("save")}
        </button>
      ) : (
        <Link href="/sign-in" className={pill}>
          <Bookmark className="size-4" aria-hidden />
          {t("save")}
        </Link>
      )}
      <button type="button" onClick={share} className={pill}>
        <Share2 className="size-4" aria-hidden />
        {t("share")}
      </button>
      <Link href={chapterHref} className={`${pill} ms-auto border-[#C5A46D]/50 text-[#E9D6AE]`}>
        {t("readChapter")}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
      </Link>
      <p role="status" aria-live="polite" className="basis-full text-xs text-[#C5A46D] empty:hidden">
        {status}
      </p>
    </div>
  );
}
