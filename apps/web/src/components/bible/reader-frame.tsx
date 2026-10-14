"use client";

import { Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { readerStyle, setReaderPrefs, useReaderPrefs } from "@/lib/reader-prefs";

export function setFocusMode(on: boolean) {
  if (on) document.documentElement.dataset.focus = "1";
  else delete document.documentElement.dataset.focus;
  window.dispatchEvent(new Event("hineni:focus"));
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Wraps a chapter: applies reading preferences as CSS variables, shows scroll progress,
 * and handles focus mode plus arrow-key / swipe chapter navigation.
 */
export function ReaderFrame({
  prevHref,
  nextHref,
  accountSize,
  children,
}: {
  prevHref?: string;
  nextHref?: string;
  accountSize?: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("app.reader");
  const router = useRouter();
  const prefs = useReaderPrefs(accountSize);
  const bar = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // A signed-in reader on a new device starts from their account text size.
  useEffect(() => {
    try {
      if (accountSize && !localStorage.getItem("hineni:reader")) setReaderPrefs({ size: accountSize });
    } catch {
      /* storage unavailable */
    }
  }, [accountSize]);

  useEffect(() => {
    const sync = () => setFocus(document.documentElement.dataset.focus === "1");
    window.addEventListener("hineni:focus", sync);
    return () => {
      window.removeEventListener("hineni:focus", sync);
      setFocusMode(false); // never leave the rest of the app without navigation
    };
  }, []);

  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [router, prevHref, nextHref]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || typing(event.target)) return;
      if (event.key === "Escape" && document.documentElement.dataset.focus) setFocusMode(false);
      const rtl = document.documentElement.dir === "rtl" || getComputedStyle(document.body).direction === "rtl";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      if (event.key === back && prevHref) router.push(prevHref);
      if (event.key === forward && nextHref) router.push(nextHref);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 1})`;
    };
    onScroll();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [router, prevHref, nextHref]);

  return (
    <div
      style={readerStyle(prefs)}
      onTouchStart={(event) => {
        const point = event.touches[0];
        touch.current = point ? { x: point.clientX, y: point.clientY } : null;
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        const point = event.changedTouches[0];
        touch.current = null;
        if (!start || !point || window.getSelection()?.toString()) return;
        const dx = point.clientX - start.x;
        const dy = point.clientY - start.y;
        if (Math.abs(dx) < 80 || Math.abs(dy) > 60) return;
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const towardNext = rtl ? dx > 0 : dx < 0;
        if (towardNext && nextHref) router.push(nextHref);
        if (!towardNext && prevHref) router.push(prevHref);
      }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 lg:start-64 [html[data-focus]_&]:start-0">
        <div ref={bar} className="h-full origin-left bg-accent transition-transform duration-150 rtl:origin-right" style={{ transform: "scaleX(0)" }} />
      </div>
      {children}
      {focus && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="glass fixed end-4 top-4 z-50 inline-flex h-10 animate-fade items-center gap-2 rounded-full px-4 text-sm text-ink shadow-lg"
        >
          <Minimize2 className="size-4" aria-hidden />
          {t("exitFocus")}
        </button>
      )}
    </div>
  );
}
