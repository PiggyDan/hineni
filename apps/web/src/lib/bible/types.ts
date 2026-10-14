import type { EditionMetadata, Passage } from "@cp/shared";

export interface Translation {
  /** Stable id used in URLs and user data (e.g. "web", "kjv", "mn-bible"). */
  id: string;
  name: string;
  abbreviation: string;
  /** BCP-47-ish language code: "en", "mn", … */
  language: string;
  providerId: string;
  /** Provider-specific id (bible-api identifier or API.Bible bibleId). */
  providerTranslationId: string;
  license: string;
  /** Whether the license permits persisting text in our cache table. */
  cacheable: boolean;
  publisher?: string;
  copyrightStatus?: "public-domain" | "licensed";
  attribution?: string;
  downloadAllowed?: boolean;
  audioAvailable?: boolean;
  metadata?: EditionMetadata;
}

export interface Verse {
  verse: number;
  text: string;
}

export interface ChapterText {
  translationId: string;
  bookId: string;
  chapter: number;
  verses: Verse[];
  /** Copyright / attribution string that must be displayed with the text. */
  copyright: string;
}

export interface PassageText extends ChapterText {
  passage: Passage;
}

/** A replaceable Scripture source. Implementations must only serve licensed or public-domain text. */
export interface BibleProvider {
  id: string;
  translations(): Translation[] | Promise<Translation[]>;
  getChapter(translation: Translation, bookId: string, chapter: number): Promise<ChapterText>;
}

export class ScriptureUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ScriptureUnavailableError";
  }
}
