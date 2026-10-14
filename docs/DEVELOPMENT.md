# RUAH development and configuration

Keep the existing root `.env`; never replace its database/auth/encryption values during migration. In particular, losing `PERSONAL_DATA_KEY` makes existing private content unreadable. No secrets belong in Git or screenshots/log outputs.

## Existing database

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:validate
npm.cmd run db:deploy
npm.cmd run dev
```

`db:deploy` applies versioned migrations. The RUAH Bible migration only creates new tables/indexes. Do not use `prisma migrate reset`. Structural reading-plan seed is optional; `SEED_ADMIN_EMAIL` promotes a real account and must not be used as an unattended production bootstrap.

On Windows, stop the dev server before regenerating Prisma if its native DLL is locked. If port 3000 is occupied, reuse the existing server or restart that specific process. Do not launch multiple dev servers against the same `.next/dev` directory. `npm.cmd` avoids PowerShell execution-policy issues.

## Optional isolated local PostgreSQL

Copy `infrastructure/.env.example` to ignored `infrastructure/.env`, set a random password, then run `docker compose --env-file infrastructure/.env -f infrastructure/compose.yml up -d`. This uses port 5433 by default, preserving an existing server on 5432. Point `DATABASE_URL` at the new database only if you deliberately want a separate local environment. Docker startup has not been executed in this workspace.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run db:validate
npm.cmd run test:integration
npm.cmd run build
npm.cmd audit --omit=dev
```

Integration tests require a local development server, working PostgreSQL and the imported KJV dataset. They create uniquely identified temporary users/content, assert isolation and clean up only those fixtures. The production build explicitly uses `NODE_ENV=production` even when local `.env` is set to development. CI configuration exists but has not been executed remotely.

The Prisma CLI and patched merge dependency are root development tooling. Prisma remains at 6.19.3; the runtime client version and existing schemas are preserved. The full dev-tool audit still reports unpatched `braces` (ESLint glob tooling) and `postcss-selector-parser` (typography build tooling) findings; do not use `npm audit fix --force`, which proposes incompatible downgrades. Track upstream fixes. Runtime dependency audit currently reports zero findings; this is not a comprehensive security certification.

## Production prerequisites

- HTTPS and correct `APP_URL`/trusted origins; reverse-proxy request-size limits. Do not expose arbitrary forwarded-IP headers outside a trusted proxy boundary.
- SMTP configuration and real delivery testing for verification/reset. Development can inspect emails in the local server console; production refuses missing SMTP rather than claiming delivery.
- Written Mongolian/API.Bible display rights and provider terms, recorded before setting `MONGOLIAN_BIBLE_RIGHTS_CONFIRMED` / `API_BIBLE_RIGHTS_CONFIRMED`. Prefer a verified complete dataset imported through the documented pipeline.
- Google has a conditional server integration and button; configure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and register `/api/auth/callback/google` on your real origin. It has not been tested against Google without credentials. Apple remains a native-release integration task.
- MFA, multi-role/scoped authorization and security review before privileged administration.
- Private object storage, quarantine/scanning and signed media access before raw file uploads. Official-link submissions require rights attestation, stay unpublished and are audited.
- Monitoring, encrypted backup/restore drills, accessibility/load/browser checks, privacy/legal review and native-speaker review of translations before launch.

API contract: `/api/v1/openapi`. Native bearer-token authentication, Expo builds and offline synchronization are not implemented; mobile will share these versioned REST boundaries after that auth/sync slice is implemented.
