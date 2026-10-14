"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function SubmissionForm({ children }: { children: React.ReactNode }) {
  const t = useTranslations(); const [busy, setBusy] = useState(false); const [status, setStatus] = useState<"ok" | "error" | null>(null);
  return <form className="card space-y-6 p-6 md:p-8" aria-busy={busy} onSubmit={async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setStatus(null);
    try {
      const response = await fetch("/api/v1/me/media", { method: "POST", body: data, credentials: "same-origin" });
      if (response.ok) { setStatus("ok"); form.reset(); } else setStatus("error");
    } catch { setStatus("error"); }
    finally { setBusy(false); }
  }}><fieldset disabled={busy} className="space-y-6">{children}</fieldset>
    {status && <p role={status === "ok" ? "status" : "alert"} className={status === "ok" ? "text-ink-muted" : "text-danger"}>{t(status === "ok" ? "foundation.submitted" : "foundation.submitFailed")}</p>}
  </form>;
}
