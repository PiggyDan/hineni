import { describe, expect, it } from "vitest";
import { locales } from "@cp/shared";
import { languageSwitchHref, withoutLocalePrefixes } from "./locale-path";

describe("language switch routes", () => {
  it("removes known language prefixes for every supported language", () => {
    for (const locale of locales) {
      expect(withoutLocalePrefixes(`/${locale}`)).toBe("/");
      expect(withoutLocalePrefixes(`/${locale}/bible/gen/1`)).toBe("/bible/gen/1");
      expect(withoutLocalePrefixes(`/${locale}/${locale}`)).toBe("/");
    }
  });
  it("repairs repeated/mixed prefixes without changing real page segments", () => {
    expect(withoutLocalePrefixes("/ru/ru/bible/gen/1")).toBe("/bible/gen/1");
    expect(withoutLocalePrefixes("/mn/ru/en/music")).toBe("/music");
    expect(withoutLocalePrefixes("/sermons/russian" )).toBe("/sermons/russian");
    expect(withoutLocalePrefixes("/churches/ru")).toBe("/churches/ru");
  });
  it("preserves independent Scripture selection, filters and verse anchors", () => {
    expect(languageSwitchHref("/en/bible/gen/1", "?t=kjv&q=God&book=GEN", "#v3")).toBe("/bible/gen/1?t=kjv&q=God&book=GEN#v3");
    expect(languageSwitchHref("/ru/ru", "", "")).toBe("/");
  });
});
