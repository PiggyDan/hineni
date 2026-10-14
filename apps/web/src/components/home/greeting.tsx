"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** Time-of-day greeting from the reader's own clock (the server cannot know their timezone). */
export function Greeting({ name }: { name?: string }) {
  const t = useTranslations("app.home");
  const hour = useSyncExternalStore(subscribe, () => new Date().getHours(), () => null);
  const key = hour === null ? null : hour < 5 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : hour < 22 ? "evening" : "night";
  const first = name?.trim().split(/\s+/)[0];
  return (
    <h1 className="font-display text-[2rem] leading-tight font-semibold text-ink sm:text-5xl">
      <span className={key ? "animate-fade" : "invisible"}>{key ? t(key) : t("morning")}</span>
      {first && <span className="text-ink-muted"> {first}</span>}
    </h1>
  );
}
