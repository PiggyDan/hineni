import { type Passage } from "@cp/shared";
import { ApiError } from "@/lib/api";
import { getChapter, getTranslation } from "./index";

/** Validate source numbering, including gaps in critical editions, before saving annotations. */
export async function validateSelection(translationId: string, passage: Passage, selected?: number[]) {
  const edition = await getTranslation(translationId);
  if (!edition) throw new ApiError(400, "translation_unavailable");
  const text = await getChapter(edition, passage.bookId, passage.chapter).catch(() => null);
  if (!text) throw new ApiError(400, "invalid_reference");
  const numbers = selected ?? [passage.verseStart, passage.verseEnd].filter((value): value is number => value !== undefined);
  if (numbers.some(number => !text.verses.some(verse => verse.verse === number))) throw new ApiError(400, "invalid_reference");
}
