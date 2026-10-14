import "server-only";
import { editionBooks, getBook, scriptureLanguageMatches, type Passage } from "@cp/shared";
import { prisma } from "@cp/db";
import { apiBibleProvider } from "./api-bible";
import { bibleApiComProvider } from "./bible-api-com";
import { getBibleProvider } from "./getbible";
import { databaseBibleProvider } from "./database";
import { youVersionProvider } from "./youversion";
import {
  ScriptureUnavailableError,
  type BibleProvider,
  type ChapterText,
  type PassageText,
  type Translation,
} from "./types";

export * from "./types";

const providers: BibleProvider[] = [databaseBibleProvider, bibleApiComProvider, apiBibleProvider, getBibleProvider, youVersionProvider];

export async function listTranslations(): Promise<Translation[]> {
  const groups = await Promise.all(providers.map(async (provider) => {
    try { return await provider.translations(); }
    catch (error) { if (provider.id === "postgresql") return []; throw error; }
  }));
  // Imported content takes priority over remote editions with the same stable id.
  const seen = new Set<string>();
  return groups.flat().filter((translation) => {
    if (seen.has(translation.id)) return false;
    seen.add(translation.id); return true;
  });
}

export async function getTranslation(id: string | undefined | null): Promise<Translation | undefined> {
  return id ? (await listTranslations()).find((t) => t.id === id) : undefined;
}

/** Default translation for a UI locale, plus whether we had to fall back to another language. */
export async function defaultTranslation(locale: string): Promise<{ translation: Translation | null; fallback: boolean }> {
  const all = await listTranslations();

  if (locale === "en") {
    const kjv = all.find((t) => t.id === "kjv" && t.language === "en");
    if (kjv) return { translation: kjv, fallback: false };
  }

  // The requested Mongolian edition wins only after a licensed provider/import enables it.
  const preferredMongolian = locale === "mn" ? all.find((t) => t.id === "mn-ab2004" && t.language === "mn") : undefined;
  const native = preferredMongolian ?? all.find((t) => scriptureLanguageMatches(t.language, locale));
  if (native) return { translation: native, fallback: false };

  return { translation: null, fallback: true };
}

export async function resolveTranslation(id: string | undefined | null, locale: string) {
  const explicit = await getTranslation(id);
  if (id) return { translation: explicit ?? null, fallback: !explicit };
  return defaultTranslation(locale);
}

// Small in-process LRU in front of the DB cache.
const memory = new Map<string, { value: ChapterText; expires: number }>();
const MEMORY_LIMIT = 300;
const remember = (key: string, value: ChapterText) => {
  memory.delete(key);
  memory.set(key, { value, expires: Date.now() + 300_000 });
  if (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value!);
};

export async function getChapter(translation: Translation, bookId: string, chapter: number): Promise<ChapterText> {
  const book = getBook(bookId);
  const editionBook = editionBooks(translation.metadata, "en").find(value => value.id === book?.id);
  if (!book || !editionBook || !Number.isInteger(chapter) || chapter < 1 || chapter > editionBook.chapters) {
    throw new ScriptureUnavailableError(`Invalid chapter ${bookId} ${chapter}`);
  }
  const key = `${translation.providerId}:${translation.providerTranslationId}:${book.id}:${chapter}`;
  // App-licensed passages and attribution require fresh authorization; never retain text.
  if (translation.providerId === youVersionProvider.id) return youVersionProvider.getChapter(translation, book.id, chapter);
  if (translation.providerId === databaseBibleProvider.id) return databaseBibleProvider.getChapter(translation, book.id, chapter);
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  memory.delete(key);

  if (translation.cacheable) {
    const cached = await prisma.scriptureCache.findUnique({ where: { key } }).catch(() => null);
    if (cached && cached.fetchedAt.getTime() > Date.now() - 30 * 86400_000) {
      const value = cached.data as unknown as ChapterText;
      remember(key, value);
      return value;
    }
  }

  const provider = providers.find((p) => p.id === translation.providerId);
  if (!provider) throw new ScriptureUnavailableError(`No provider ${translation.providerId}`);
  const value = await provider.getChapter(translation, book.id, chapter);
  remember(key, value);
  if (translation.cacheable) {
    await prisma.scriptureCache
      .upsert({ where: { key }, update: { data: value as object, fetchedAt: new Date() }, create: { key, data: value as object } })
      .catch(() => undefined);
  }
  return value;
}

export async function getPassage(translation: Translation, passage: Passage): Promise<PassageText> {
  const chapter = await getChapter(translation, passage.bookId, passage.chapter);
  const start = passage.verseStart ?? 1;
  const end = passage.verseEnd ?? passage.verseStart ?? Number.MAX_SAFE_INTEGER;
  const verses = chapter.verses.filter((v) => v.verse >= start && v.verse <= end);
  if (!verses.length) throw new ScriptureUnavailableError("Verses out of range");
  return { ...chapter, verses, passage };
}
