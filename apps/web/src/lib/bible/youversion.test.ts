import { describe, expect, it } from "vitest";
import { parseYouVersionVerses } from "./youversion";
describe("authorized provider HTML parsing", () => {
  it("keeps authentic Unicode and verse boundaries while removing labels and notes", () => {
    expect(parseYouVersionVerses('<p><span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>בְּרֵאשִׁית &amp; <span class="yv-note">note</span><span class="yv-v" v="3"></span>λόγος<script>bad()</script></p>')).toEqual([{ verse: 1, text: "בְּרֵאשִׁית &" }, { verse: 3, text: "λόγος" }]);
  });
  it("rejects unsupported merged markers and unnumbered content", () => {
    expect(() => parseYouVersionVerses('<span class="yv-v" v="1-2"></span>text')).toThrow();
    expect(() => parseYouVersionVerses('<p>unnumbered</p>')).toThrow();
  });
});
