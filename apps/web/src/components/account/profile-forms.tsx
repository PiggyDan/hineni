"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { passwordSchema } from "@cp/shared";
import { buttonClass } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function NameForm({ initialName }: { initialName: string }) {
  const t = useTranslations("app.profile");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const { error } = await authClient.updateUser({ name: name.trim() });
        setBusy(false);
        setStatus(error ? { ok: false, text: tc("error") } : { ok: true, text: t("nameSaved") });
        if (!error) router.refresh();
      }}
    >
      <label className="block flex-1">
        <span className="label">{t("name")}</span>
        <input className="input" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <button type="submit" disabled={busy || !name.trim() || name.trim() === initialName} className={buttonClass("primary", "md")}>
        {busy ? tc("saving") : t("saveName")}
      </button>
      {status && (
        <p role="status" className={`text-sm sm:basis-full ${status.ok ? "text-secondary" : "text-danger"}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("app.profile");
  const tc = useTranslations("app.common");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = passwordSchema.safeParse(next).success;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!valid) return;
        setBusy(true);
        const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
        setBusy(false);
        setStatus(error ? { ok: false, text: t("passwordFailed") } : { ok: true, text: t("passwordChanged") });
        if (!error) {
          setCurrent("");
          setNext("");
        }
      }}
    >
      <label className="block">
        <span className="label">{t("currentPassword")}</span>
        <input className="input" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">{t("newPassword")}</span>
        <input className="input" type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="password-hint" />
        <span id="password-hint" className="mt-1.5 block text-xs text-ink-muted">{t("passwordHint")}</span>
      </label>
      <button type="submit" disabled={busy || !current || !valid} className={buttonClass("primary", "md")}>
        {busy ? tc("saving") : t("password")}
      </button>
      {status && (
        <p role="status" className={`text-sm ${status.ok ? "text-secondary" : "text-danger"}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}
