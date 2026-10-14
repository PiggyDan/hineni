import { ScriptureUnavailableError, type BibleProvider, type ChapterText, type Translation } from "./types";

/**
 * API.Bible (American Bible Society) — licensed translations, including Mongolian
 * editions, available to approved API keys. Configure with:
 *   API_BIBLE_KEY=...
 *   API_BIBLE_TRANSLATIONS=id:language:bibleId[:Display Name],...
 * Licensed text is NOT persisted (cacheable: false); API.Bible's terms (incl. FUMS
 * usage reporting) must be reviewed before production use.
 */
const BASE = "https://api.scripture.api.bible/v1";

function configured(): Translation[] {
  const raw = process.env.API_BIBLE_TRANSLATIONS?.trim();
  if (!raw || !process.env.API_BIBLE_KEY || process.env.API_BIBLE_RIGHTS_CONFIRMED !== "true") return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().split(":"))
    .filter((parts) => parts.length >= 3)
    .map(([id, language, bibleId, name]) => ({
      id: id!,
      name: name || id!,
      abbreviation: id!.toUpperCase(),
      language: language!,
      providerId: "api.bible",
      providerTranslationId: bibleId!,
      license: "Licensed via API.Bible",
      cacheable: false,
      publisher: "Configured API.Bible publisher",
      copyrightStatus: "licensed" as const,
      attribution: "Publisher attribution supplied with each chapter",
      downloadAllowed: false,
      audioAvailable: false,
    }));
}

interface JsonNode {
  type?: string;
  name?: string;
  text?: string;
  attrs?: { verseId?: string; number?: string };
  items?: JsonNode[];
}

/** Walks API.Bible's JSON content tree and groups text by verse id. */
export function collectVerses(nodes: JsonNode[]): Map<number, string> {
  const out = new Map<number, string>();
  const walk = (list: JsonNode[]) => {
    for (const node of list) {
      if (node.type === "text" && node.text && node.attrs?.verseId) {
        const n = Number(node.attrs.verseId.split(".")[2]);
        if (Number.isFinite(n)) out.set(n, `${out.get(n) ?? ""}${node.text}`);
      }
      if (node.items) walk(node.items);
    }
  };
  walk(nodes);
  return out;
}

export const apiBibleProvider: BibleProvider = {
  id: "api.bible",
  translations: configured,
  async getChapter(translation, bookId, chapter): Promise<ChapterText> {
    const key = process.env.API_BIBLE_KEY;
    if (!key) throw new ScriptureUnavailableError("API_BIBLE_KEY is not configured");
    const params = new URLSearchParams({
      "content-type": "json",
      "include-notes": "false",
      "include-titles": "false",
      "include-chapter-numbers": "false",
      "include-verse-numbers": "true",
    });
    const url = `${BASE}/bibles/${translation.providerTranslationId}/chapters/${bookId}.${chapter}?${params}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { "api-key": key }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    } catch (e) {
      throw new ScriptureUnavailableError(`API.Bible request failed for ${bookId} ${chapter}`, e);
    }
    if (!res.ok) throw new ScriptureUnavailableError(`API.Bible returned ${res.status} for ${bookId} ${chapter}`);
    const body = (await res.json()) as { data: { content: JsonNode[]; copyright?: string } };
    const verses = [...collectVerses(body.data.content).entries()]
      .sort(([a], [b]) => a - b)
      .map(([verse, text]) => ({ verse, text: text.replace(/\s+/g, " ").trim() }));
    if (!verses.length) throw new ScriptureUnavailableError(`No verses for ${bookId} ${chapter}`);
    return {
      translationId: translation.id,
      bookId,
      chapter,
      verses,
      copyright: body.data.copyright?.trim() || translation.license,
    };
  },
};
