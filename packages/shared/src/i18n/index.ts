import ja from "./ja.json";
import ko from "./ko.json";
import de from "./de.json";
import el from "./el.json";
import en from "./en.json";
import mn from "./mn.json";
import ru from "./ru.json";
import es from "./es.json";
import fr from "./fr.json";
import ar from "./ar.json";
import pt from "./pt.json";
import tr from "./tr.json";
import id from "./id.json";
import hi from "./hi.json";
import zh from "./zh.json";
import he from "./he.json";

export const locales = ["en", "mn", "ru", "es", "fr", "ar", "pt", "tr", "id", "hi", "zh", "he", "el", "de", "ko", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  ja: "日本語",
  ko: "한국어",
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  mn: "Монгол",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
  tr: "Türkçe",
  id: "Bahasa Indonesia",
  hi: "हिन्दी",
  zh: "中文",
  he: "עברית",
};

export type Messages = typeof en;
const dictionaries = {
  ja,
  ko,
  de,
  el,
  en,
  mn,
  ru,
  es,
  fr,
  ar,
  pt,
  tr,
  id,
  hi,
  zh,
  he,
};
export const messages = Object.fromEntries(locales.map((locale) => [locale, {
  ...dictionaries[locale], foundation: locale === "mn" ? mn.foundation : en.foundation,
  // Redesign strings ship in the launch languages; other locales use English until reviewed translations exist.
  app: locale === "mn" ? mn.app : en.app,
}])) as Record<Locale, Messages>;

export const isLocale = (v: unknown): v is Locale => locales.includes(v as Locale);

/** Flattens nested message objects to dot keys — used by parity tests and mobile. */
export function flattenMessages(obj: object, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flattenMessages(v as object, key));
  }
  return out;
}
