import { describe, expect, it } from "vitest";
import {
  BIBLE_BOOKS,
  bookName,
  locales,
  TOTAL_CHAPTERS,
  adjacentChapter,
  dailyVerseReference,
  flattenMessages,
  formatReference,
  messages,
  parsePassageKey,
  parseReference,
  passageKey,
  PLAN_TEMPLATES,
  validatePlan,
  prayerCreateSchema,
  registerSchema,
  mediaSubmissionSchema,
  churchDistanceKm,
  distanceBetweenCoordinatesKm,
} from "./index";

describe("bible books", () => {
  it("localizes every book and accepts localized references", () => {
    for (const locale of locales) {
      for (const book of BIBLE_BOOKS) {
        expect(bookName(book.id, locale)).toBeTruthy();
      }
    }
    expect(bookName("GEN", "fr")).toBe("Genèse");
    expect(bookName("REV", "zh")).toBe("启示录");
    expect(parseReference("Jean 3:16")).toEqual({ bookId: "JHN", chapter: 3, verseStart: 16 });
    expect(parseReference("约翰福音 3:16")).toEqual({ bookId: "JHN", chapter: 3, verseStart: 16 });
  });
  it("has the 66-book Protestant canon with 1,189 chapters", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(TOTAL_CHAPTERS).toBe(1189);
    expect(BIBLE_BOOKS.filter((b) => b.testament === "NT")).toHaveLength(27);
  });

  it("crosses book boundaries", () => {
    expect(adjacentChapter("GEN", 50, 1)).toEqual({ bookId: "EXO", chapter: 1 });
    expect(adjacentChapter("EXO", 1, -1)).toEqual({ bookId: "GEN", chapter: 50 });
    expect(adjacentChapter("REV", 22, 1)).toBeNull();
    expect(adjacentChapter("GEN", 1, -1)).toBeNull();
  });
});

describe("reference parser", () => {
  it.each([
    ["John 3:16", { bookId: "JHN", chapter: 3, verseStart: 16 }],
    ["jn 3:16-18", { bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: 18 }],
    ["1 Cor 13:4–7", { bookId: "1CO", chapter: 13, verseStart: 4, verseEnd: 7 }],
    ["Ps 23", { bookId: "PSA", chapter: 23 }],
    ["Song of Songs 2", { bookId: "SNG", chapter: 2 }],
    ["Иохан 3:16", { bookId: "JHN", chapter: 3, verseStart: 16 }],
    ["1 Иохан 4:8", { bookId: "1JN", chapter: 4, verseStart: 8 }],
    ["Дуулал 23", { bookId: "PSA", chapter: 23 }],
    ["Romans", { bookId: "ROM", chapter: 1 }],
  ])("parses %s", (input, expected) => {
    expect(parseReference(input)).toEqual(expected);
  });

  it.each(["", "Hezekiah 1", "John 22", "John 3:5-2", "Genesis 0"])("rejects %s", (input) => {
    expect(parseReference(input)).toBeNull();
  });

  it("formats and round-trips keys", () => {
    const p = { bookId: "JHN", chapter: 3, verseStart: 16, verseEnd: 18 };
    expect(formatReference(p)).toBe("John 3:16–18");
    expect(formatReference(p, "mn")).toBe("Иохан 3:16–18");
    expect(passageKey(p)).toBe("JHN.3.16-18");
    expect(parsePassageKey("JHN.3.16-18")).toEqual(p);
    expect(parsePassageKey("XXX.1")).toBeNull();
  });
});

describe("daily verse", () => {
  it("is deterministic per day", () => {
    expect(dailyVerseReference("2026-01-01")).toEqual(dailyVerseReference("2026-01-01"));
    expect(dailyVerseReference("2026-01-01")).not.toEqual(dailyVerseReference("2026-01-02"));
  });
});

describe("reading plans", () => {
  it("are valid and complete", () => {
    for (const plan of PLAN_TEMPLATES) expect(validatePlan(plan)).toBe(true);
    const year = PLAN_TEMPLATES.find((p) => p.slug === "bible-in-a-year")!;
    expect(year.days).toHaveLength(365);
    expect(year.days.flat()).toHaveLength(1189);
    expect(year.days.every((d) => d.length >= 3)).toBe(true);
  });
});

describe("i18n", () => {
  it("uses translated homepage and account text for every selected language", () => {
    for (const locale of locales.filter((value) => value !== "en")) {
      expect(messages[locale].home.heroTitle, locale).not.toBe(messages.en.home.heroTitle);
      expect(messages[locale].home.heroBody, locale).not.toBe(messages.en.home.heroBody);
      expect(messages[locale].home.startReading, locale).not.toBe(messages.en.home.startReading);
      expect(messages[locale].footer.about, locale).not.toBe(messages.en.footer.about);
      expect(messages[locale].auth.signInTitle, locale).not.toBe(messages.en.auth.signInTitle);
    }
    expect(messages.ru.home.heroTitle).toBe("Приблизьтесь к Слову.");
  });
  it("all supported locales preserve the same keys and placeholders as English", () => {
    const en = flattenMessages(messages.en);
    const localeKeys = Object.keys(messages) as (keyof typeof messages)[];
expect(localeKeys).toEqual(expect.arrayContaining(["en", "mn", "ru", "es", "fr", "ar", "pt", "tr", "id", "hi", "zh", "he"]));

    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const locale of localeKeys) {
      const next = flattenMessages(messages[locale]);
      expect(Object.keys(next).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en)) expect(vars(next[key]!), key).toEqual(vars(en[key]!));
    }
  });
});

describe("nearby churches", () => {
  it("calculates real-world distances in kilometers", () => {
    expect(distanceBetweenCoordinatesKm(40.7128, -74.006, 40.7128, -74.006)).toBeCloseTo(0, 5);
    const approxDistance = distanceBetweenCoordinatesKm(40.7128, -74.006, 40.7306, -73.9352);
    expect(approxDistance).toBeGreaterThan(5);
    expect(approxDistance).toBeLessThan(10);
    expect(churchDistanceKm({ latitude: 40.7128, longitude: -74.006 }, { latitude: 40.7306, longitude: -73.9352 })).toBeCloseTo(approxDistance, 5);
    expect(churchDistanceKm({ latitude: null, longitude: null }, { latitude: 40.7306, longitude: -73.9352 })).toBeNull();
  });
});

describe("schemas", () => {
  it("enforces password strength", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@b.co", password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A", email: "A@B.co", password: "longenough12" }).data?.email).toBe(
      "a@b.co",
    );
  });

  it("defaults prayer category", () => {
    expect(prayerCreateSchema.parse({ title: "Thanks" })).toEqual({ title: "Thanks", body: "", category: "PERSONAL" });
  });

  it("accepts user media submissions for songs and sermons", () => {
    expect(
      mediaSubmissionSchema.safeParse({
        kind: "song",
        title: "Grace Comes Down",
        artist: "Harvest Worship",
        url: "https://music.youtube.com/watch?v=example",
        provider: "YOUTUBE",
        duration: "4:12",
      }).success,
    ).toBe(true);

    expect(
      mediaSubmissionSchema.safeParse({
        kind: "sermon",
        title: "Faith in the Storm",
        speaker: "Pastor Daniel Reed",
        url: "https://www.youtube.com/watch?v=example",
        provider: "YOUTUBE",
        category: "Encouragement",
        date: "2026-10-13",
      }).success,
    ).toBe(true);

    expect(
      mediaSubmissionSchema.safeParse({
        kind: "song",
        title: "Grace",
        artist: "Harvest",
        url: "not-a-url",
      }).success,
    ).toBe(false);
  });
});
