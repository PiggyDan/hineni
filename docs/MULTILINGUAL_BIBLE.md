# HINENI multilingual Bible — Phase 3

Implemented locally on 2026-10-13 in the existing application. This is a working reading slice, not complete worldwide language support.

## Behavior and modified areas

Interface locale (`NEXT_LOCALE`, `hineni:interface-language`) and Scripture edition (`hineni-bible`, `hineni:bible-translation`) persist independently, with signed-in account preferences. URL `t` takes priority, then device cookie, then account setting, then matching language default. English defaults to KJV; historical hbo/grc match Hebrew/Greek interfaces. Explicit Mongolian + KJV is permitted; unavailable Mongolian never silently substitutes English.

Modified shared edition/reference/book metadata, importer validation/tools, i18n registry/dictionaries, reader context, providers, translation/reference/book pickers, chapter/index/search/daily/home views, parallel reader, preference/annotation APIs, library links, Prisma schema/migration and tests. API edition responses expose source, BCP 47 language, publisher/license, direction, download/audio flags and coverage verification.

Parallel columns use independent references and source numbering, with an explicit warning about mismatches. Hebrew niqqud/accents remain in Scripture; separate normalized indexed search supports unpointed queries. Bookmarks/highlights/history are edition-specific. Notes carry edition IDs; legacy null-ID notes display only in KJV. Annotation writes verify source chapter/verse availability.

## Integrated sources and coverage

| ID | Language | Source and license | Verified coverage |
| --- | --- | --- | --- |
| kjv | en | Existing thiagobodruk/bible dataset; public domain subject to regional restrictions | 66 books / 1,189 chapters |
| oshb-wlc | hbo | [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb), [CC BY 4.0](https://github.com/openscriptures/morphhb/blob/master/LICENSE.md); underlying WLC public domain | 39 OT source files in Tanakh order; no NT |
| grc-tisch | grc | [eBible Tischendorf Greek NT](https://ebible.org/find/show.php?id=grc-tisch), public domain | 27 NT books; no OT |

OSHB's Jewish 24-book grouping is represented as 39 canonical file units. Ketiv is preserved; alternate-reading notes and morphological slash separators are omitted. Source numbering is retained: Joel four chapters, Malachi three; Psalm superscriptions can differ from KJV. KJV cross-reference mappings are disabled for these editions. Greek critical-edition verse gaps are not filled from another text. No transliteration dataset was invented.

`scripts/prepare-original-bibles.mjs` prepares imports using a pinned Hebrew Git commit and Greek download checksum. Downloads/generated datasets are ignored under `.local/`; deployment requires reproducing imports. Review source rights before `npm run import:bible -w @cp/db -- <dataset> --confirm-rights`.

Existing getBible French Darby, Russian Synodal, Spanish SSE, Portuguese Livre (CC BY 3.0 Brazil), Chinese classical Union, and bible-api.com WEB/KJV remain. Added getBible `luther1545` (de), `korean` (ko), `japbungo` (ja), identified as public domain in [provider metadata](https://api.getbible.net/v2/translations.json); [CrossWire JapBungo](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=JapBungo) corroborates that edition's status. Their catalogs list 66 books and all four requested passages returned numbered source text. This is not a per-verse audit or worldwide legal clearance; remote chapter coverage without edition metadata remains explicitly unverified.

YouVersion uses the app-licensed catalog; full-catalog metadata is never treated as text permission. Each passage refreshes attribution/authorization; HTML is parsed into plain numbered text, never injected. Missing attribution, quota failures, merged verse markers or absent books fail visibly. No YouVersion passage text is cached. Other memory caches expire in five minutes; permitted persistent text caches refresh after 30 days. Imported chapters recheck enabled/display rights. API.Bible requires a key plus confirmed product rights and is not currently configured.

## Mongolian blocker and exact next steps

Last successful checks: app-licensed Mongolian catalog HTTP 204/no editions; AB2004 (369) HTTP 404. Latest recheck returned HTTP 429, so access could not be reassessed. These results do not establish absence from every provider.

Request AB2004 (369) access for this application through the [YouVersion platform](https://platform.youversion.com/); then rerun `scripts/check-youversion-access.mjs` after quota recovery and verify actual chapter permission/attribution. Alternatively obtain an API.Bible account with an authorized Mongolian Bible ID and confirmed HINENI rights, or a complete publisher-authorized dataset from the [Mongolian Union Bible Society](https://mongol.bible/ab2004/contact-us/). Bible.com availability and MonKJV's permission to CrossWire do not authorize HINENI redistribution. No permission requests were sent.

Register/import only after permission is established, then verify Mongolian GEN1, PSA23, JHN3 and REV22. Actual Mongolian Scripture is not integrated yet.

## Remaining limitations

All 14 requested interface locales are registered, preserving Turkish/Indonesian. Added Greek/German/Korean/Japanese navigation, homepage and core Bible labels; advanced/auth/admin/music labels still include English fallbacks pending complete localization/native review. Existing foundation fallback policy outside en/mn remains. Do not call this complete interface translation.

Existing audio/music remains. Mongolian narration requires a matching local voice, or explicitly enabled matching online voice; English is never substituted. Historical Hebrew/Greek narration may use modern system voices, not verified historical pronunciation or a licensed recorded Bible. No new recorded audio was integrated.

No interactive browser was available. Client interaction, mobile visuals, localStorage reload behavior, actual speech playback and accessibility conformance remain unverified; HTTP/cookie/source tests do not prove them. Comparison book selection may need adjustment when the selected edition has different coverage. No automatic cross-tradition verse alignment is claimed.

## Validation and database changes

- 65 unit tests covering existing behavior, locale parity, native references/counts/direction, language-safe voices and provider HTML parsing.
- 37 isolated real HTTP/PostgreSQL checks, including two-edition bookmark/highlight isolation and privacy/auth protections.
- 24 multilingual live checks: KJV four passages; Hebrew GEN1/PSA23/JOL4/MAL3; Greek JHN3/REV22; absent coverage, Hebrew search, RTL/parallel server output, device cookie and explicit Mongolian unavailable state.
- 12 additional German/Korean/Japanese passage checks succeeded.
- TypeScript, ESLint, Prisma validation and production build run; final results recorded in implementation status.

Migration `20261013100000_multilingual_editions` adds JSON edition metadata, normalized text/search indexes and nullable note edition IDs; uniqueness includes edition IDs. No personal records were deleted. Hebrew/Greek source imports added data. No environment changes, deployment or production writes.
