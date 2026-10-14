import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Use a local development server");
let checks = 0;
async function chapter(edition, book, number, script) {
  const response = await fetch(`${base}/api/v1/bible/${edition}/${book}/${number}`);
  assert.equal(response.status, 200, `${edition} ${book} ${number}`);
  const body = await response.json();
  assert.equal(body.translationId, edition);
  assert.ok(body.verses.length > 0 && body.verses.every(verse => Number.isInteger(verse.verse) && verse.text));
  assert.match(body.verses[0].text, script);
  checks++;
}
for (const [book, number] of [["GEN", 1], ["PSA", 23], ["JHN", 3], ["REV", 22]]) await chapter("kjv", book, number, /[A-Za-z]/u);
for (const [book, number] of [["GEN", 1], ["PSA", 23], ["JOL", 4], ["MAL", 3]]) await chapter("oshb-wlc", book, number, /\p{Script=Hebrew}/u);
for (const [book, number] of [["JHN", 3], ["REV", 22]]) await chapter("grc-tisch", book, number, /\p{Script=Greek}/u);
for (const path of ["oshb-wlc/JHN/3", "oshb-wlc/JOL/5", "oshb-wlc/MAL/4", "grc-tisch/GEN/1", "missing/GEN/1"]) {
  assert.equal((await fetch(`${base}/api/v1/bible/${path}`)).status, 404); checks++;
}
const editions = await (await fetch(`${base}/api/v1/bible/translations`)).json();
assert.equal(editions.find(edition => edition.id === "oshb-wlc").metadata.books.length, 39);
assert.equal(editions.find(edition => edition.id === "grc-tisch").metadata.books.length, 27); checks += 2;
const search = await (await fetch(`${base}/api/v1/bible/search?q=${encodeURIComponent("בראשית")}&t=oshb-wlc`)).json();
// A native book name is a reference; an unpointed Hebrew word must find pointed source text.
assert.ok(search.reference || search.items?.length); checks++;
const words = await (await fetch(`${base}/api/v1/bible/search?q=${encodeURIComponent("אלהים")}&t=oshb-wlc`)).json();
assert.ok(words.items?.length); checks++;
for (const [path, expected] of [["/mn/bible/gen/1?t=kjv", "In the beginning"], ["/he/bible/gen/1?t=oshb-wlc&compare=kjv", "בְּרֵאשִׁ"], ["/el/bible/jhn/3?t=grc-tisch", "Νικόδημος"]]) {
  const response = await fetch(base + path); assert.equal(response.status, 200);
  const html = await response.text(); assert.ok(html.includes(expected), path);
  if (path.startsWith("/he")) { assert.ok(html.includes('dir="rtl"')); assert.ok(html.includes("In the beginning")); }
  checks++;
}
const mn = await (await fetch(`${base}/mn/bible`)).text();
if (!editions.some(edition => edition.language === "mn")) {
  assert.ok(!mn.includes("In the beginning God created"));
  assert.ok(mn.includes("translation") || mn.includes("орчуул")); checks++;
}
const cookiePage = await (await fetch(`${base}/en/bible/jhn/3`, { headers: { cookie: "hineni-bible=grc-tisch" } })).text();
assert.ok(cookiePage.includes("Νικόδημος")); checks++;
console.log(`Multilingual integration: ${checks} checks passed. Mongolian Scripture verified only if an authorized edition is configured.`);
