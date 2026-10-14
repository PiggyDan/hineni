"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { passwordSchema } from "@cp/shared";
import { authClient } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";

export function PasswordRecovery({ token, invalid = false }: { token?: string; invalid?: boolean }) {
  const t = useTranslations(); const locale = useLocale();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (token && !passwordSchema.safeParse(password).success) return setError(t("auth.passwordHint"));
    setBusy(true);
    try {
      const result = token ? await authClient.resetPassword({ token, newPassword: password }) : await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/${locale}/reset-password` });
      if (result.error) setError(result.error.status === 429 ? t("auth.rateLimited") : token ? t("foundation.resetInvalid") : t("common.error"));
      else setDone(true);
    } catch { setError(t("common.error")); }
    finally { setBusy(false); }
  }
  return <div className="card mx-auto w-full max-w-md p-8">
    <h1 className="text-3xl font-semibold">{t("auth.resetTitle")}</h1>
    <p className="mt-3 text-sm text-ink-muted">{token ? t("auth.passwordHint") : t("auth.resetBody")}</p>
    {invalid ? <p role="alert" className="mt-5 text-danger">{t("foundation.resetInvalid")}</p> : done ? <p role="status" className="mt-5">{t(token ? "auth.resetDone" : "auth.resetSent")}</p> : <form className="mt-6 space-y-4" onSubmit={submit} aria-busy={busy}>
      {token ? <label className="label">{t("auth.newPassword")}<input className="input mt-1" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /></label> : <label className="label">{t("auth.email")}<input className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button className="w-full rounded-full bg-primary px-4 py-3 text-on-primary disabled:opacity-60" disabled={busy}>{t(busy ? "common.loading" : "common.submit")}</button>
    </form>}
    {invalid && <Link className="mt-5 block text-accent-ink" href="/forgot-password">{t("auth.forgot")}</Link>}
    <Link className="mt-5 block text-accent-ink" href="/sign-in">{t("nav.signIn")}</Link>
  </div>;
}
