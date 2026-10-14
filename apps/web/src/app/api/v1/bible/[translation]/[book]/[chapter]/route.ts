import { getBook, editionBooks } from "@cp/shared";
import { ApiError, handler, notFound } from "@/lib/api";
import { getChapter, getTranslation, ScriptureUnavailableError } from "@/lib/bible";

type P = { translation: string; book: string; chapter: string };

export const GET = handler<P>({ limit: [120, 60] }, async ({ params }) => {
  const translation = await getTranslation(params.translation);
  const book = getBook(params.book);
  const chapter = Number(params.chapter);
  const editionBook = translation && editionBooks(translation.metadata, "en").find(item => item.id === book?.id);
  if (!translation || !book || !editionBook || !Number.isInteger(chapter) || chapter < 1 || chapter > editionBook.chapters) throw notFound();
  try {
    return await getChapter(translation, book.id, chapter);
  } catch (e) {
    if (e instanceof ScriptureUnavailableError) throw new ApiError(503, "scripture_unavailable");
    throw e;
  }
});
