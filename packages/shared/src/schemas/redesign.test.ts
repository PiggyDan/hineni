import { describe, expect, it } from "vitest";
import { adminPlanSchema, adminRoleSchema, journalEntrySchema, messages, flattenMessages } from "../index";

describe("journal entry schema", () => {
  it("accepts canonical passage keys only", () => {
    expect(journalEntrySchema.parse({ title: "Reflection", refs: ["JHN.3.16", "PSA.23", "1CO.13.4-7"] }).refs).toHaveLength(3);
    expect(journalEntrySchema.safeParse({ title: "x", refs: ["XYZ.1"] }).success).toBe(false);
    expect(journalEntrySchema.safeParse({ title: "x", refs: ["John 3:16"] }).success).toBe(false);
    expect(journalEntrySchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  const plan = { slug: "hope-7", kind: "THEMATIC", titleEn: "Hope", titleMn: "Итгэл найдвар", days: [[{ bookId: "ROM", chapter: 8 }]] };
  it("validates plan days against the canon", () => {
    expect(adminPlanSchema.parse(plan).published).toBe(false);
    expect(adminPlanSchema.safeParse({ ...plan, days: [[{ bookId: "JUD", chapter: 2 }]] }).success).toBe(false);
    expect(adminPlanSchema.safeParse({ ...plan, slug: "Bad Slug" }).success).toBe(false);
    expect(adminPlanSchema.safeParse({ ...plan, days: [] }).success).toBe(false);
  });
  it("only allows known roles", () => {
    expect(adminRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(adminRoleSchema.safeParse({ role: "ROOT" }).success).toBe(false);
  });
});

describe("redesign dictionaries", () => {
  it("ships Mongolian strings for every app key instead of English fallbacks", () => {
    const en = flattenMessages(messages.en.app);
    const mn = flattenMessages(messages.mn.app);
    expect(Object.keys(mn).sort()).toEqual(Object.keys(en).sort());
    const untranslated = Object.keys(en).filter((key) => en[key] === mn[key] && !/^[\s\p{P}]*$/u.test(en[key]!) && en[key] !== "Slug");
    expect(untranslated).toEqual([]);
  });
});

describe("update schemas", () => {
  it("do not inject defaults for fields that are not being edited", async () => {
    const { journalEntryUpdateSchema, adminPlanUpdateSchema, adminContentUpdateSchema } = await import("../index");
    expect(journalEntryUpdateSchema.parse({ title: "Only title" })).toEqual({ title: "Only title" });
    expect(adminPlanUpdateSchema.parse({ published: true })).toEqual({ published: true });
    expect(adminContentUpdateSchema.parse({ status: "PUBLISHED" })).toEqual({ status: "PUBLISHED" });
    const { prayerUpdateSchema } = await import("../index");
    expect(prayerUpdateSchema.parse({ answered: true })).toEqual({ answered: true });
  });
});
