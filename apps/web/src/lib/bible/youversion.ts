import { Parser } from "htmlparser2";
import { z } from "zod";
import { getBook } from "@cp/shared";
import { ScriptureUnavailableError, type BibleProvider, type Translation } from "./types";

const BASE = "https://api.youversion.com/v1";
const metadataSchema = z.object({
  id: z.number().int().positive(), language_tag: z.string(), title: z.string(),
  localized_title: z.string().nullable().optional(), abbreviation: z.string(),
  localized_abbreviation: z.string().nullable().optional(),
  copyright: z.string().nullable().optional(), promotional_content: z.string().nullable().optional(),
  books: z.array(z.string()),
});
const collectionSchema = z.object({ data: z.array(metadataSchema), next_page_token: z.string().nullable().optional() });
const passageSchema = z.object({ id: z.string(), content: z.string().min(1), reference: z.string() });
let catalog: { key: string; expires: number; translations: Translation[] } | undefined;
let pending: { key: string; promise: Promise<Translation[]> } | undefined;
let retryAt = 0;

async function request(path: string) {
  const key = process.env.YVP_APP_KEY?.trim();
  if (!key) throw new ScriptureUnavailableError("YouVersion App Key is not configured");
  const response = await fetch(`${BASE}${path}`, { headers: { "X-YVP-App-Key": key, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (response.status === 204) return { data: [] };
  if (response.status === 429) retryAt = Date.now() + Math.max(60, Number(response.headers.get("retry-after")) || 60) * 1000;
  if (!response.ok) throw new ScriptureUnavailableError(`YouVersion returned HTTP ${response.status}`);
  return response.json();
}

/** Decode entities and collect numbered verse text. Never render provider HTML. */
export function parseYouVersionVerses(html: string): { verse: number; text: string }[] {
  const verses = new Map<number, string>();
  let current: number | undefined;
  let ignored = 0;
  const ignoreStack: boolean[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      const classes = (attributes.class ?? "").split(/\s+/);
      const ignore = ["script", "style", "sup"].includes(name) || classes.some((value) => ["yv-vlbl", "yv-note", "note", "label"].includes(value));
      ignoreStack.push(ignore); if (ignore) ignored++;
      if (!ignored && classes.includes("yv-v") && attributes.v !== undefined) {
        if (!/^\d+$/.test(attributes.v)) throw new ScriptureUnavailableError("This edition uses unsupported merged verse numbering");
        current = Number(attributes.v);
        if (current < 1) throw new ScriptureUnavailableError("Invalid verse marker");
        if (!verses.has(current)) verses.set(current, "");
      }
      if (!ignored && current !== undefined && ["div", "p", "br"].includes(name)) verses.set(current, `${verses.get(current) ?? ""} `);
    },
    ontext(text) { if (!ignored && current !== undefined) verses.set(current, `${verses.get(current) ?? ""}${text}`); },
    onclosetag(name) {
      if (!ignored && current !== undefined && ["div", "p"].includes(name)) verses.set(current, `${verses.get(current) ?? ""} `);
      if (ignoreStack.pop()) ignored--;
    },
  }, { decodeEntities: true });
  parser.write(html); parser.end();
  const result = [...verses].map(([verse, text]) => ({ verse, text: text.replace(/\s+/g, " ").trim() })).sort((a, b) => a.verse - b.verse);
  if (!result.length || result.some((verse) => !verse.text)) throw new ScriptureUnavailableError("YouVersion verse content is unavailable or unsupported");
  return result;
}

async function loadCatalog(key: string): Promise<Translation[]> {
  const translations: Translation[] = [];
  const candidates: z.infer<typeof metadataSchema>[] = [];
  const seen = new Set<string>();
  let token: string | null | undefined;
  do {
    // Default collection is app-licensed editions. Never request all_available=true.
    const query = new URLSearchParams({ "language_ranges[]": "*" });
    if (token) query.set("page_token", token);
    const body = collectionSchema.parse(await request(`/bibles?${query}`));
    candidates.push(...body.data);
    token = body.next_page_token;
    if (token && seen.has(token)) throw new ScriptureUnavailableError("Repeated YouVersion catalog page");
    if (token) seen.add(token);
  } while (token);
  for (const bible of candidates) {
      const language = new Intl.Locale(bible.language_tag).toString();
      const attribution = bible.copyright?.trim() || bible.promotional_content?.trim();
      translations.push({
        id: bible.id === 369 ? "mn-ab2004" : `yv-${bible.id}`,
        name: bible.localized_title || bible.title, abbreviation: bible.localized_abbreviation || bible.abbreviation,
        language, providerId: "youversion", providerTranslationId: String(bible.id),
        license: "YouVersion Platform — app-licensed access", cacheable: false,
        copyrightStatus: "licensed", publisher: "Publisher identified in edition attribution",
        attribution: attribution || undefined, downloadAllowed: false, audioAvailable: false,
      });
  }
  // Prefer the complete, live-verified Hindi IRV edition when it is permitted.
  translations.sort((a, b) => Number(b.id === "yv-1980") - Number(a.id === "yv-1980"));
  catalog = { key, expires: Date.now() + 180_000, translations };
  return translations;
}

export const youVersionProvider: BibleProvider = {
  id: "youversion",
  async translations() {
    const key = process.env.YVP_APP_KEY?.trim();
    if (!key) return [];
    if (Date.now() < retryAt) return catalog?.key === key ? catalog.translations : [];
    if (catalog?.key === key && catalog.expires > Date.now()) return catalog.translations;
    if (pending?.key === key) return pending.promise;
    const promise = loadCatalog(key).catch(() => { retryAt = Math.max(retryAt, Date.now() + 60_000); return catalog?.key === key ? catalog.translations : [] as Translation[]; });
    pending = { key, promise };
    try { return await promise; } finally { if (pending?.promise === promise) pending = undefined; }
  },
  async getChapter(translation, bookId, chapter) {
    const book = getBook(bookId);
    if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters || !/^\d+$/.test(translation.providerTranslationId)) throw new ScriptureUnavailableError("Invalid YouVersion chapter");
    const id = translation.providerTranslationId;
    // Refresh attribution for every display. Passage authorization is checked by the API.
    const metadata = metadataSchema.parse(await request(`/bibles/${id}`));
    const copyright = metadata.copyright?.trim() || metadata.promotional_content?.trim();
    if (!copyright || !metadata.books.includes(book.id)) throw new ScriptureUnavailableError("Edition lacks this book or display attribution");
    const params = new URLSearchParams({ format: "html", include_headings: "false", include_notes: "false" });
    const passage = passageSchema.parse(await request(`/bibles/${id}/passages/${book.id}.${chapter}?${params}`));
    if (passage.id !== `${book.id}.${chapter}`) throw new ScriptureUnavailableError("Unexpected YouVersion passage identifier");
    return { translationId: translation.id, bookId: book.id, chapter, verses: parseYouVersionVerses(passage.content), copyright };
  },
};
