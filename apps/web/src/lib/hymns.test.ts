import { describe, expect, it } from "vitest";
import catalog from "./hymn-catalog.json";
import { backgroundHymns } from "./hymns";

describe("licensed background hymn catalog", () => {
  it("provides more than 100 distinct, verified recording URLs", () => {
    expect(catalog.length).toBeGreaterThan(100);
    expect(new Set(backgroundHymns.map((track) => track.id)).size).toBe(backgroundHymns.length);
    expect(new Set(backgroundHymns.map((track) => track.src)).size).toBe(backgroundHymns.length);
    for (const track of catalog) {
      const url = new URL(track.src);
      expect(url.protocol).toBe("https:");
      expect(url.host).toBe("publicdomainaudiobibles.com");
      expect(url.pathname.startsWith("/content/mp3/Hymns/")).toBe(true);
      expect(track.byteLength).toBeGreaterThan(32);
      expect(track.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("retains attribution and source permission links for every recording", () => {
    for (const track of backgroundHymns) {
      expect(track.artist).toBeTruthy();
      expect(track.license).toBeTruthy();
      for (const link of [track.artistUrl, track.source, track.licenseUrl]) {
        expect(new URL(link).protocol).toBe("https:");
      }
    }
  });
});
