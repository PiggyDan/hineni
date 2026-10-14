"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function VerificationNotice({ email }: { email: string }) {
  const t = useTranslations(); const locale = useLocale();
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState("");
  return <div className="card mb-6 p-5">
    <p>{t("account.unverified")}</p>
    <button disabled={busy} className="mt-3 text-accent-ink underline disabled:opacity-60" onClick={async () => {
      setBusy(true); setStatus("");
      try {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: `${window.location.origin}/${locale}/account` });
        setStatus(t(result.error ? "common.error" : "foundation.verificationResent"));
      } catch { setStatus(t("common.error")); }
      finally { setBusy(false); }
    }}>{t(busy ? "common.loading" : "account.resendVerification")}</button>
    {status && <p role="status" className="mt-3 text-sm">{status}</p>}
  </div>;
}
