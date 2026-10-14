"use client";

import { Maximize2, Minus, Plus, Type, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { api } from "@/lib/api-client";
import { readerSizes, readerStyle, setReaderPrefs, useReaderPrefs, type ReaderPrefs } from "@/lib/reader-prefs";
import { setFocusMode } from "./reader-frame";

/** Typeface, size, spacing, layout and theme controls. Used in the reader sheet and on the Settings page. */
export function ReaderPreferenceControls({ signedIn, showPreview = false }: { signedIn: boolean; showPreview?: boolean }) {
  const t = useTranslations("app.reader");
  const prefs = useReaderPrefs();
  const { theme, setTheme } = useTheme();

  const update = (patch: Partial<ReaderPrefs>) => {
    setReaderPrefs(patch);
    if (signedIn && patch.size) api("/me/preferences", { method: "PATCH", body: { readerFontSize: patch.size } }).catch(() => undefined);
  };
  const step = (direction: 1 | -1) => {
    const index = readerSizes.findIndex((size) => size >= prefs.size);
    const current = index === -1 ? readerSizes.length - 1 : index;
    update({ size: readerSizes[Math.min(readerSizes.length - 1, Math.max(0, current + direction))]! });
  };
  const segment = <K extends keyof ReaderPrefs>(key: K, options: [ReaderPrefs[K], string][]) => (
    <div className="segmented" role="group">
      {options.map(([value, label]) => (
        <button key={String(value)} type="button" aria-pressed={prefs[key] === value} onClick={() => update({ [key]: value } as Partial<ReaderPrefs>)}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {showPreview && (
        <p className="scripture card-soft rounded-2xl p-5 text-ink" style={readerStyle(prefs)}>
          {prefs.numbers && <span className="verse-num">1</span>}
          {t("preview")}
        </p>
      )}
      <fieldset>
        <legend className="label">{t("typeface")}</legend>
        {segment("font", [["serif", t("serif")], ["sans", t("sans")]])}
      </fieldset>
      <fieldset>
        <legend className="label">{t("size")}</legend>
        <div className="flex items-center gap-3">
          <button type="button" className="icon-btn border border-line" onClick={() => step(-1)} aria-label={`${t("size")} −`} disabled={prefs.size <= readerSizes[0]}>
            <Minus className="size-4" aria-hidden />
          </button>
          <input
            type="range"
            min={0}
            max={readerSizes.length - 1}
            step={1}
            value={Math.max(0, readerSizes.findIndex((size) => size >= prefs.size))}
            onChange={(event) => update({ size: readerSizes[Number(event.target.value)]! })}
            aria-label={t("size")}
            aria-valuetext={`${prefs.size}px`}
            className="h-2 flex-1 cursor-pointer accent-accent"
          />
          <button type="button" className="icon-btn border border-line" onClick={() => step(1)} aria-label={`${t("size")} +`} disabled={prefs.size >= readerSizes[readerSizes.length - 1]!}>
            <Plus className="size-4" aria-hidden />
          </button>
          <span className="w-12 text-end text-sm tabular-nums text-ink-muted">{prefs.size}px</span>
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">{t("lineSpacing")}</legend>
        {segment("leading", [["compact", t("compact")], ["comfortable", t("comfortable")], ["airy", t("airy")]])}
      </fieldset>
      <fieldset>
        <legend className="label">{t("layout")}</legend>
        {segment("layout", [["paragraph", t("paragraph")], ["verses", t("verseByVerse")]])}
      </fieldset>
      <fieldset>
        <legend className="label">{t("appearance")}</legend>
        <div className="segmented" role="group">
          {(["light", "dark", "system"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)}>
              {t(value)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-ink">
        {t("verseNumbers")}
        <input type="checkbox" checked={prefs.numbers} onChange={(event) => update({ numbers: event.target.checked })} className="size-5 accent-accent" />
      </label>
    </div>
  );
}

export function ReaderSettingsButton({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("app.reader");
  const tc = useTranslations("app.common");
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="icon-btn" aria-haspopup="dialog" aria-label={t("settings")} title={t("settings")} onClick={() => dialog.current?.showModal()}>
        <Type className="size-4.5" aria-hidden />
      </button>
      <button
        type="button"
        className="icon-btn hidden sm:inline-flex"
        aria-label={t("focus")}
        title={t("focus")}
        onClick={() => setFocusMode(true)}
      >
        <Maximize2 className="size-4.5" aria-hidden />
      </button>
      <dialog
        ref={dialog}
        aria-label={t("settings")}
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] border border-line bg-surface p-0 text-ink shadow-2xl open:animate-rise sm:inset-0 sm:m-auto sm:max-w-md sm:rounded-[24px]"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <header className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-semibold">{t("settings")}</h2>
          <button type="button" className="icon-btn" aria-label={tc("close")} onClick={() => dialog.current?.close()}>
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <ReaderPreferenceControls signedIn={signedIn} />
          <button
            type="button"
            onClick={() => {
              dialog.current?.close();
              setFocusMode(true);
            }}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-medium hover:border-accent"
          >
            <Maximize2 className="size-4" aria-hidden />
            {t("focus")}
          </button>
        </div>
      </dialog>
    </>
  );
}
