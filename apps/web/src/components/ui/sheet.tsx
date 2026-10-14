"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/** Modal sheet: bottom sheet on phones, centered dialog on larger screens. Uses native <dialog> for focus trapping and Escape. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const t = useTranslations("app.common");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[28px] border border-line bg-surface p-0 text-ink shadow-2xl open:animate-rise sm:inset-0 sm:m-auto sm:max-w-xl sm:rounded-[24px]"
    >
      <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <header className="flex items-center justify-between px-6 pt-5 pb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button type="button" className="icon-btn" aria-label={t("close")} onClick={onClose}>
          <X className="size-5" aria-hidden />
        </button>
      </header>
      <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{open && children}</div>
    </dialog>
  );
}
