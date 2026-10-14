import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Opt-in integration test for the HINENI redesign, against a running DEVELOPMENT server.
// Creates and removes only its own accounts, plan and content rows.
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Integration fixtures require a local development server");
const db = new PrismaClient();
const run = randomUUID();
const emails = [`hineni-redesign-${run}-a@example.invalid`, `hineni-redesign-${run}-b@example.invalid`];
const password = `Test-${randomBytes(18).toString("hex")}`;
const createdUsers = [];
const createdPlans = [];
const createdContent = [];
let checks = 0;
const ok = (label) => { checks++; console.log(`  ✓ ${label}`); };

async function request(path, { method = "GET", cookie = "", body } = {}) {
  return fetch(`${base}${path}`, {
    method,
    redirect: "manual",
    headers: { ...(cookie ? { cookie } : {}), ...(method !== "GET" ? { origin: base, "content-type": "application/json" } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function account(email) {
  const response = await request("/api/auth/sign-up/email", { method: "POST", body: { name: "HINENI redesign fixture", email, password, locale: "en" } });
  assert.equal(response.status, 200, "development registration must succeed");
  const body = await response.json();
  createdUsers.push(body.user.id);
  return { id: body.user.id, cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") };
}

try {
  const alice = await account(emails[0]);
  const bob = await account(emails[1]);

  // Reading plans: enroll, progress, completion bounds, isolation, leave.
  const plan = await db.readingPlan.findFirstOrThrow({ where: { published: true }, orderBy: { dayCount: "asc" } });
  assert.equal((await request(`/api/v1/me/plans/${plan.slug}`, { method: "POST" })).status, 401);
  const enrolled = await (await request(`/api/v1/me/plans/${plan.slug}`, { method: "POST", cookie: alice.cookie })).json();
  assert.deepEqual(enrolled.completedDays, []);
  ok("plan enrollment requires auth and starts empty");
  const day1 = await (await request(`/api/v1/me/plans/${plan.slug}`, { method: "PATCH", cookie: alice.cookie, body: { day: 1, completed: true } })).json();
  assert.deepEqual(day1.completedDays, [1]);
  assert.equal((await request(`/api/v1/me/plans/${plan.slug}`, { method: "PATCH", cookie: alice.cookie, body: { day: plan.dayCount + 1, completed: true } })).status, 400);
  assert.equal((await request(`/api/v1/me/plans/${plan.slug}`, { method: "PATCH", cookie: bob.cookie, body: { day: 1, completed: true } })).status, 404);
  ok("day progress saves, rejects out-of-range days and un-enrolled readers");
  for (let day = 1; day <= plan.dayCount; day++) await request(`/api/v1/me/plans/${plan.slug}`, { method: "PATCH", cookie: alice.cookie, body: { day, completed: true } });
  const finished = await db.planEnrollment.findUniqueOrThrow({ where: { userId_planId: { userId: alice.id, planId: plan.id } } });
  assert.ok(finished.completedAt, "completing every day marks the plan complete");
  const mine = await (await request("/api/v1/me/plans", { cookie: alice.cookie })).json();
  assert.equal(mine.find((item) => item.slug === plan.slug).completedDays.length, plan.dayCount);
  assert.equal((await (await request("/api/v1/me/plans", { cookie: bob.cookie })).json()).length, 0);
  ok("completion is recorded and enrollments are per-user");
  assert.equal((await request(`/api/v1/me/plans/${plan.slug}`, { method: "DELETE", cookie: alice.cookie })).status, 200);
  assert.equal(await db.planEnrollment.count({ where: { userId: alice.id } }), 0);
  ok("leaving a plan removes only that enrollment");

  // Journal: encrypted at rest, owner-only, validated references.
  const secret = `journal ${run} Бурхан хайр`;
  const created = await request("/api/v1/me/journal", { method: "POST", cookie: alice.cookie, body: { title: "Reflection", body: secret, refs: ["JHN.3.16", "PSA.23"] } });
  assert.equal(created.status, 200);
  assert.equal(created.headers.get("cache-control"), "private, no-store");
  const entry = await created.json();
  const stored = await db.journalEntry.findUniqueOrThrow({ where: { id: entry.id } });
  assert.ok(!stored.bodyCipher.includes(secret) && !stored.refsCipher.includes("JHN"));
  assert.deepEqual(entry.refs, ["JHN.3.16", "PSA.23"]);
  ok("journal entries and references are encrypted at rest");
  assert.equal((await request("/api/v1/me/journal", { method: "POST", cookie: alice.cookie, body: { title: "Bad", refs: ["XYZ.1"] } })).status, 400);
  assert.equal((await (await request("/api/v1/me/journal", { cookie: bob.cookie })).json()).length, 0);
  assert.equal((await request(`/api/v1/me/journal/${entry.id}`, { method: "PATCH", cookie: bob.cookie, body: { title: "x" } })).status, 404);
  assert.equal((await request(`/api/v1/me/journal/${entry.id}`, { method: "DELETE", cookie: bob.cookie })).status, 404);
  ok("journal rejects invalid references and other users' access");
  const edited = await (await request(`/api/v1/me/journal/${entry.id}`, { method: "PATCH", cookie: alice.cookie, body: { title: "Edited", refs: [] } })).json();
  assert.equal(edited.title, "Edited");
  assert.deepEqual(edited.refs, []);
  assert.equal(edited.body, secret);
  assert.equal((await request(`/api/v1/me/journal/${entry.id}`, { method: "DELETE", cookie: alice.cookie })).status, 200);
  ok("journal entries can be edited and deleted by their owner");

  // Verse notes: owner-only editing.
  const note = await (await request("/api/v1/me/notes", { method: "POST", cookie: alice.cookie, body: { passage: { bookId: "JHN", chapter: 1, verseStart: 1 }, body: "first", translationId: "kjv" } })).json();
  assert.equal((await request(`/api/v1/me/notes/${note.id}`, { method: "PATCH", cookie: bob.cookie, body: { body: "hijack" } })).status, 404);
  const editedNote = await (await request(`/api/v1/me/notes/${note.id}`, { method: "PATCH", cookie: alice.cookie, body: { body: "second" } })).json();
  assert.equal(editedNote.body, "second");
  ok("verse notes are editable only by their owner");

  // Prayer: create, answer with note, reopen, delete.
  const prayer = await (await request("/api/v1/me/prayer", { method: "POST", cookie: alice.cookie, body: { title: "Fixture prayer", body: "for healing", category: "HEALTH" } })).json();
  const answered = await (await request(`/api/v1/me/prayer/${prayer.id}`, { method: "PATCH", cookie: alice.cookie, body: { answered: true, answerNote: "answered" } })).json();
  assert.equal(answered.answered, true);
  assert.equal(answered.answerNote, "answered");
  assert.equal(answered.category, "HEALTH", "status changes keep the category");
  assert.equal(answered.body, "for healing");
  const reopened = await (await request(`/api/v1/me/prayer/${prayer.id}`, { method: "PATCH", cookie: alice.cookie, body: { answered: false } })).json();
  assert.equal(reopened.answered, false);
  assert.equal((await request(`/api/v1/me/prayer/${prayer.id}`, { method: "DELETE", cookie: bob.cookie })).status, 404);
  assert.equal((await request(`/api/v1/me/prayer/${prayer.id}`, { method: "DELETE", cookie: alice.cookie })).status, 200);
  ok("prayers can be answered, reopened and deleted by their owner only");

  // Password policy now also applies to signed-in password changes.
  const weak = await request("/api/auth/change-password", { method: "POST", cookie: alice.cookie, body: { currentPassword: password, newPassword: "short" } });
  assert.equal(weak.status, 400);
  ok("change-password enforces the password policy");

  // Admin: a USER is refused everywhere; an ADMIN can create/edit plans and content.
  const adminCalls = [
    ["/api/v1/admin/plans", "POST", {}],
    ["/api/v1/admin/content", "POST", {}],
    [`/api/v1/admin/users/${bob.id}`, "PATCH", { role: "ADMIN" }],
    ["/api/v1/admin/translations/kjv", "PATCH", { enabled: false }],
    ["/api/v1/admin/churches/x", "PATCH", { status: "APPROVED" }],
    ["/api/v1/admin/reports/x", "PATCH", { status: "APPROVED" }],
  ];
  for (const [path, method, body] of adminCalls) assert.equal((await request(path, { method, cookie: alice.cookie, body })).status, 403, path);
  assert.equal((await db.bibleTranslation.findUniqueOrThrow({ where: { id: "kjv" } })).enabled, true);
  ok("all admin endpoints refuse ordinary users");

  await db.user.update({ where: { id: alice.id }, data: { role: "ADMIN" } }); // test fixture only
  const slug = `fixture-${run.slice(0, 8)}`;
  const newPlan = await request("/api/v1/admin/plans", {
    method: "POST",
    cookie: alice.cookie,
    body: { slug, kind: "THEMATIC", titleEn: "Fixture plan", titleMn: "Туршилт", days: [[{ bookId: "JHN", chapter: 1 }], [{ bookId: "PSA", chapter: 23 }]] },
  });
  assert.equal(newPlan.status, 200);
  const { id: planId } = await newPlan.json();
  createdPlans.push(planId);
  assert.equal((await request("/api/v1/admin/plans", { method: "POST", cookie: alice.cookie, body: { slug, kind: "THEMATIC", titleEn: "x", titleMn: "x", days: [[{ bookId: "JHN", chapter: 1 }]] } })).status, 409);
  assert.equal((await request("/api/v1/admin/plans", { method: "POST", cookie: alice.cookie, body: { slug: `${slug}-bad`, kind: "THEMATIC", titleEn: "x", titleMn: "x", days: [[{ bookId: "JHN", chapter: 99 }]] } })).status, 400);
  assert.equal((await db.readingPlan.findUniqueOrThrow({ where: { id: planId } })).published, false);
  assert.equal((await request(`/api/v1/me/plans/${slug}`, { method: "POST", cookie: bob.cookie })).status, 404, "unpublished plans are not enrollable");
  ok("admins create draft plans; duplicate slugs and invalid chapters are rejected");
  const publish = await request(`/api/v1/admin/plans/${planId}`, { method: "PATCH", cookie: alice.cookie, body: { published: true } });
  assert.equal((await publish.json()).published, true);
  assert.equal((await request(`/en/plans/${slug}`)).status, 200);
  ok("published plans become public");

  const content = await request("/api/v1/admin/content", {
    method: "POST",
    cookie: alice.cookie,
    body: { type: "DEVOTIONAL", slug, locale: "en", title: "Fixture devotional", body: "Body", status: "DRAFT" },
  });
  assert.equal(content.status, 200);
  const { id: contentId } = await content.json();
  createdContent.push(contentId);
  // [locale]/loading.tsx streams responses, so notFound() renders the not-found UI with status 200.
  assert.ok(!(await (await request(`/en/daily/devotionals/${slug}`)).text()).includes("Fixture devotional"), "drafts are not public");
  await request(`/api/v1/admin/content/${contentId}`, { method: "PATCH", cookie: alice.cookie, body: { status: "PUBLISHED" } });
  assert.ok((await (await request(`/en/daily/devotionals/${slug}`)).text()).includes("Fixture devotional"));
  assert.equal(await db.contentRevision.count({ where: { contentId } }), 2);
  ok("content publishing is gated by status and every save records a revision");
  assert.equal((await request(`/api/v1/admin/users/${alice.id}`, { method: "PATCH", cookie: alice.cookie, body: { role: "USER" } })).status, 400);
  ok("admins cannot change their own role");
  assert.equal((await request("/api/v1/admin/translations/oshb-wlc", { method: "PATCH", cookie: alice.cookie, body: { enabled: true } })).status, 200);
  ok("translation toggles accept editions with recorded display rights");

  // Pages render for signed-in readers and redirect anonymous visitors from private pages.
  for (const path of ["/en", "/en/prayer", "/en/journal", "/en/bookmarks", "/en/account", "/en/settings", "/en/plans", "/en/admin", "/en/admin/editions", "/en/admin/plans", "/en/admin/content", "/en/admin/users", "/en/admin/moderation", "/mn", "/mn/plans"]) {
    const response = await request(path, { cookie: alice.cookie });
    assert.equal(response.status, 200, path);
  }
  ok("signed-in and admin pages render");
  for (const path of ["/en/prayer", "/en/journal", "/en/bookmarks", "/en/account", "/en/admin"]) {
    const response = await request(path);
    // Streaming (loading.tsx) turns redirect() into a 200 with a NEXT_REDIRECT marker and meta refresh.
    const redirected = [302, 303, 307].includes(response.status) || (await response.text()).includes("NEXT_REDIRECT;replace;/en/sign-in");
    assert.ok(redirected, `${path} redirects anonymous visitors`);
  }
  const bobAdmin = await (await request("/en/admin", { cookie: bob.cookie })).text();
  assert.ok(bobAdmin.includes("permission"), "non-staff see the forbidden state");
  ok("private pages redirect anonymous visitors; admin shows forbidden to non-staff");
  for (const path of ["/en/library", "/en/daily/plans/love"]) {
    const response = await request(path);
    assert.ok([302, 303, 307, 308].includes(response.status) || (await response.text()).includes("NEXT_REDIRECT"), `${path} redirects`);
  }
  ok("legacy library and plan URLs redirect");
} finally {
  await db.content.deleteMany({ where: { id: { in: createdContent } } });
  await db.readingPlan.deleteMany({ where: { id: { in: createdPlans } } });
  await db.auditLog.deleteMany({ where: { actorId: { in: createdUsers } } });
  await db.verification.deleteMany({ where: { value: { in: createdUsers } } });
  await db.user.deleteMany({ where: { email: { in: emails } } });
  await db.$disconnect();
}
console.log(`${checks} redesign integration checks passed`);
