import { afterEach, describe, expect, it, vi } from "vitest";
import { getBibleProvider } from "./getbible";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Mongolian Scripture source", () => {
  const enabled = () => {
    vi.stubEnv("MONGOLIAN_BIBLE_RIGHTS_CONFIRMED", "true");
    return getBibleProvider.translations().find((translation) => translation.id === "monkjv")!;
  };

  it("requests the same chapter in Mongolian and preserves its verse numbers and attribution", async () => {
    const mongolian = enabled();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ verses: [{ verse: 1, text: " Иймээс бид  итгэлээр гүйцгээе. " }] }),
    });
    vi.stubGlobal("fetch", fetch);
    const chapter = await getBibleProvider.getChapter(mongolian, "HEB", 12);
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.getbible.net/v2/monkjv/58/12.json");
    expect(chapter.verses).toEqual([{ verse: 1, text: "Иймээс бид итгэлээр гүйцгээе." }]);
    expect(chapter.translationId).toBe("monkjv");
    expect(chapter.copyright).toContain("Mongolian Team");
    expect(mongolian.cacheable).toBe(false);
  });

  it("reports missing Old Testament content instead of displaying English", async () => {
    const mongolian = enabled();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(getBibleProvider.getChapter(mongolian, "GEN", 1)).rejects.toThrow("only the New Testament");
    expect(fetch).not.toHaveBeenCalled();
  });
});
