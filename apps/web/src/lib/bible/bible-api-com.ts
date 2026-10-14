import { ScriptureUnavailableError, type BibleProvider, type ChapterText, type Translation } from "./types";

/**
 * bible-api.com — free service for public-domain translations. No key required.
 * Rate limited (≈15 requests / 30 s per IP), so results are cached in our database.
 */
const BASE = "https://bible-api.com/data";

const TRANSLATIONS: Translation[] = [
  {
    id: "web",
    name: "World English Bible",
    abbreviation: "WEB",
    language: "en",
    providerId: "bible-api.com",
    providerTranslationId: "web",
    license: "Public Domain",
    cacheable: true,
    publisher: "World English Bible", copyrightStatus: "public-domain", attribution: "World English Bible — Public Domain", downloadAllowed: true, audioAvailable: false,
  },
  {
    id: "kjv",
    name: "King James Version",
    abbreviation: "KJV",
    language: "en",
    providerId: "bible-api.com",
    providerTranslationId: "kjv",
    license: "Public Domain",
    cacheable: true,
    publisher: "King James Version", copyrightStatus: "public-domain", attribution: "King James Version — Public Domain (regional restrictions may apply)", downloadAllowed: true, audioAvailable: false,
  },
];

interface ApiResponse {
  translation: { license: string };
  verses: { book_id: string; chapter: number; verse: number; text: string }[];
}

export const bibleApiComProvider: BibleProvider = {
  id: "bible-api.com",
  translations: () => TRANSLATIONS,
  async getChapter(translation, bookId, chapter): Promise<ChapterText> {
    const url = `${BASE}/${translation.providerTranslationId}/${bookId}/${chapter}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    } catch (e) {
      throw new ScriptureUnavailableError(`bible-api.com request failed for ${bookId} ${chapter}`, e);
    }
    if (!res.ok) throw new ScriptureUnavailableError(`bible-api.com returned ${res.status} for ${bookId} ${chapter}`);
    const data = (await res.json()) as ApiResponse;
    if (!data.verses?.length) throw new ScriptureUnavailableError(`No verses for ${bookId} ${chapter}`);
    return {
      translationId: translation.id,
      bookId,
      chapter,
      verses: data.verses.map((v) => ({ verse: v.verse, text: v.text.replace(/\s+/g, " ").trim() })),
      copyright: `${translation.name} (${translation.abbreviation}) — ${data.translation?.license ?? translation.license}`,
    };
  },
};
