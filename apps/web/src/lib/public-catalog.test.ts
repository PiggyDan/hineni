import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { externalLinks, loadPublicData } from "./public-catalog";
describe("public catalogs", () => {
  it("distinguishes empty results from an unavailable database without inventing records", async () => {
    expect(await loadPublicData(async () => [])).toEqual({ data: [], unavailable: false });
    expect(await loadPublicData(async () => { throw new Error("database"); })).toEqual({ data: null, unavailable: true });
  });
  it("rejects executable and credential-bearing external links", () => {
    expect(externalLinks([{ url: "javascript:alert(1)" }, { url: "https://user:password@example.org" }, { provider: "YOUTUBE", url: "https://www.youtube.com/watch?v=example" }])).toEqual([{ provider: "YOUTUBE", url: "https://www.youtube.com/watch?v=example" }]);
  });
});
