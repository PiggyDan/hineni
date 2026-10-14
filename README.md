# RUAH

The Word. The Spirit. The Community.

Бурханы Үг. Ариун Сүнс. Итгэлийн Нэгдэл.

An evolving Next.js Christian application with PostgreSQL, bilingual authentication, a rights-aware Bible reader and indexed Scripture search. This is an incremental migration of the existing Selah codebase; mobile, privileged administration and production readiness remain development work.

## Stack

- Web: Next.js 16, React 19, TypeScript, Tailwind CSS
- Shared packages: Prisma schema, shared validators, Bible metadata, branding/tokens
- Database: PostgreSQL + Prisma
- Auth: Better Auth + secure sessions
- Localization: English, Mongolian, Russian, Spanish, French, Arabic, Portuguese, Turkish, Indonesian, Hindi, and Chinese via next-intl. Each locale has a complete static interface dictionary; changing the language updates homepage text, navigation, forms, and reader controls.
- Testing: Vitest

## Workspace layout

- `apps/web` — Next.js app and UI
- `packages/db` — Prisma schema and migrations
- `packages/shared` — shared business logic, Bible data, validators, translations

## Required environment

Copy `.env.example` to `.env` and fill values before running the app.

Required variables:

```bash
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/christian_platform?schema=public
BETTER_AUTH_SECRET=replace-with-32-plus-random-bytes
BETTER_AUTH_URL=http://localhost:3000
PERSONAL_DATA_KEY=replace-with-base64-32-bytes
```

Optional but supported:

```bash
TRUSTED_ORIGINS=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM="RUAH <no-reply@example.org>"
API_BIBLE_KEY=
API_BIBLE_TRANSLATIONS=
API_BIBLE_RIGHTS_CONFIRMED=false
MONGOLIAN_BIBLE_RIGHTS_CONFIRMED=false
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=© OpenStreetMap contributors
GEOCODER_URL=https://nominatim.openstreetmap.org
GEOCODER_EMAIL=
UPLOAD_DIR=./uploads
NEXT_PUBLIC_BRAND_NAME=
NEXT_PUBLIC_BRAND_NAME_MN=
SEED_ADMIN_EMAIL=
```

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Then open:

- http://localhost:3000

## Validation

```bash
npm run typecheck
npm test -- --run
npm run lint
npm run db:validate
npm run test:integration
npm run build
```

## Current status

- Architecture audit: [docs/ARCHITECTURE_ASSESSMENT.md](docs/ARCHITECTURE_ASSESSMENT.md)
- Current progress and remaining tasks: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)
- Development/security prerequisites: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Verified Bible imports/search: [docs/BIBLE_IMPORT.md](docs/BIBLE_IMPORT.md)
- RUAH branding, original responsive design, bilingual auth forms, password-reset and verification controls implemented
- Fabricated catalog fallbacks removed; only published database content is displayed
- Official-link submissions require rights attestation and remain unpublished with audit records; raw uploads await private storage/scanning
- Default English Bible translation is configured to KJV
- Interface language dictionaries live in `packages/shared/src/i18n`. Tests check key and placeholder parity and ensure homepage text does not silently fall back to English. The nine additional dictionaries were initially machine translated, with homepage terminology reviewed and corrected; further native-speaker editorial review is recommended. Published editorial content, reading-plan descriptions, uploaded titles, and Scripture text keep their source translations rather than being machine translated at runtime.
- The language menu localizes Bible navigation and book names, clears the explicit Bible edition, and preserves the chapter and verse anchor. Saved editions apply automatically only when their language matches the selected locale.
- English KJV is imported into normalized PostgreSQL tables (66 books/1,189 chapters) and supports word/phrase/reference search. Remote sources remain available where permissions allow. Mongolian/API.Bible editions require confirmed product rights; MonKJV is NT-only and disabled by default. A complete verified Mongolian import is the preferred path.
- If `npm run dev` reports that port 3000 is occupied, use the existing server at http://localhost:3000. To restart it, stop the reported PID before running the command again. In PowerShell environments that block `npm.ps1`, use `npm.cmd run dev`.
- TypeScript and tests are passing in the current workspace
