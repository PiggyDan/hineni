import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@cp/db", () => ({ prisma: {} }));
import { planDays, planProgress, readingHref, TOTAL_CHAPTERS } from "./progress";

describe("reading progress", () => {
  it("counts the 66-book canon", () => {
    expect(TOTAL_CHAPTERS).toBe(1189);
  });

  it("finds the first unread day and ignores out-of-range days", () => {
    expect(planProgress(7, [])).toEqual({ completed: 0, percent: 0, nextDay: 1 });
    expect(planProgress(7, [1, 2, 4])).toEqual({ completed: 3, percent: 43, nextDay: 3 });
    expect(planProgress(3, [1, 2, 3, 9])).toEqual({ completed: 3, percent: 100, nextDay: null });
  });

  it("reads plan days defensively from JSON", () => {
    expect(planDays({ days: [[{ bookId: "JHN", chapter: 1 }], "bad", [[]]] })).toHaveLength(2);
    expect(planDays({ days: null })).toEqual([]);
  });

  it("builds reader links with edition and verse anchor", () => {
    expect(readingHref({ bookId: "1JN", chapter: 4, verseStart: 19 }, "kjv")).toBe("/bible/1jn/4?t=kjv#v19");
    expect(readingHref({ bookId: "PSA", chapter: 23 })).toBe("/bible/psa/23");
  });
});
