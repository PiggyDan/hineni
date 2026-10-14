import { bibleSearchSchema } from "@cp/shared";
import { ApiError, handler, query } from "@/lib/api";
import { searchBible } from "@/lib/bible/search";
import { ScriptureUnavailableError } from "@/lib/bible";

export const GET = handler({ limit: [60, 60] }, async ({ req }) => {
  const input = query(req, bibleSearchSchema);
  try { return await searchBible(input); }
  catch (error) { if (error instanceof ScriptureUnavailableError) throw new ApiError(503, "translation_not_imported"); throw error; }
});
