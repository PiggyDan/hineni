import { allChapters, getBook } from "./books";
import type { Passage } from "./reference";

export interface PlanTemplate {
  slug: string;
  kind: "CANONICAL" | "THEMATIC";
  title: { en: string; mn: string };
  description: { en: string; mn: string };
  days: Passage[][];
}

/** Spreads chapters as evenly as possible over `dayCount` days. */
export function distribute(chapters: Passage[], dayCount: number): Passage[][] {
  const days: Passage[][] = [];
  const n = chapters.length;
  for (let i = 0; i < dayCount; i++) {
    days.push(chapters.slice(Math.floor((i * n) / dayCount), Math.floor(((i + 1) * n) / dayCount)));
  }
  return days;
}

const whole = (bookId: string): Passage[] => allChapters((b) => b.id === bookId);
const ch = (bookId: string, chapter: number, verseStart?: number, verseEnd?: number): Passage => ({
  bookId,
  chapter,
  ...(verseStart ? { verseStart } : {}),
  ...(verseEnd ? { verseEnd } : {}),
});

/** Built-in plans, seeded into the database; editors can add more in the admin. */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    slug: "bible-in-a-year",
    kind: "CANONICAL",
    title: { en: "The Bible in One Year", mn: "Библийг нэг жилд" },
    description: {
      en: "Read all 1,189 chapters from Genesis to Revelation in 365 days.",
      mn: "Эхлэлээс Илчлэл хүртэлх 1189 бүлгийг 365 өдөрт уншина.",
    },
    days: distribute(allChapters(), 365),
  },
  {
    slug: "new-testament-90",
    kind: "CANONICAL",
    title: { en: "New Testament in 90 Days", mn: "Шинэ Гэрээг 90 өдөрт" },
    description: {
      en: "All 260 chapters of the New Testament in three months.",
      mn: "Шинэ Гэрээний 260 бүлгийг гурван сард уншина.",
    },
    days: distribute(allChapters((b) => b.testament === "NT"), 90),
  },
  {
    slug: "gospel-of-john-21",
    kind: "CANONICAL",
    title: { en: "The Gospel of John in 21 Days", mn: "Иохан сайн мэдээг 21 өдөрт" },
    description: {
      en: "One chapter a day through the Gospel of John.",
      mn: "Өдөрт нэг бүлгээр Иохан сайн мэдээг уншина.",
    },
    days: whole("JHN").map((p) => [p]),
  },
  {
    slug: "psalms-30",
    kind: "CANONICAL",
    title: { en: "Psalms in 30 Days", mn: "Дууллыг 30 өдөрт" },
    description: {
      en: "Pray through all 150 psalms, five a day.",
      mn: "150 дууллыг өдөрт тавааар уншиж залбирна.",
    },
    days: distribute(whole("PSA"), 30),
  },
  {
    slug: "sermon-on-the-mount",
    kind: "THEMATIC",
    title: { en: "The Sermon on the Mount", mn: "Уул дээрх номлол" },
    description: {
      en: "The teaching of Jesus in Matthew 5–7, read slowly over a week.",
      mn: "Матай 5–7 дахь Есүсийн сургаалыг долоо хоногт уншина.",
    },
    days: [
      [ch("MAT", 5, 1, 16)],
      [ch("MAT", 5, 17, 48)],
      [ch("MAT", 6, 1, 18)],
      [ch("MAT", 6, 19, 34)],
      [ch("MAT", 7, 1, 12)],
      [ch("MAT", 7, 13, 29)],
      [ch("LUK", 6, 17, 49)],
    ],
  },
  {
    slug: "love",
    kind: "THEMATIC",
    title: { en: "Love", mn: "Хайр" },
    description: {
      en: "Seven readings on the love of God and love for one another.",
      mn: "Бурханы хайр ба бие биеэ хайрлах тухай долоон уншлага.",
    },
    days: [
      [ch("1CO", 13)],
      [ch("1JN", 4)],
      [ch("JHN", 15, 1, 17)],
      [ch("ROM", 8, 31, 39)],
      [ch("LUK", 10, 25, 37)],
      [ch("ROM", 12, 9, 21)],
      [ch("EPH", 3, 14, 21)],
    ],
  },
];

export function validatePlan(plan: PlanTemplate): boolean {
  return plan.days.every((d) =>
    d.every((p) => {
      const b = getBook(p.bookId);
      return !!b && p.chapter >= 1 && p.chapter <= b.chapters;
    }),
  );
}
