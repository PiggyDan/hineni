import { z } from "zod";
import { formatReference, parseReference } from "@cp/shared";
import { ApiError, handler, query } from "@/lib/api";
import { getPassage, resolveTranslation, ScriptureUnavailableError } from "@/lib/bible";

const schema = z.object({ ref: z.string().min(1).max(80), t: z.string().max(40).optional(), locale: z.string().optional() });

/** GET /api/v1/bible/passage?ref=John+3:16-18&t=web */
export const GET = handler({ limit: [120, 60] }, async ({ req }) => {
  const q = query(req, schema);
  const { translation, fallback } = await resolveTranslation(q.t, q.locale ?? "en");
  if (!translation) throw new ApiError(404, "translation_unavailable");
  const passage = parseReference(q.ref, translation.metadata);
  if (!passage) throw new ApiError(400, "invalid_reference");
  try {
    const text = await getPassage(translation, passage);
    return { reference: formatReference(passage, q.locale ?? "en"), fallback, ...text };
  } catch (e) {
    if (e instanceof ScriptureUnavailableError) throw new ApiError(503, "scripture_unavailable");
    throw e;
  }
});
