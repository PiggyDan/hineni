# HINENI redesign — assessment and plan

Started 2026-10-14. This is a redesign of the existing application, not a new project.

## Technical assessment (Phase 1)

| Area | Finding | Decision |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, next-intl, next-themes; npm workspaces (`apps/web`, `packages/db`, `packages/shared`) | Keep. The brief prefers "the existing framework"; migrating to Vite/React Router would discard working SSR, auth and API routes. |
| Data | PostgreSQL + Prisma 6, four applied migrations. 1 user, 6 seeded reading plans (7/7/21/30/90/365 days), 0 editorial items, 3 imported editions | Keep. Additive migrations only, applied with `migrate deploy` (never `migrate dev`/reset). |
| Auth | Better Auth email/password, verification, reset; Google enabled only when configured; roles USER/EDITOR/MODERATOR/ADMIN | Keep. Add profile editing and password change through the existing client. |
| Bible | Provider registry (PostgreSQL import, bible-api.com, getBible, API.Bible, YouVersion), rights gates, honest unavailable state, Hebrew (OSHB WLC, CC BY 4.0) and Greek (Tischendorf, PD) imported, KJV imported, full-text search, parallel reading, read-aloud | Keep the whole layer. Redesign the reader UI around it. |
| Mongolian | Integration layer complete; AB2004 (`mn-ab2004`) preferred once licensed. Live recheck on 2026-10-14: AB2004 (369) **not available** to the configured YouVersion App Key | Keep the honest unavailable state. No fallback to English presented as Mongolian. |
| Private data | Prayers and notes AES-256-GCM encrypted per user | Keep format; new journal entries use the same encryption. |
| i18n | 16 locale dictionaries, key-parity tested; `foundation` namespace is en/mn-only and injected for every locale | New UI strings go in an `app` namespace the same way (English + Mongolian launch languages). |
| Gaps | No sidebar/app shell; prayer page read-only (API exists); no plan enrollment/progress API or UI; no settings page; no journal; no admin UI; no service worker; homepage is a marketing page rather than a dashboard | Build these. |
| Security | `.env.example` contains a real-looking `YVP_APP_KEY` value | Replace with an empty placeholder (the real key stays in the ignored `.env`). Rotate the key in the YouVersion portal if this file was ever shared. |

## Plan

1. Design tokens: Midnight `#101827`, Ivory `#FAF8F3`, Gold `#C5A46D` (decorative), Sage `#829688` (decorative), White. Text-safe darker gold and sage variants for WCAG AA. Inter (UI), Noto Serif (Scripture/display, Latin/Cyrillic/Greek), Noto Sans for Mongolian UI, existing Noto Serif Hebrew.
2. App shell: desktop sidebar (Home, Bible, Reading Plans, Daily Verse, Prayer, Devotionals, Community, Bookmarks, My Journal, Profile, Settings, Admin for staff); mobile top bar + bottom nav (Home, Bible, Plans, Prayer, Profile) + drawer for the rest.
3. Home dashboard: localized time-of-day greeting, verse of the day (save/share/read chapter), continue reading, devotional, reading progress, prayer space, featured plans.
4. Bible reader: glass toolbar, reader settings (font family, size, line spacing, theme, verse numbers), distraction-free mode, reading progress bar, swipe and arrow-key chapter navigation, refined verse toolbar, last-location memory for signed-out readers.
5. Reading plans: enroll, mark days complete, resume, progress. Devotionals list.
6. Prayer CRUD (create, edit, answered with note, delete, filter, search). Journal (new encrypted `journal_entry` table + verse notes).
7. Bookmarks/highlights/history page, Settings page, Profile page.
8. Admin: overview, editions/providers, reading plans, devotionals/content, users and roles, moderation. Role-gated server-side.
9. PWA: service worker for an offline application shell. Scripture and private API responses are never cached by it.
10. Typecheck, lint, unit tests, integration checks, build after each major step.

Out of scope for this pass (documented, not faked): community groups/discussion, reminder delivery jobs, admin-editable daily-verse rotation, native apps.

## Delivered (2026-10-14)

| Area | What exists now | Key files |
| --- | --- | --- |
| Design system | Midnight/Ivory/Gold/Sage tokens with AA-checked text variants; Inter, Noto Serif (Latin/Cyrillic/Greek), Noto Sans for Mongolian UI, Noto Serif Hebrew; cards, glass, chips, segmented controls, sheets, progress bars | `packages/shared/src/tokens.ts`, `apps/web/src/app/globals.css`, `components/ui/*` |
| Shell | Desktop sidebar (11 destinations + Admin for staff), mobile top bar + drawer + 5 bottom tabs, slim footer, music trigger in the shell | `components/layout/{app-shell,sidebar,mobile-bar,shell-parts,nav-items}.tsx` |
| Home | Local-time greeting, verse of the day (save/share/read), continue reading (account history or device), devotional, chapter + plan progress, prayer space, featured plans | `app/[locale]/page.tsx`, `components/home/*` |
| Bible reader | Glass toolbar, book/chapter picker, edition switcher, one-tap compare (original language for KJV), settings sheet (typeface, size, spacing, paragraph/verse layout, theme, verse numbers), focus mode, progress bar, swipe + arrow-key navigation, refined verse actions, device last-location | `app/[locale]/bible/[book]/[chapter]/page.tsx`, `components/bible/{reader-frame,reader-settings,chapter-reader,parallel-reader}.tsx`, `lib/reader-prefs.ts` |
| Plans | Enroll, mark days, resume, leave, completion; `/plans`, `/plans/[slug]`; old `/daily/plans/*` redirects | `app/api/v1/me/plans/*`, `components/plans/plan-tracker.tsx` |
| Daily / Devotionals / Community | Daily verse page with today's plan readings; devotionals list + reading view; hub of existing church/sermon/music/study directories with live counts | `app/[locale]/{daily,devotionals,community}` |
| Prayer & Journal | Prayer CRUD (answered + note, filter, search); new encrypted `journal_entry` table with Scripture references; verse-note editing | `components/prayer/*`, `components/journal/*`, `app/api/v1/me/journal/*`, migration `20261014090000_journal_entries` |
| Bookmarks, Settings, Profile | Bookmarks with verse previews, highlights, history; interface language vs Bible edition kept separate; reader prefs; name + password change | `app/[locale]/{bookmarks,settings,account}` |
| Admin | Overview + audit, editions/providers (enable only with recorded display rights; secrets shown as configured/not), plans editor, content CMS with revisions, users & roles, moderation | `app/[locale]/admin/*`, `app/api/v1/admin/*` |
| PWA | Manifest with shortcuts and maskable icon, production-only service worker caching the shell and brand assets, bilingual offline page. Page HTML and `/api` are never cached | `public/sw.js`, `public/offline.html`, `components/pwa/service-worker.tsx` |

### Fixes found along the way

- `prayerUpdateSchema` used `.partial()` on a schema with defaults, so changing a prayer's status reset its category to Personal. Same pattern avoided in the new update schemas; covered by unit tests.
- `/change-password` was not covered by the password-policy hook (only `/reset-password` was).
- Requests such as `/favicon.ico` reached the `[locale]` home page and threw in `Intl`; the page now rejects unknown locales and a root favicon is served.

### Verification

- TypeScript, ESLint: clean. Unit tests: 75 (web 38, shared 37).
- `npm run test:integration:redesign`: plans, journal encryption/isolation, notes, prayers, password policy, admin role enforcement, publishing gates, page rendering, legacy redirects.
- Note: because `[locale]/loading.tsx` streams responses, `notFound()`/`redirect()` arrive as HTTP 200 with the not-found UI / `NEXT_REDIRECT` marker. This predates the redesign.
- Not verified: interactive browser, real devices, screen readers, PWA install flow. These need hands-on QA.

### Remaining external dependencies

- **Mongolian Scripture**: rechecked 2026-10-14 — AB2004 (369) is not available to the configured YouVersion App Key. Request edition access in the YouVersion portal, or obtain API.Bible/publisher rights (see `AB2004_ACCESS.md`). The UI shows an honest unavailable state meanwhile.
- **Rotate `YVP_APP_KEY`** if `.env.example` (which contained it until today) was ever shared.
- Admin accounts: promote an existing account with `SEED_ADMIN_EMAIL=... npm run db:seed`.
- Not built (not faked): community groups/discussion, reminder delivery, admin-managed daily-verse rotation, native apps, interlinear/Strong's data (no verified dataset imported).
- Redesign strings (`app` namespace) are English + Mongolian; other locales fall back to English for those strings. Mongolian copy should get a native-speaker review.
