import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@cp/db", () => ({ prisma: { bibleTranslation: { findMany: async () => [] } } }));

import { defaultTranslation, resolveTranslation } from "./index";

describe("default bible translation", () => {
  it("uses King James Version for English users", async () => {
    expect((await defaultTranslation("en")).translation?.id).toBe("kjv");
  });

  it("prefers AB2004 only when a licensed Mongolian provider registers it", async () => {
    vi.stubEnv("API_BIBLE_KEY", "fixture-key-not-a-real-credential");
    vi.stubEnv("API_BIBLE_RIGHTS_CONFIRMED", "true");
    vi.stubEnv("API_BIBLE_TRANSLATIONS", "mn-other:mn:fixture-other,mn-ab2004:mn:fixture-ab2004:Ариун Библи 2004");
    try {
      const result = await defaultTranslation("mn");
      expect(result.translation?.id).toBe("mn-ab2004");
      expect(result.fallback).toBe(false);
    } finally { vi.unstubAllEnvs(); }
  });

  it.each(["fr", "ru", "es", "pt", "zh"])("selects native Scripture for %s", async (locale) => {
    const result = await defaultTranslation(locale);
    expect(result.translation?.language).toBe(locale);
    expect(result.fallback).toBe(false);
  });

  it("does not enable Mongolian distribution without confirmed product rights", async () => {
    vi.stubEnv("MONGOLIAN_BIBLE_RIGHTS_CONFIRMED", "false");
    expect((await defaultTranslation("mn")).fallback).toBe(true);
    expect((await defaultTranslation("mn")).translation).toBeNull();
    vi.unstubAllEnvs();
  });

  it("reports missing editions and permits an explicit edition", async () => {
    expect((await defaultTranslation("hi")).fallback).toBe(true);
    expect((await resolveTranslation("kjv", "fr")).translation?.id).toBe("kjv");
    expect((await resolveTranslation("missing-edition", "en")).translation).toBeNull();
  });
});
