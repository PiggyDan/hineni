"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { matchingLocalVoices, narrationStyles, preferredVoice, speechChunks } from "@/lib/read-aloud";

export function ReadAloud({ language, allowed, verses }: {
  language: string; allowed: boolean; verses: { verse: number; text: string }[];
}) {
  const t = useTranslations("readAloud");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [allowOnline, setAllowOnline] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [style, setStyle] = useState<keyof typeof narrationStyles>("calm");
  const [rate, setRate] = useState<number>(narrationStyles.calm.rate);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [verse, setVerse] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const currentVoice = voices.find((voice) => voice.voiceURI === voiceId) ?? preferredVoice(voices);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- browser capability/voice inventory is unavailable during SSR */
    const available = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupported(available);
    if (!available) return;
    const synth = window.speechSynthesis;
    const session = generation;
    const refresh = () => setVoices(matchingLocalVoices(synth.getVoices(), language, allowOnline));
    refresh();
    /* eslint-enable react-hooks/set-state-in-effect */
    synth.addEventListener("voiceschanged", refresh);
    return () => { session.current++; synth.cancel(); synth.removeEventListener("voiceschanged", refresh); utterance.current = null; };
  }, [language, allowOnline]);

  function stop() {
    generation.current++;
    window.speechSynthesis.cancel();
    utterance.current = null;
    setState("idle"); setVerse(null);
  }

  function play() {
    if (!supported || !allowed || !currentVoice) return;
    const synth = window.speechSynthesis;
    if (state === "playing") { synth.pause(); setState("paused"); return; }
    if (state === "paused") { synth.resume(); setState("playing"); return; }
    const token = ++generation.current;
    synth.cancel(); synth.resume(); setError(false); setState("playing");
    const chunks = verses.flatMap((item) => speechChunks(item.text).map((text) => ({ verse: item.verse, text })));
    function speak(index: number) {
      if (token !== generation.current) return;
      const chunk = chunks[index];
      if (!chunk) { utterance.current = null; setState("idle"); setVerse(null); return; }
      const speech = new SpeechSynthesisUtterance(chunk.text);
      utterance.current = speech;
      speech.voice = currentVoice!; speech.lang = language; speech.rate = rate; speech.pitch = narrationStyles[style].pitch;
      speech.onstart = () => { if (token === generation.current) setVerse(chunk.verse); };
      speech.onend = () => speak(index + 1);
      const fail = () => { if (token === generation.current) { generation.current++; synth.cancel(); utterance.current = null; setState("idle"); setVerse(null); setError(true); } };
      speech.onerror = fail;
      try { synth.speak(speech); } catch { fail(); }
    }
    speak(0);
  }

  const unavailable = !allowed ? t("rightsUnavailable") : supported === false ? t("unsupported") : supported === null ? t("loading") : !currentVoice ? t("noVoice", { language }) : null;
  return <section aria-label={t("title")} className="mb-6 rounded-2xl border border-line bg-surface p-4">
    <div className="mb-3 flex items-center gap-2"><Volume2 className="size-4 text-accent-ink" aria-hidden /><h2 className="font-sans text-sm font-semibold">{t("title")}</h2></div>
    {allowed && supported && <label className="mb-3 flex items-start gap-2 text-xs text-ink-muted"><input type="checkbox" checked={allowOnline} disabled={state !== "idle"} onChange={(event) => { setVoiceId(""); setAllowOnline(event.target.checked); }} className="mt-0.5" /><span>{t("allowOnline")}</span></label>}
    {unavailable ? <p className="text-sm text-ink-muted">{unavailable}</p> : <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-full text-xs text-ink-muted">{t("delivery")}<select value={style} disabled={state !== "idle"} onChange={(event) => { const value = event.target.value as keyof typeof narrationStyles; setStyle(value); setRate(narrationStyles[value].rate); }} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50"><option value="calm">{t("calm")}</option><option value="natural">{t("natural")}</option></select></label>
        <label className="min-w-0 flex-1 text-xs text-ink-muted">{t("voice")}<select value={currentVoice?.voiceURI ?? ""} disabled={state !== "idle"} onChange={(event) => setVoiceId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50">{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}</select></label>
        <label className="text-xs text-ink-muted">{t("speed")}<select value={rate} disabled={state !== "idle"} onChange={(event) => setRate(Number(event.target.value))} className="mt-1 block min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50">{[0.75, 0.9, 1, 1.25, 1.5].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
        <button type="button" onClick={play} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm text-on-primary">{state === "playing" ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}{t(state === "playing" ? "pause" : state === "paused" ? "resume" : "play")}</button>
        <button type="button" onClick={stop} disabled={state === "idle"} aria-label={t("stop")} className="flex size-11 items-center justify-center rounded-xl border border-line disabled:opacity-40"><Square className="size-4" aria-hidden /></button>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{t(currentVoice?.localService ? "deviceVoice" : "onlineVoice")}</p>
      <p className="mt-1 text-xs text-ink-muted">{t("voiceQuality")}</p>
      <p role="status" className="mt-1 text-xs text-ink-muted">{verse !== null ? t("readingVerse", { verse }) : ""}</p>
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-ink-muted">{t("error")}</p>}
  </section>;
}
