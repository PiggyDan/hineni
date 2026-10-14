# Deploying HINENI (free tier)

Vercel Hobby (web) + Neon Free (PostgreSQL) + Brevo Free (email). Vercel Hobby is for non-commercial use.
Commands below are for PowerShell in the repository root.

## 1. Database — Neon

1. Create a project at https://neon.tech (choose the region closest to your readers and to the Vercel region).
2. Copy two connection strings from **Connect**:
   - **Direct** (host without `-pooler`) — used from your computer for migrations and the data copy.
   - **Pooled** (host with `-pooler`) — used by Vercel. Append `&pgbouncer=true&connect_timeout=15` to it.
3. Create the tables (additive migrations only; never use `migrate dev` against production):

   ```powershell
   $env:DATABASE_URL = "<DIRECT neon url>"
   npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
   npx tsx packages/db/prisma/seed.ts          # reading plans
   Remove-Item Env:DATABASE_URL
   ```

4. Copy the imported Scripture (KJV, Hebrew WLC, Greek Tischendorf), license records and cross-references from your local database. It is insert-only and safe to re-run; run once without `--confirm` to see what it will do.

   ```powershell
   $env:TARGET_DATABASE_URL = "<DIRECT neon url>"
   npm run copy:bible -w @cp/db -- --confirm   # source = DATABASE_URL in your local .env
   Remove-Item Env:TARGET_DATABASE_URL
   ```

   Expected: 3 translations, 62,254 verses, 328,023 cross-references (~15 s locally).

## 2. Email — Brevo

Production requires email verification before sign-in, and the app refuses to send without SMTP.

1. Create a free account at https://www.brevo.com, add and verify a sender address.
2. **SMTP & API → SMTP**: note the login and create an SMTP key.

## 3. Web — Vercel

1. https://vercel.com → **Add New Project** → import `PiggyDan/hineni`.
2. **Root Directory**: `apps/web`. Leave "Include files outside the root directory" enabled. Install/build commands come from `apps/web/vercel.json`.
3. **Environment Variables** (Production):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Pooled Neon URL with `&pgbouncer=true&connect_timeout=15` |
   | `APP_URL` | `https://<your-project>.vercel.app` (no trailing slash) |
   | `BETTER_AUTH_URL` | same as `APP_URL` |
   | `BETTER_AUTH_SECRET` | new value: `openssl rand -base64 32` |
   | `PERSONAL_DATA_KEY` | new value: `openssl rand -base64 32` — **back this up**; losing it makes every prayer, note and journal entry unreadable |
   | `SMTP_HOST` / `SMTP_PORT` | `smtp-relay.brevo.com` / `587` |
   | `SMTP_USER` / `SMTP_PASSWORD` | Brevo SMTP login / SMTP key |
   | `EMAIL_FROM` | `"HINENI <your-verified-sender@…>"` |
   | `YVP_APP_KEY` | optional (Mongolian AB2004 access is still pending) |

   Do not copy your local `BETTER_AUTH_SECRET`/`PERSONAL_DATA_KEY` unless you intend to move local accounts.
4. **Deploy**. When it finishes, if Vercel assigned a different domain than you guessed, update `APP_URL` and `BETTER_AUTH_URL` and redeploy.

## 4. After the first deploy

1. Open the site, register, and verify your email.
2. Make yourself an administrator:

   ```powershell
   $env:DATABASE_URL = "<DIRECT neon url>"; $env:SEED_ADMIN_EMAIL = "you@example.com"
   npx tsx packages/db/prisma/seed.ts
   Remove-Item Env:DATABASE_URL, Env:SEED_ADMIN_EMAIL
   ```

3. Check `/en/bible/jhn/3`, `/en/bible/gen/1?t=oshb-wlc`, `/mn` (honest Mongolian unavailable state), `/en/admin`.

## Notes and limits

- Write requests are origin-checked against `APP_URL`, so sign-in and saving work on the production domain; Vercel *preview* URLs will reject writes unless added to `TRUSTED_ORIGINS`.
- Neon Free suspends an idle database; the first request after a quiet period is slower.
- File uploads stay disabled (they need private storage and scanning). Official-link submissions work.
- KJV is public domain except in the UK (Crown copyright). OSHB requires attribution, which the reader displays.
- Google sign-in appears only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set and the callback `https://<domain>/api/auth/callback/google` is registered.
