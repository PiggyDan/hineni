# HINENI implementation status

## Multilingual Bible Phase 3 (2026-10-13)

Implemented independent settings, explicit unavailable states, OSHB Hebrew (39 OT source files, CC BY 4.0), Tischendorf Greek (27 NT books, public domain), source-aware numbering, Hebrew search, RTL, independent parallel references and edition-isolated annotations. German/Korean/Japanese remote sources were added. Full details and source permissions: [MULTILINGUAL_BIBLE.md](MULTILINGUAL_BIBLE.md).

Final validation passed: TypeScript, ESLint with no warnings, 65 unit tests, Prisma schema validation, production build, 37 foundation HTTP/database checks and 24 multilingual HTTP checks. Twelve remote German/Korean/Japanese passage checks also succeeded. Browser interaction/audio playback remain unverified. Applied migration `20261013100000_multilingual_editions` and imported the two original-language sources; no personal records were deleted.

Mongolian is blocked by unconfirmed edition access: previous successful checks returned catalog 204 and AB2004 404; latest check returned 429. Exact next steps: obtain authorized Mongolian access/dataset, recheck chapter permission and attribution, register/import it and verify GEN1/PSA23/JHN3/REV22. Complete advanced interface labels/native review and real browser/device/audio QA. No deployment occurred.

Updated: 2026-10-13. Phase 1 foundation delivered locally; Phase 2 database/import/search slice delivered. The full platform is not production-ready and later phases are not claimed complete.

## Architecture and preservation

- Evolved the existing Next.js modular monolith, keeping npm workspaces and @cp package names.
- Preserved the original navy/gold/ivory theme, reader, supported locale dictionaries, private encryption format and existing database tables/records.
- No secrets were printed or changed; no Git reset, clean, staging or commit was performed. The project was already entirely untracked at audit time.
- Existing dev server remains available at http://localhost:3000. Its process was briefly restarted to release Prisma's Windows DLL lock; the existing Next dev parent restored service.

## Completed Phase 1 work

- Central RUAH names/taglines/mark/app scheme, configurable SVG icon and social metadata; legacy Selah deep-link scheme retained for compatibility.
- Bilingual English/Mongolian registration/sign-in labels, validation, loading/error states, password recovery/reset pages and email-verification resend control.
- Server-enforced registration/password policy, client role-escalation rejection, optional Google OAuth configuration with encrypted provider tokens. Google is hidden when credentials are absent and has not been tested against Google's service.
- Persistent locale preference cookie, compact mobile bottom navigation and original responsive styles preserved. Other existing locales remain; new foundation messages use English outside launch languages pending translation.
- Protected APIs enforce sessions/roles, cross-site-write rejection, default rate limits, fail-closed limiter storage and private no-store response headers. Errors log categories without dumping SQL/private payloads.
- Fake worship/sermon/church fallback records removed. Published database catalogs have empty/outage states; churches require APPROVED status and search filters are validated. Public links reject executable/credential-bearing URLs.
- Official-link media submission has actual asynchronous UI feedback, input validation, mandatory rights declaration, unpublished records and transactional audit history. Raw uploads are disabled pending private quarantine/scanning/storage.
- Auth/private pages have noindex metadata and robots exclusions. Public sitemap, icon and an OpenAPI 3.1 contract are available.
- Local PostgreSQL Compose configuration, CI workflow and a production-mode build launcher added. Prisma CLI remains version 6.19.3 as root development tooling, with patched deepmerge-ts 8.0.2.

## Completed Phase 2 slice

- Normalized Bible license/translation/book/chapter/verse models with foreign keys, unique constraints and canonical keys.
- Verified JSON import contract, public-domain KJV preparation, transactional importer, license/attribution evidence, immutable content checksum, idempotent reimport and import audit event.
- Imported KJV: 66 books, 1,189 chapters, 31,102 verses. Source file is ignored under .local/bible; source/license evidence is documented in BIBLE_IMPORT.md.
- Imported enabled translations automatically appear in the reader registry and take priority over remote editions. Chapter reader and daily passage retrieval use PostgreSQL for KJV.
- Indexed, parameterized PostgreSQL word/phrase search with translation/book/chapter filters, bounded pagination and verse-reference resolution, through real UI and REST endpoints.
- Mongolian/API.Bible remote integrations require confirmed product rights. MonKJV's public source grants CrossWire distribution, not automatic RUAH rights; the integration remains disabled by default. No AI-generated Scripture is used.
- Correct fallback notices preserved even when homepage reader context supplies an explicit English edition.

## Database changes applied

Migration: packages/db/prisma/migrations/20261013050000_bible_content/migration.sql.

Created only: bible_license, bible_translation, bible_book, bible_chapter, bible_verse, foreign keys, indexes and a generated simple tsvector/GIN search index. Existing tables and user records were not reset, renamed or removed. Imported KJV and its rights/audit metadata were added. Migration status reports all three migrations applied and the schema current. Reimporting the same KJV dataset was tested and leaves it unchanged.

## Validation executed and results

- Full workspace TypeScript: PASS.
- Full web ESLint: PASS, no outstanding lint warnings/errors.
- Unit tests: PASS, 47 tests across seven files (20 web, 27 shared).
- Real HTTP/PostgreSQL integration: PASS, 35 checks. Includes registration, role escalation prevention, encrypted Unicode notes, ownership isolation, bookmark/prayer persistence, rights-attested unpublished submissions/audit, invalid-input and CSRF rejection, indexed word/phrase/reference search, canonical chapter counts, session revocation, old-password rejection, single-use reset tokens, and server handling of the client-set language cookie.
- Fixture cleanup removes only randomly identified accounts/content created by that test run. No real account was deleted.
- Prisma schema validation and read-only migration status: PASS.
- Production Next.js build: PASS, including Bible search, recovery routes, icon, sitemap, robots and OpenAPI.
- Runtime npm audit (--omit=dev): zero findings. Full development audit: seven findings (five high through unpatched braces/ESLint glob dependencies, two moderate through postcss-selector-parser/typography). Forced suggested fixes downgrade framework tooling and were not applied.
- Browser automation was unavailable in this session. HTTP/static source checks are not interactive browser/accessibility verification. CI and Docker configuration were written but not executed remotely or started locally. No deployment was performed.
- Production SMTP delivery and Google OAuth cannot be verified without external credentials. Password-reset behavior was tested against the local development email callback.

## Main files created or modified

- packages/shared/src/branding.ts; i18n/en.json, mn.json, index.ts; schemas/index.ts; bible/import.ts and import tests.
- packages/db/prisma/schema.prisma and the additive migration; scripts/import-bible.ts, prepare-kjv.ts; package.json and src/index.ts exports.
- apps/web auth components and sign-in/sign-up/forgot-password/reset-password/account routes.
- apps/web/src/lib/auth.ts, env.ts, api.ts, rate-limit.ts, public-catalog.ts and their security/privacy tests.
- Bible provider registry/database/search implementations and tests; chapter/index/search/verse-card/daily routes/components; translations/search REST endpoints.
- Published music/sermon/church routes; media submission API/form; header/user menu/bottom navigation and locale cookie configuration.
- icon.svg route, robots.ts, sitemap.ts, OpenAPI route, root not-found and PostCSS cleanup.
- Root/package manifests and lockfile, .env.example, .gitignore, scripts/build-web.mjs, tests/integration/foundation.mjs, .github/workflows/ci.yml, infrastructure files, README and docs.

## Known limitations / required configuration

- Mongolian Scripture needs verified product rights and a complete licensed dataset or approved API.Bible configuration. NT-only MonKJV requires separate permission. UI language availability does not imply canonical-text availability.
- Set SMTP settings and test real verification/reset delivery before production. Preserve BETTER_AUTH_SECRET and PERSONAL_DATA_KEY.
- Configure GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and the actual callback origin before testing social sign-in. Apple, MFA, multiple/scoped roles and privileged administration are not implemented.
- Account export/deletion UI, normalized completion progress, parallel Bible reading, licensed offline/audio experiences and mobile synchronization remain unfinished.
- Current search uses simple lexical tokens, not language-specific stemming. Structural import validation does not replace translation/license/editorial review.
- Private file storage, antivirus/quarantine, signed media access and verified creator management are not implemented; official-link submissions are the supported boundary.
- No tenant church management, pastor publishing/review dashboard, verification appeals, broader community/moderation, background reminders or native Expo app has shipped.
- Keep development tooling audit findings tracked; add monitoring/backups/restore drills/load/accessibility/security/legal/native-speaker review before launch. App identifiers/support domain still need real release configuration.

## Exact next development tasks

### Phase 3 multilingual implementation — in progress, 2026-10-13

- User approved the inspected implementation plan. No redesign or production deployment.
- Removed automatic English substitution for missing locale/explicit edition. Reader now honors URL, separate device cookie, then account edition preference without forcing a match to interface language. Selector persists device choice; interface changes preserve an explicit Bible selection. Missing editions render an actual unavailable state with edition choices.
- Applied data-preserving migration `20261013100000_multilingual_editions`: edition metadata JSON, normalized search index, optional note edition, translation-aware uniqueness for bookmarks/highlights/history. Existing records/text preserved. Regenerated Prisma after briefly restarting the verified workspace Next server.
- Imported verified OSHB/WLC Hebrew (39 USFM books, Tanakh order; source revision 3d15126fb1ef74867fc1434be1942e837932691f, CC BY 4.0) and eBible Tischendorf Greek NT (27 books, Public Domain). Preserved Hebrew niqqud/source numbering and Greek verse gaps. XML morphology separators and notes excluded from Hebrew ketiv reading text; no Scripture generated or scraped. Edition metadata handles Joel 4/Malachi 3.
- Still required: complete native reference validation and annotation isolation, parallel comparison, Hebrew/Greek navigation/search verification, expanded locale/core labels/book names, YouVersion parser/backoff tests, all four requested reference checks, full TypeScript/lint/unit/integration/build checks and final provider/licensing report. Mongolian remains unconfigured; no API.Bible key or publisher dataset/license is available.
- Next exact step: finish language/book metadata and parallel/native reference controls, validate imported source counts/content against original datasets, then run the final regression suite. Do not mark Phase 3 complete based on imported metadata alone.

### YouVersion API route for AB2004 — 2026-10-13

- Verified current official YouVersion Platform developer documentation: app registration/App Key, `X-YVP-App-Key` header, accepted Bible license agreements, Bible collection and passage endpoints. Previous guidance focused on direct publisher licensing and omitted this supported API route; API agreements may supply the necessary permissions for eligible editions.
- Added `scripts/check-youversion-access.mjs`: paginates permitted Mongolian metadata, confirms edition 369, and tests metadata/John 1 passage permission without logging credentials or Scripture. Added server-only `YVP_APP_KEY` placeholder to `.env.example` and exact portal/check instructions to `docs/AB2004_ACCESS.md`.
- Script syntax verified; missing-key behavior verified. No App Key is configured/available for live access in this run. AB2004 availability for HINENI's app is unverified until an actual key and appropriate accepted license are supplied.
- No web provider has been falsely enabled. Next: register HINENI at YouVersion Platform, configure the key locally, run the check; if 369 is permitted, implement the provider from the verified actual payload and attribution rules, then test reader/daily integration. No production env, publisher messages, database or deployment changes.

### Requested Mongolian edition: АБ2004 — 2026-10-13

- User selected Ариун Библи 2004. Verified publisher/edition on Bible.com and publisher contact page. No public reuse grant or approved in-app API access was supplied/confirmed; no Scripture was scraped/imported and rights gates remain unchanged.
- Added explicitly external AB2004 reading access to Mongolian fallback notices on home, Bible index/chapter and daily pages. Preferred internal edition ID is `mn-ab2004`, selected automatically only after an actual registered licensed provider/import makes it available.
- Added `docs/AB2004_ACCESS.md` with verified source/contact links, exact configuration/import steps and an unsent Mongolian publisher permission request. Bible.com version `369` must not be used as a fabricated API.Bible ID.
- Validation: TypeScript, ESLint, 59 unit tests and production build passed. Four affected Mongolian pages returned 200 with external edition links. Added regression test for licensed-registration-only AB2004 preference.
- In-app Mongolian Scripture remains pending publisher permission plus licensed text/API access. User supplied edition name only, not a license, file or approved credentials. Next step is obtain those resources, then configure/import and verify Bible chapters/daily passages against that specific edition; do not label external reading links as in-app integration.

### Language routing repair — 2026-10-13

- Root cause: the locale proxy matcher's JavaScript string contained an escaped dot that became a wildcard in the compiled regex. The exclusion effectively skipped normal page paths, so next-intl locale middleware did not run. Replaced it with unambiguous `[.]` matching for static files.
- Locale switcher now uses the actual browser URL at click time and strips recognized leading locale segments before passing the page to next-intl. Query filters/verse anchors remain; explicit Bible translation is cleared to choose the new language's edition.
- Added one-step canonical recovery redirects for repeated/mixed leading language prefixes: `/ru/ru` → `/ru`, preserving queries and the first locale. Added shared path normalization helpers and regression tests for every supported language, reserved prefix handling, query/hash preservation and the actual static proxy matcher.
- Verification: TypeScript, ESLint, 58 unit tests and production build passed. Live HTTP checks confirmed 307 recovery redirects for repeated/mixed routes, HTTP 200 for Russian/Mongolian/Hebrew homes, and actual translated hero text/locale attributes. Browser interaction testing remains unavailable; server routes and URL construction are verified. No database, environment or deployment changes.

### HINENI visual identity — 2026-10-13

- Preserved the workspace’s already-updated HINENI naming/Hebrew configuration and existing features. The named PNG reference was absent; used the user’s attached approved reference.
- Created original SVG geometry for golden arch, radiant star, layered mountains and winding path. Added exact RTL Unicode `הִנֵּנִי` with embedded open-license Noto Serif Hebrew rather than tracing reference lettering. Generated eleven SVG variants, seven PNGs and a three-size ICO using existing Sharp; no new dependencies.
- Centralized runtime asset paths and approved navy/gold/ivory/white in shared branding, consumed by shared palette tokens. Added reusable light/dark logo component; integrated header, footer, mobile drawer, homepage hero, auth card and route loading screen. Narrow phone header uses symbol to reduce crowding.
- Wired metadata favicon/Apple icon, Open Graph/Twitter image and real Next manifest. Legacy `/icon.svg` redirects to the new simplified symbol. Native mobile directory is empty, so prepared native artwork but did not invent an app configuration or splash integration. Manifest does not provide offline functionality.
- Verification: TypeScript and ESLint passed, all 54 current unit tests passed, production build passed. Nineteen asset HTTP checks and six page metadata checks passed; verified PNG dimensions, ICO structure and text-free favicon. Inspected rendered light/dark asset previews, app icon and enlarged 16px favicon.
- Actual browser desktop/mobile layout, CSS theme switching, embedded-font behavior across browsers and install/share previews remain unverified because no interactive browser sessions were available. No database/backend/environment/deployment changes. Full export/file list and remaining review are in `docs/HINENI_BRANDING.md`.

### Calmer narration delivery — 2026-10-13

- Added default Calm & reflective delivery (0.9× speed, 0.95 pitch) and Standard preset. Prefer installed voices whose names explicitly indicate natural/neural/enhanced/premium; preserve manual voice selection and language matching. This is a delivery adjustment, not a guarantee of professional voice quality.
- Added explicit per-session opt-in to online voices exposed by the browser, with disclosure that Scripture text may be sent to the selected voice provider. Local voices remain the default. Availability depends on the actual browser voice inventory; no external TTS API or paid service was provisioned.
- Checked human KJV sources: AudioTreasure’s Stephen Johnston recording is personal-use-only; Rev. Dan Wagner recording states the site uses it by permission. Neither was embedded under an assumed transferable grant. Professional narrated KJV remains dependent on a suitable licensed recording or configured voice service.
- TypeScript, ESLint, 53 unit tests and production build passed. Tests cover enhanced-voice preference, conservative delivery settings, language matching and default exclusion/explicit opt-in for online voices. Actual voice quality and browser audio behavior remain unverified by listening.

### Bible read aloud — 2026-10-13

- Added `components/bible/read-aloud.tsx` and `lib/read-aloud.ts` to the chapter reader. Supports user-initiated chapter narration, pause/resume, stop, local voice selection, speed and current verse status. Uses exact displayed Scripture text, split into short utterances without omitted words; no generated Scripture or recorded-audio imports.
- Matches voices to translation language, including English Scripture fallback under a Mongolian interface. Only locally installed voices are offered. Unavailable browser/voice/license states are explicit. Enabled only for translation metadata marked public domain; licensed translations need a separate verified narration grant before enabling.
- Navigating away/changing chapter or translation cancels speech; stale callbacks are rejected by generation token. Voice/speed changes are disabled during reading. Synthetic speech is not licensed recorded Audio Bible functionality and must not set translation `audioAvailable`.
- English/Mongolian controls are localized; other interface languages currently use English labels. No credentials, paid service, database change, or remote speech upload.
- Validation: TypeScript, ESLint, 52 unit tests and production build passed. Tests cover local language matching, preservation of every word/punctuation, utterance bounds, empty verses and unspaced scripts. English/Mongolian chapter page smoke checks passed. Audible playback, pause/resume behavior on actual engines and mobile/browser compatibility remain unverified because interactive browser access was unavailable.

### 100+ instrumental music catalog — 2026-10-13

- Imported 266 actual MP3 records from AudioTreasure/PublicDomainAudioBibles, retaining provider public-domain dedication/source links, original filenames, stable IDs, byte sizes and verification dates. Total catalog: 268 recordings including the two earlier local tracks; variants are included, not all unique compositions.
- Added title search, recording count and previous/next selection to the persistent player. Track changes pause until Play is pressed. Credits now follow the selected provider. The external-streaming internet requirement is visible; local files remain supported.
- Added reproducible `scripts/import-hymn-catalog.mjs` with three-worker byte-range/header verification and failure exclusion. All 266 URLs passed on import. Full listening/codec/mobile playback tests were not performed.
- Tests: TypeScript, ESLint, 49 unit tests (including catalog uniqueness/source permissions checks) and production build passed. Existing-server English/Mongolian page smoke checks passed. No database changes, subscriptions, credentials or bulk audio downloads.
- Source permission/provenance and runtime limitations recorded in `docs/MUSIC_LICENSES.md`. External availability and browser playback require continuing checks; worldwide legal clearance is not claimed.

### Bundled instrumental hymns — 2026-10-13

- Added unmodified Creative Commons recordings of Amazing Grace 2011 and Silent Night by Kevin MacLeod, with a selector, visible artist/license/source credits, and provenance in `docs/MUSIC_LICENSES.md`. Audio is hosted locally; no paid provider, credentials, or database changes.
- Default hymn is available immediately after the user presses Play. Track changes pause playback; local audio selection, volume and repeat remain supported. English/Mongolian labels added, other interfaces use English music labels.
- Binary MP3 headers checked; Amazing Grace SHA-1 matches the source record. Local HTTP byte-range requests returned 206 audio/mpeg for both recordings. Browser listening/playback testing remains outstanding.

### Optional background music — 2026-10-13

- Added `components/layout/background-music.tsx` to the persistent locale layout: local audio selection, play/pause, volume, repeat, playback error handling, and a collapsible panel. No automatic playback, uploads, external services, bundled tracks, or database changes.
- Audio files use browser object URLs, revoked when replaced/unmounted. Playback continues during navigation within the same locale layout. Reloading or remounting the locale layout requires reselecting the file.
- English and Mongolian player strings are centralized in shared dictionaries; other languages currently use English player labels.
- TypeScript, ESLint, all 47 existing unit tests, and the production build passed. Interactive playback/mobile visual checks remain unverified because the browser was unavailable. No test claims establish device codec support or uninterrupted playback across locale changes.
- A platform-provided music catalog still requires authorized audio and license records; the implemented player uses the user's local file only.

### Bible frontend update — 2026-10-13

- Replaced the expanding book-card grid with a compact searchable Old/New Testament list and native book/chapter dialog. Mobile uses a bottom sheet; desktop uses a centered picker.
- Added a start/continue-reading card backed by existing reading history. History links respect the current interface translation selection rather than forcing the previously read language.
- Added a sticky chapter toolbar, compact translation selector, search access and mobile previous/next chapter controls above the bottom navigation. Translation changes preserve query parameters and verse anchors.
- Tightened mobile header/language-selector spacing, adjusted verse-anchor scrolling for the toolbar, and hid the global footer on Bible routes. Preserved Scripture providers, bookmarks, highlights, notes and existing reader controls.
- Added picker translations to all eleven existing interface dictionaries. No database changes or new content imports.
- Validation: TypeScript and ESLint passed; all 47 unit tests passed; production build passed. Existing server returned HTTP 200 with picker markup and resolved labels for English/Mongolian Bible index and Genesis 1.
- Interactive browser was unavailable, so responsive visual inspection and dialog/keyboard interaction testing remain outstanding. These HTTP/source checks do not establish browser interaction or accessibility conformance.

1. Complete Phase 2 dedicated reading-completion progress and permission-checked offline manifest/download endpoints, with conflict/version contracts and isolation tests; preserve existing reading history/bookmarks.
2. Implement account data export and explicit reauthenticated deletion controls; test only against isolated fixtures.
3. Complete the private prayer CRUD UI and reading-plan enrollment/progress vertical slice using existing real APIs/models, then editorial devotional review and consent-based reminder jobs.
4. Add scoped church/creator memberships and MFA-gated privileged administration before church verification/pastor publishing workflows. Validate additive migrations before application.
5. Implement private media quarantine/scanning and rights records before enabling raw uploads, then moderated groups/reports.
6. Create the Expo app using the versioned REST contract, secure native authentication, license-permitted offline datasets and versioned sync; restore a mobile dev command only after a real workspace exists.
7. Execute browser/accessibility checks, CI, backup/restore/load/security and external-service verification; then prepare production/mobile releases. Do not mark these complete based only on configuration files.
