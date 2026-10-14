"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { loginSchema, registerSchema } from "@cp/shared";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { BrandLogo } from "@/components/branding/brand-logo";

export function AuthCard({ mode, title, subtitle, secondaryHref, secondaryLabel, googleEnabled = false }: {
  mode: "sign-in" | "sign-up"; title: string; subtitle: string; secondaryHref: string; secondaryLabel: string; googleEnabled?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = (mode === "sign-up" ? registerSchema : loginSchema).safeParse({ name, email, password });
    if (!parsed.success) return setError(t("foundation.invalidRegistration"));
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}/email`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, locale, callbackURL: `${window.location.origin}/${locale}/account` }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(response.status === 429 ? t("auth.rateLimited") : data.code === "EMAIL_NOT_VERIFIED" ? t("foundation.verifyRequired") : mode === "sign-in" ? t("auth.invalidCredentials") : t("foundation.invalidRegistration"));
        return;
      }
      if (mode === "sign-up" && !data.token) { setMessage(t("foundation.verificationSent")); return; }
      router.push("/account"); router.refresh();
    } catch { setError(t("common.error")); }
    finally { setLoading(false); }
  }
  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 text-center"><Link href="/"><BrandLogo className="w-48" /></Link></div>
      <h1 className="text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{subtitle}</p>
      <form onSubmit={submit} className="mt-6 space-y-4" aria-busy={loading}>
        {mode === "sign-up" && <label className="label">{t("auth.name")}<input className="input mt-1" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} required /></label>}
        <label className="label">{t("auth.email")}<input className="input mt-1" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required /></label>
        <label className="label">{t("auth.password")}<input className="input mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={mode === "sign-up" ? 10 : 1} maxLength={128} required aria-describedby={mode === "sign-up" ? "password-hint" : undefined} /></label>
        {mode === "sign-up" && <p id="password-hint" className="text-xs text-ink-muted">{t("auth.passwordHint")}</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {message && <p role="status" className="text-sm text-ink-muted">{message}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60">{loading ? t("common.loading") : title}</button>
      </form>
      {googleEnabled && <button disabled={loading} className="mt-4 w-full rounded-full border border-line px-4 py-3 text-sm disabled:opacity-60" onClick={async () => {
        setLoading(true); setError("");
        try {
          const result = await authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}/${locale}/account` });
          if (result.error) setError(t("common.error"));
        } catch { setError(t("common.error")); }
        finally { setLoading(false); }
      }}>{t("nav.signIn")} · Google</button>}
      {mode === "sign-in" && <Link href="/forgot-password" className="mt-4 block text-sm text-accent-ink hover:underline">{t("auth.forgot")}</Link>}
      <p className="mt-5 text-sm text-ink-muted">{secondaryLabel} <Link href={secondaryHref} className="text-accent-ink hover:underline">{mode === "sign-in" ? t("nav.signUp") : t("nav.signIn")}</Link></p>
    </div>
  );
}
