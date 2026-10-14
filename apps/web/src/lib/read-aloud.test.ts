import { describe, expect, it } from "vitest";
import { matchingLocalVoices, narrationStyles, preferredVoice, speechChunks } from "./read-aloud";

describe("Scripture read aloud", () => {
  it("prefers enhanced installed voices and uses a restrained calm delivery", () => {
    const basic = { name: "Basic", default: true };
    const enhanced = { name: "Enhanced local voice", default: false };
    expect(preferredVoice([basic, enhanced])).toBe(enhanced);
    expect(preferredVoice([basic])).toBe(basic);
    expect(preferredVoice([])).toBeUndefined();
    expect(narrationStyles.calm.rate).toBeLessThan(narrationStyles.natural.rate);
    expect(narrationStyles.calm.pitch).toBeGreaterThanOrEqual(0.9);
  });
  it("uses only local voices matching Scripture language, including regional variants", () => {
    const localEnglish = { lang: "en-US", localService: true };
    const localRussian = { lang: "ru_RU", localService: true };
    const remoteEnglish = { lang: "en-GB", localService: false };
    const voices = [localEnglish, localRussian, remoteEnglish];
    expect(matchingLocalVoices(voices, "en")).toEqual([localEnglish]);
    expect(matchingLocalVoices(voices, "ru")).toEqual([localRussian]);
    expect(matchingLocalVoices(voices, "mn")).toEqual([]);
    expect(matchingLocalVoices(voices, "en", true)).toEqual([localEnglish, remoteEnglish]);
  });
  it("retains every Scripture word and punctuation while limiting utterance length", () => {
    const text = "In the beginning God created the heaven and the earth. ".repeat(30).trim();
    const chunks = speechChunks(text);
    expect(chunks.join(" ")).toBe(text);
    expect(chunks.every((chunk) => chunk.length <= 220)).toBe(true);
  });
  it("offers Hebrew and Greek voices for historical text without an English substitute", () => {
    const he = { lang: "he-IL", localService: true };
    const el = { lang: "el-GR", localService: true };
    const en = { lang: "en-US", localService: true };
    expect(matchingLocalVoices([he, el, en], "hbo")).toEqual([he]);
    expect(matchingLocalVoices([he, el, en], "grc")).toEqual([el]);
    expect(matchingLocalVoices([en], "mn")).toEqual([]);
  });
  it("handles empty verses and scripts without whitespace", () => {
    expect(speechChunks(" ")).toEqual([]);
    const text = "起初神创造天地。".repeat(60);
    expect(speechChunks(text).join("")).toBe(text);
    expect(speechChunks(text).every((chunk) => chunk.length <= 220)).toBe(true);
  });
});
