import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Opt-in integration test against a running DEVELOPMENT server. Creates and removes only its own two accounts.
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Integration fixtures require a local development server");
const db = new PrismaClient();
const run = randomUUID();
const emails = [`ruah-test-${run}-a@example.invalid`, `ruah-test-${run}-b@example.invalid`];
const password = `Test-${randomBytes(18).toString("hex")}`;
let checks = 0;
const createdUsers = [];
const createdTracks = [];
const createdArtists = [];
async function request(path, { method = "GET", cookie = "", body, origin = base, documentRequest = false } = {}) {
  return fetch(`${base}${path}`, { method, redirect: "manual", headers: { ...(documentRequest ? { "sec-fetch-dest": "document", "accept-language": "en" } : {}), ...(cookie ? { cookie } : {}), ...(method !== "GET" ? { origin, "content-type": "application/json" } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
async function account(email, locale) {
  const response = await request("/api/auth/sign-up/email", { method: "POST", body: { name: "RUAH integration fixture", email, password, locale, role: "ADMIN" } });
  assert.equal(response.status, 200, "development registration must succeed");
  const body = await response.json(); assert.ok(body.user.id);
  createdUsers.push(body.user.id);
  const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  assert.ok(cookie, "registration must establish a development session");
  checks++;
  return { id: body.user.id, cookie };
}
try {
  assert.equal((await request("/api/v1/health")).status, 200); checks++;
  const alice = await account(emails[0], "mn"); const bob = await account(emails[1], "en");
  const session = await (await request("/api/auth/get-session", { cookie: alice.cookie })).json();
  assert.equal(session.user.role, "USER", "clients cannot escalate roles"); assert.equal(session.user.locale, "mn"); checks++;
  assert.equal((await request("/api/v1/me/notes")).status, 401); checks++;
  const text = `private ${run} Монгол тэмдэглэл`;
  const createdResponse = await request("/api/v1/me/notes", { method: "POST", cookie: alice.cookie, body: { passage: { bookId: "JHN", chapter: 3, verseStart: 16 }, body: text } });
  assert.equal(createdResponse.status, 200);
  assert.equal(createdResponse.headers.get("cache-control"), "private, no-store");
  const note = await createdResponse.json(); checks++;
  const stored = await db.note.findUniqueOrThrow({ where: { id: note.id }, select: { userId: true, bodyCipher: true } });
  assert.equal(stored.userId, alice.id); assert.ok(!stored.bodyCipher.includes(text)); checks++;
  const ownNotes = await (await request("/api/v1/me/notes", { cookie: alice.cookie })).json(); assert.equal(ownNotes.find((value) => value.id === note.id).body, text); checks++;
  for (const translationId of ["kjv", "oshb-wlc"]) {
    const bookmark = await request("/api/v1/me/bookmarks", { method: "POST", cookie: alice.cookie, body: { passage: { bookId: "GEN", chapter: 1, verseStart: 1 }, translationId } });
    assert.equal(bookmark.status, 200);
    const highlight = await request("/api/v1/me/highlights", { method: "PUT", cookie: alice.cookie, body: { bookId: "GEN", chapter: 1, verses: [1], translationId, color: "gold" } });
    assert.equal(highlight.status, 200);
  }
  const editionBookmarks = await (await request("/api/v1/me/bookmarks", { cookie: alice.cookie })).json();
  assert.equal(editionBookmarks.filter(value => value.bookId === "GEN" && value.chapter === 1).length, 2); checks++;
  const editionHighlights = await (await request("/api/v1/me/highlights", { cookie: alice.cookie })).json();
  assert.equal(editionHighlights.filter(value => value.bookId === "GEN" && value.chapter === 1 && value.verse === 1).length, 2); checks++;
  const otherNotes = await (await request("/api/v1/me/notes", { cookie: bob.cookie })).json(); assert.ok(!otherNotes.some((value) => value.id === note.id)); checks++;
  assert.equal((await request(`/api/v1/me/notes/${note.id}`, { method: "DELETE", cookie: bob.cookie })).status, 404); checks++;
  assert.equal((await request("/api/v1/me/preferences", { method: "PATCH", cookie: alice.cookie, origin: "https://attacker.invalid", body: { readerFontSize: 22 } })).status, 403); checks++;
  assert.equal((await request("/api/v1/me/preferences", { method: "PATCH", cookie: alice.cookie, body: { readerFontSize: 999 } })).status, 400); checks++;
  const bookmark = await request("/api/v1/me/bookmarks", { method: "POST", cookie: alice.cookie, body: { passage: { bookId: "JHN", chapter: 3, verseStart: 16 }, translationId: "kjv" } }); assert.equal(bookmark.status, 200); checks++;
  const prayer = await request("/api/v1/me/prayer", { method: "POST", cookie: alice.cookie, body: { title: "Private prayer fixture", body: text } }); assert.equal(prayer.status, 200); checks++;
  const prayers = await (await request("/api/v1/me/prayer", { cookie: bob.cookie })).json(); assert.equal(prayers.total, 0); checks++;
  const media = await request("/api/v1/me/media", { method: "POST", cookie: alice.cookie, body: { kind: "song", title: "Fixture", artist: "Fixture", provider: "YOUTUBE", url: "https://www.youtube.com/watch?v=fixture" } }); assert.equal(media.status, 400, "rights declaration is mandatory"); checks++;
  const mediaResponse = await request("/api/v1/me/media", { method: "POST", cookie: alice.cookie, body: { kind: "song", title: `Integration fixture ${run}`, artist: `Integration artist ${run}`, provider: "YOUTUBE", url: "https://www.youtube.com/watch?v=fixture", rightsConfirmed: true } });
  assert.equal(mediaResponse.status, 201); const mediaRecord = await mediaResponse.json(); createdTracks.push(mediaRecord.id);
  const track = await db.track.findUniqueOrThrow({ where: { id: mediaRecord.id } }); createdArtists.push(track.artistId); assert.equal(track.published, false);
  const mediaAudit = await db.auditLog.findFirstOrThrow({ where: { entityId: track.id, action: "media.submit" } }); assert.equal(mediaAudit.metadata.rightsDeclared, true); checks++;
  for (const locale of ["en", "mn"]) {
    const html = await (await request(`/${locale}/sign-in`)).text(); assert.ok(html.includes("HINENI")); assert.ok(html.includes(`/${locale}/forgot-password`)); checks++;
  }
  const searchResponse = await request("/api/v1/bible/search?q=world&t=kjv&book=JHN&chapter=3");
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json(); assert.ok(search.items.some((value) => value.bookId === "JHN" && value.chapter === 3 && value.verse === 16)); checks++;
  const phrase = await (await request("/api/v1/bible/search?q=God%20so%20loved&t=kjv&mode=phrase&book=JHN")).json(); assert.ok(phrase.items.some((value) => value.chapter === 3 && value.verse === 16)); checks++;
  const reference = await (await request("/api/v1/bible/search?q=John%203%3A16&t=kjv")).json(); assert.equal(reference.reference.bookId, "JHN"); assert.equal(reference.reference.verseStart, 16); checks++;
  const imported = await db.bibleTranslation.findUniqueOrThrow({ where: { id: "kjv" }, include: { license: true } }); assert.equal(imported.license.displayAllowed, true); checks++;
  const chapters = await db.bibleChapter.count({ where: { translationId: "kjv" } }); assert.equal(chapters, 1189); checks++;
  const chapterResponse = await (await request("/api/v1/bible/kjv/gen/1")).json(); assert.equal(chapterResponse.verses.length, 31); assert.ok(chapterResponse.copyright.includes("Dataset: thiagobodruk")); checks++;
  assert.equal((await request("/api/v1/bible/search?q=&t=kjv")).status, 400); checks++;
  const maliciousQuery = await request(`/api/v1/bible/search?${new URLSearchParams({ q: "world' OR '1'='1", t: "kjv" })}`); assert.equal(maliciousQuery.status, 200); assert.equal((await maliciousQuery.json()).items.length, 0); checks++;
  const mongolianPage = await request("/mn", { documentRequest: true });
  assert.equal(mongolianPage.status, 200);
  // next-intl's useRouter writes this cookie in the browser during a locale switch.
  // A bare server fetch is not a selector interaction; this checks server preference handling.
  const languageCookie = "NEXT_LOCALE=mn";
  const homeRedirect = await request("/", { cookie: languageCookie, documentRequest: true }); assert.equal(new URL(homeRedirect.headers.get("location"), base).pathname, "/mn"); checks++;
  const resetResponse = await request("/api/auth/request-password-reset", { method: "POST", body: { email: emails[0], redirectTo: `${base}/mn/reset-password` } }); assert.equal(resetResponse.status, 200); checks++;
  const verification = await db.verification.findFirstOrThrow({ where: { value: alice.id, identifier: { startsWith: "reset-password:" } }, orderBy: { createdAt: "desc" } });
  const token = verification.identifier.slice("reset-password:".length);
  const newPassword = `Reset-${randomBytes(18).toString("hex")}`;
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { token, newPassword: "weak" } })).status, 400); checks++;
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { token, newPassword } })).status, 200); checks++;
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { token, newPassword } })).status, 400, "reset tokens are single use"); checks++;
  assert.equal((await request("/api/v1/me/notes", { cookie: alice.cookie })).status, 401, "password reset revokes old sessions"); checks++;
  assert.equal((await request("/api/auth/sign-in/email", { method: "POST", body: { email: emails[0], password } })).status, 401); checks++;
  assert.equal((await request("/api/auth/sign-in/email", { method: "POST", body: { email: emails[0], password: newPassword } })).status, 200); checks++;
  console.log(`PASS: ${checks} real HTTP/database foundation checks`);
} finally {
  // Unique random fixture emails identify only accounts created by this run. No existing user is touched.
  await db.track.deleteMany({ where: { id: { in: createdTracks } } });
  await db.artist.deleteMany({ where: { id: { in: createdArtists } } });
  await db.verification.deleteMany({ where: { value: { in: createdUsers } } });
  await db.auditLog.deleteMany({ where: { actorId: { in: createdUsers } } });
  await db.user.deleteMany({ where: { email: { in: emails } } });
  await db.$disconnect();
}
