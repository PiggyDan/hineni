import { getBook } from "@cp/shared";
import { ScriptureUnavailableError, type BibleProvider, type Translation } from "./types";

// Editions whose distribution metadata permits reuse. See https://api.getbible.net/v2/translations.json.
const editions = [
  ["darby", "fr", "Bible Darby", "Public Domain"],
  ["synodal", "ru", "Синодальный перевод (1876)", "Public Domain"],
  ["sse", "es", "Sagradas Escrituras (1569)", "Public Domain"],
  ["livre", "pt", "Bíblia Livre", "Creative Commons Attribution 3.0 Brazil"],
  ["chiunl", "zh", "文理和合本", "Public Domain"],
  ["luther1545", "de", "Lutherbibel (1545)", "Public Domain"],
  ["korean", "ko", "Korean Revised Version", "Public Domain"],
  ["japbungo", "ja", "文語訳聖書", "Public Domain"],
] as const;

export const getBibleProvider = {
  id: "getbible",
  translations: (): Translation[] => [...editions.map(([id, language, name, license]) => ({
    id, language, name, license, abbreviation: id.toUpperCase(),
    providerId: "getbible", providerTranslationId: id, cacheable: true,
    publisher: "getBible / original translation publisher", attribution: `${name} — ${license} · getBible`,
    copyrightStatus: license === "Public Domain" ? "public-domain" as const : "licensed" as const,
    downloadAllowed: false, audioAvailable: false,
  })), ...(process.env.MONGOLIAN_BIBLE_RIGHTS_CONFIRMED === "true" ? [{
    id: "monkjv", language: "mn", name: "Монгол Хаан Жэймс — Шинэ Гэрээ", abbreviation: "MonKJV",
    providerId: "getbible", providerTranslationId: "monkjv", cacheable: false,
    license: "Copyright © 2011–2015 Mongolian Team. Source: getBible / CrossWire MonKJV.",
    publisher: "Mongolian Team", copyrightStatus: "licensed" as const,
    attribution: "Copyright © 2011–2015 Mongolian Team", downloadAllowed: false, audioAvailable: false,
  }] : [])],
  async getChapter(translation: Translation, bookId: string, chapter: number) {
    const book = getBook(bookId);
    if (!book) throw new ScriptureUnavailableError(`Unknown book ${bookId}`);
    // This source contains only the New Testament; never substitute English text.
    if (translation.id === "monkjv" && book.testament !== "NT") {
      throw new ScriptureUnavailableError("MonKJV contains only the New Testament");
    }
    try {
      const response = await fetch(
        `https://api.getbible.net/v2/${translation.providerTranslationId}/${book.order}/${chapter}.json`,
        { signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { verses: { verse: number; text: string }[] };
      if (!data.verses?.length) throw new Error("No verses returned");
      return {
        translationId: translation.id, bookId: book.id, chapter,
        verses: data.verses.map(({ verse, text }) => ({ verse, text: text.replace(/\s+/g, " ").trim() })),
        copyright: `${translation.name} — ${translation.license} · getBible (https://getbible.net)`,
      };
    } catch (error) {
      throw new ScriptureUnavailableError(`getBible request failed for ${bookId} ${chapter}`, error);
    }
  },
} satisfies BibleProvider;
