import { z } from "zod";
import { getBook } from "../bible/books";
import { highlightColors } from "../tokens";
import { locales } from "../i18n";

const trimmed = (max: number) => z.string().trim().max(max);
const bookId = z
  .string()
  .trim()
  .toUpperCase()
  .refine((id) => !!getBook(id), "Unknown book");
const positiveInt = z.coerce.number().int().positive();

export const bibleSearchSchema = z.object({
  q: z.string().trim().min(1).max(200),
  t: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/).default("kjv"),
  book: bookId.optional(), chapter: positiveInt.max(150).optional(),
  mode: z.enum(["words", "phrase"]).default("words"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const localeSchema = z.enum(locales);
export const themeSchema = z.enum(["system", "light", "dark"]);

export const paginationSchema = z.object({
  q: trimmed(200).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

/* ---------- Accounts ---------- */
export const passwordSchema = z
  .string()
  .min(10, "At least 10 characters")
  .max(128)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), "Use letters and numbers");

export const registerSchema = z.object({
  name: trimmed(80).min(1),
  email: z.email().trim().toLowerCase().max(254),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const preferencesSchema = z.object({
  locale: localeSchema.optional(),
  theme: themeSchema.optional(),
  readerFontSize: z.number().int().min(14).max(32).optional(),
  translationId: trimmed(40).optional(),
  dailyReminder: z.boolean().optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  timezone: trimmed(64).optional(),
});
export type Preferences = z.infer<typeof preferencesSchema>;

/* ---------- Bible personal data ---------- */
export const passageSchema = z
  .object({
    bookId,
    chapter: positiveInt,
    verseStart: positiveInt.optional(),
    verseEnd: positiveInt.optional(),
  })
    .refine((p) => p.chapter <= 200, "Chapter out of range")
  .refine((p) => !p.verseEnd || (p.verseStart && p.verseEnd >= p.verseStart), "Invalid verse range");

export const bookmarkCreateSchema = z.object({
  passage: passageSchema,
  translationId: trimmed(40),
  label: trimmed(120).optional(),
});

export const highlightUpsertSchema = z.object({
  bookId,
  chapter: positiveInt,
  verses: z.array(positiveInt).min(1).max(200),
  color: z.enum(highlightColors).nullable(),
  translationId: trimmed(40),
});

export const noteCreateSchema = z.object({
  passage: passageSchema,
  body: trimmed(10_000).min(1),
  translationId: trimmed(40).optional(),
});
export const noteUpdateSchema = z.object({ body: trimmed(10_000).min(1) });

export const historyCreateSchema = z.object({
  bookId,
  chapter: positiveInt,
  translationId: trimmed(40),
});

export const planProgressSchema = z.object({
  day: z.number().int().min(1).max(400),
  completed: z.boolean(),
});

/* ---------- Prayer journal ---------- */
export const prayerCategories = [
  "PERSONAL",
  "FAMILY",
  "FRIENDS",
  "CHURCH",
  "HEALTH",
  "WORK",
  "WORLD",
  "THANKSGIVING",
  "OTHER",
] as const;

export const prayerCreateSchema = z.object({
  title: trimmed(160).min(1),
  body: trimmed(20_000).default(""),
  category: z.enum(prayerCategories).default("PERSONAL"),
});
// Explicit optionals: .partial() keeps create defaults, which reset the category on every status change.
export const prayerUpdateSchema = z.object({
  title: trimmed(160).min(1).optional(),
  body: trimmed(20_000).optional(),
  category: z.enum(prayerCategories).optional(),
  answered: z.boolean().optional(),
  answerNote: trimmed(5_000).optional(),
});
export const prayerQuerySchema = paginationSchema.extend({
  category: z.enum(prayerCategories).optional(),
  status: z.enum(["all", "open", "answered"]).default("all"),
});

/* ---------- Personal journal ---------- */
const passageKeyString = z.string().trim().regex(/^[1-3A-Z]{3}\.\d{1,3}(?:\.\d{1,3}(?:-\d{1,3})?)?$/, "Invalid passage").refine((key) => !!getBook(key.slice(0, 3)), "Unknown book");

export const journalEntrySchema = z.object({
  title: trimmed(160).min(1),
  body: trimmed(50_000).default(""),
  refs: z.array(passageKeyString).max(20).default([]),
});
// Explicit optionals: .partial() would keep the defaults above and overwrite fields not being edited.
export const journalEntryUpdateSchema = z.object({
  title: trimmed(160).min(1).optional(),
  body: trimmed(50_000).optional(),
  refs: z.array(passageKeyString).max(20).optional(),
});

/* ---------- Churches ---------- */
export const churchSubmissionSchema = z.object({
  name: trimmed(160).min(2),
  denomination: trimmed(120).optional(),
  description: trimmed(4_000).optional(),
  address: trimmed(300).min(3),
  city: trimmed(120).min(1),
  region: trimmed(120).optional(),
  country: z.string().trim().length(2).toUpperCase(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  website: z.url().max(500).optional().or(z.literal("")),
  email: z.email().max(254).optional().or(z.literal("")),
  phone: trimmed(40).optional(),
  languages: z.array(trimmed(40)).max(10).default([]),
  serviceTimes: trimmed(500).optional(),
});
export const churchQuerySchema = paginationSchema.extend({
  country: z.string().trim().length(2).toUpperCase().optional(),
  city: trimmed(120).optional(),
  language: trimmed(40).optional(),
});

export function distanceBetweenCoordinatesKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function churchDistanceKm(
  churchLocation: { latitude?: number | null; longitude?: number | null },
  userLocation: { latitude: number; longitude: number },
): number | null {
  if (churchLocation.latitude == null || churchLocation.longitude == null) return null;
  return distanceBetweenCoordinatesKm(userLocation.latitude, userLocation.longitude, churchLocation.latitude, churchLocation.longitude);
}

export const churchEventSchema = z.object({
  title: trimmed(160).min(2),
  description: trimmed(4_000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: trimmed(300).optional(),
  url: z.url().max(500).optional().or(z.literal("")),
});

/* ---------- Media ---------- */
export const mediaProviders = [
  "YOUTUBE",
  "SPOTIFY",
  "APPLE_MUSIC",
  "SOUNDCLOUD",
  "VIMEO",
  "AUDIO_URL",
  "LOCAL_UPLOAD",
] as const;
export type MediaProvider = (typeof mediaProviders)[number];

export const mediaLinkSchema = z.object({
  provider: z.enum(mediaProviders),
  url: z.url().max(1000),
});

export const songSubmissionSchema = z.object({
  kind: z.literal("song"),
  title: trimmed(200).min(2),
  artist: trimmed(160).min(2),
  description: trimmed(2_000).optional().or(z.literal("")),
  url: z.url().max(1000).optional().or(z.literal("")),
  provider: z.enum(mediaProviders).default("YOUTUBE"),
  duration: trimmed(20).optional().or(z.literal("")),
  locale: localeSchema.default("en"),
});

export const sermonSubmissionSchema = z.object({
  kind: z.literal("sermon"),
  title: trimmed(200).min(2),
  speaker: trimmed(160).min(2),
  description: trimmed(4_000).optional().or(z.literal("")),
  url: z.url().max(1000).optional().or(z.literal("")),
  provider: z.enum(mediaProviders).default("YOUTUBE"),
  duration: trimmed(20).optional().or(z.literal("")),
  category: trimmed(80).optional().or(z.literal("")),
  date: z.string().trim().min(1).optional().or(z.literal("")),
  locale: localeSchema.default("en"),
});

export const mediaSubmissionSchema = z.discriminatedUnion("kind", [songSubmissionSchema, sermonSubmissionSchema]);
export type MediaSubmission = z.infer<typeof mediaSubmissionSchema>;

export const officialMediaSubmissionSchema = mediaSubmissionSchema.and(z.object({
  url: z.url().max(1000).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "Use an authorized HTTPS link"),
  rightsConfirmed: z.literal(true),
})).refine((value) => value.provider !== "LOCAL_UPLOAD", "File uploads require configured private storage")
  .refine((value) => !value.duration || /^\d{1,3}:[0-5]\d$/.test(value.duration) || /^\d{1,3}:[0-5]\d:[0-5]\d$/.test(value.duration), "Invalid duration")
  .refine((value) => value.kind !== "sermon" || !value.date || z.iso.date().safeParse(value.date).success, "Invalid date");

/* ---------- Editorial CMS ---------- */
export const contentTypes = ["DEVOTIONAL", "STUDY_GUIDE", "ARTICLE", "TOPIC"] as const;
export const contentStatuses = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
  .max(120);

export const contentUpsertSchema = z.object({
  type: z.enum(contentTypes),
  slug: slugSchema,
  locale: localeSchema,
  title: trimmed(200).min(1),
  summary: trimmed(600).optional(),
  body: trimmed(100_000).min(1),
  author: trimmed(120).optional(),
  scriptureRefs: z.array(trimmed(60)).max(50).default([]),
  publishDate: z.coerce.date().optional(),
  featured: z.boolean().default(false),
});

export const roles = ["USER", "EDITOR", "MODERATOR", "ADMIN"] as const;
export type Role = (typeof roles)[number];

/* ---------- Administration ---------- */
/** Plan days are structured passages; each must exist in the 66-book canon. */
const canonicalPassage = passageSchema.refine((p) => p.chapter <= (getBook(p.bookId)?.chapters ?? 0), "Chapter out of range");

export const adminPlanSchema = z.object({
  slug: slugSchema,
  kind: z.enum(["CANONICAL", "THEMATIC"]),
  titleEn: trimmed(160).min(1),
  titleMn: trimmed(160).min(1),
  descriptionEn: trimmed(2_000).default(""),
  descriptionMn: trimmed(2_000).default(""),
  days: z.array(z.array(canonicalPassage).min(1).max(20)).min(1).max(400),
  published: z.boolean().default(false),
});
export const adminPlanUpdateSchema = adminPlanSchema.extend({
  descriptionEn: trimmed(2_000).optional(),
  descriptionMn: trimmed(2_000).optional(),
  published: z.boolean().optional(),
}).partial();

export const adminContentSchema = contentUpsertSchema.extend({ status: z.enum(contentStatuses).default("DRAFT") });
export const adminContentUpdateSchema = adminContentSchema.extend({
  scriptureRefs: z.array(trimmed(60)).max(50).optional(),
  featured: z.boolean().optional(),
  status: z.enum(contentStatuses).optional(),
}).partial();

export const adminRoleSchema = z.object({ role: z.enum(roles) });
export const adminTranslationSchema = z.object({ enabled: z.boolean() });
export const moderationDecisionSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]), note: trimmed(1_000).optional() });
