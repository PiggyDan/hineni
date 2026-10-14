import { describe, expect, it } from "vitest";
import { editionAdjacent, editionBooks, scriptureDirection, scriptureLanguageMatches, type EditionMetadata } from "./edition";
import { parseReference } from "./reference";

const hebrew: EditionMetadata = { direction: "rtl", canon: "tanakh", versification: "wlc", books: [{ id: "GEN", chapters: 50 }, { id: "JOL", chapters: 4 }, { id: "MAL", chapters: 3 }] };
describe("native Scripture editions", () => {
  it("matches historical languages to interface defaults without changing the Scripture language", () => {
    expect(scriptureLanguageMatches("hbo", "he")).toBe(true);
    expect(scriptureLanguageMatches("grc", "el")).toBe(true);
    expect(scriptureLanguageMatches("en", "mn")).toBe(false);
    expect(scriptureDirection("hbo")).toBe("rtl");
    expect(scriptureDirection("ar-SA")).toBe("rtl");
  });
  it("uses source order and chapter counts", () => {
    expect(editionBooks(hebrew, "he")[0]?.name).toBe("בראשית");
    expect(editionAdjacent(hebrew, "JOL", 4, 1)).toEqual({ bookId: "MAL", chapter: 1 });
    expect(editionAdjacent(hebrew, "MAL", 3, 1)).toBeNull();
  });
  it("parses native names and validates native references", () => {
    expect(parseReference("בראשית 1:1", hebrew)).toEqual({ bookId: "GEN", chapter: 1, verseStart: 1 });
    expect(parseReference("Joel 4", hebrew)?.chapter).toBe(4);
    expect(parseReference("Joel 4")).toBeNull();
    expect(parseReference("Malachi 4", hebrew)).toBeNull();
    expect(parseReference("John 3", hebrew)).toBeNull();
  });
});
