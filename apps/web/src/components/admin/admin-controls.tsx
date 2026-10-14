"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { roles, type Role } from "@cp/shared";
import { useRouter } from "@/i18n/navigation";
import { api, ApiClientError } from "@/lib/api-client";

const errorKey = (error: unknown) => (error instanceof ApiClientError ? error.code : "error");

/** PATCHes an admin endpoint, then refreshes server data. */
export function AdminAction({
  path,
  body,
  children,
  variant = "outline",
  confirmText,
}: {
  path: string;
  body: unknown;
  children: React.ReactNode;
  variant?: "outline" | "primary" | "danger";
  confirmText?: string;
}) {
  const tc = useTranslations("app.common");
  const ta = useTranslations("app.admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const styles = {
    outline: "border border-line bg-surface text-ink hover:border-accent",
    primary: "bg-primary text-on-primary hover:opacity-90",
    danger: "border border-danger/40 text-danger hover:bg-danger/10",
  }[variant];

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          start(async () => {
            setError(null);
            try {
              await api(path, { method: "PATCH", body });
              router.refresh();
            } catch (cause) {
              const code = errorKey(cause);
              setError(code === "display_not_allowed" ? ta("displayNotAllowed") : code === "cannot_change_self" ? ta("cannotChangeSelf") : tc("error"));
            }
          });
        }}
        className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition disabled:opacity-50 ${styles}`}
      >
        {pending ? tc("saving") : children}
      </button>
      {error && (
        <span role="alert" className="max-w-56 text-end text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

export function RoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled: boolean }) {
  const ta = useTranslations("app.admin");
  const tc = useTranslations("app.common");
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <select
        aria-label={ta("changeRole")}
        title={disabled ? ta("cannotChangeSelf") : ta("changeRole")}
        disabled={disabled || pending}
        value={value}
        onChange={(event) => {
          const next = event.target.value as Role;
          const previous = value;
          setValue(next);
          start(async () => {
            setError(false);
            try {
              await api(`/admin/users/${userId}`, { method: "PATCH", body: { role: next } });
              router.refresh();
            } catch {
              setValue(previous);
              setError(true);
            }
          });
        }}
        className="h-9 rounded-full border border-line bg-surface px-3 text-sm text-ink disabled:opacity-60"
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {ta(`roles.${item}`)}
          </option>
        ))}
      </select>
      {error && <span role="alert" className="text-xs text-danger">{tc("error")}</span>}
    </span>
  );
}
