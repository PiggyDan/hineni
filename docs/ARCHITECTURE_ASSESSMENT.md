# RUAH architecture assessment

Audit date: 2026-10-13. Existing workspace: `christian-platform`.

## Existing structure and migration decision

- `apps/web`: Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, next-intl, next-themes. Public localized routes cover home, Bible, daily, study, music, sermons, churches, account, library, prayer and upload. REST routes are under `/api/v1`; Better Auth is under `/api/auth`.
- `packages/db`: PostgreSQL, Prisma 6, two committed-on-disk migration directories, generated client, structural reading-plan seed, cross-reference import utility.
- `packages/shared`: validators, Bible canon/reference parser/reading-plan logic, eleven interface dictionaries, branding and navy/gold/ivory design tokens.
- npm workspaces and an existing npm lockfile. Keep package identities and directory names to preserve imports; do not switch package managers or introduce Turborepo/NestJS merely for naming consistency.
- No mobile app, separate API app, deployment configuration, CI, OpenAPI document, browser test configuration or Docker infrastructure was present at audit time. The root mobile script points to a missing workspace.
- Git reports the entire app as untracked. Preserve all files; do not reset, clean, stage or commit user work. No AGENTS.md was found in the project listing.

## Existing working code and verification limits

Real implementations exist for database-backed email/password auth and sessions, verification/reset email callbacks, schema validation, per-user bookmarks/highlights/history, encrypted notes/prayers, provider-based Scripture retrieval, localized Bible navigation and structural reading plans. Initial HTTP health checks in this session confirmed the database is reachable. Earlier tests cover shared validators/reference navigation and provider selection; they do not establish complete end-to-end production readiness.

Existing UI/style components can be retained: page headers, buttons, cards, responsive header/drawer, typography, theme controls, reader and language switcher. The theme provider now lives above the locale layout to avoid remount script errors.

## Missing features and risks

- Auth UI does not yet expose complete verification/password-reset/account lifecycle flows; several auth labels are hardcoded English. Social auth needs provider credentials. Admin MFA and multiple scoped roles are not implemented; no admin dashboard exists.
- Bible storage is a chapter JSON cache, not normalized licensed Bible/verse tables. Full-text Scripture search, import, parallel reading, licensed offline downloads and audio are missing.
- MonKJV's source metadata grants distribution to CrossWire; it does not demonstrate permission for this product. Treat it as disabled until project-specific rights are confirmed. API.Bible keys alone are not proof of distribution/download rights.
- Worship, sermons and churches display invented fallback records when data is empty. Replace fallback rendering with real published database results and honest empty/error states, without deleting any database data.
- Uploads accept extensions/MIME as validation, write into `public/uploads` before validating metadata, lack rights attestations, and bypass the shared origin/limiter wrapper. Suspend raw file uploads until private quarantine/scanning/storage are implemented; retain official-link submissions with rights declarations and audit records.
- The shared API limiter fails open on database errors. Private responses lack explicit no-store directives. Origin checks need to account for cross-site fetch metadata. Existing single-role enum cannot represent later church-scoped/multiple roles.
- Secrets/encryption keys must never be regenerated over existing data. Production SMTP, HTTPS, OAuth, verified Scripture rights, backup/restore drills, monitoring, legal/editorial and accessibility review remain external prerequisites.
- Additional-language dictionaries are initial machine-translated drafts. English/Mongolian are launch languages; retain other locales and do not silently machine-translate Scripture or user content.

## Implementation phases

1. Foundation: centralized RUAH branding/icon/taglines; bilingual auth and password recovery; real PostgreSQL integration and protected APIs; rights-aware Scripture registry; remove fake catalog fallbacks; secure official-link submission boundary; privacy/security tests; CI/local infrastructure/build documentation.
2. Bible: additive normalized translation/license/book/chapter/verse models; verified dataset import; indexed search; reader integration; progress and license-permitted offline manifests. Validate migrations before applying; never reset data.
3. Daily/prayer: complete plan enrollment/progress UI and APIs, private journal editing, devotional editorial workflow, consent-based reminders and jobs.
4. Churches/pastors: scoped membership/roles, verification evidence/review/audit, pastor publishing, church dashboard/events/announcements. Privileged operations require MFA before an admin interface is enabled.
5. Worship/community: verified creator ownership, private upload quarantine, malware scanning, rights records, moderation/reporting and controlled groups.
6. Mobile: Expo Router app using existing REST contracts, secure tokens, permitted offline datasets, versioned conflict-safe synchronization and push consent.
7. Production: security/accessibility/load reviews, backups/restore, monitoring, CI/CD/deployment and store/legal readiness.

## Files expected to change first

`packages/shared/src/branding.ts`, shared auth/validation messages, `apps/web/src/components/auth/*`, auth pages/routes, `apps/web/src/lib/{auth,api,rate-limit,env}.ts`, Scripture providers/types/tests, public catalog routes, media submission route/form, root metadata/icon/robots, `.env.example`, root/workspace scripts, tests, CI/infrastructure files, README and implementation status. Existing database schemas/data remain intact during the foundation slice.
