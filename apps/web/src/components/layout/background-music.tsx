"use client";

import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { backgroundHymns } from "@/lib/hymns";

/** User-initiated playback of licensed hymns or local files. No uploads. */
export function BackgroundMusic() {
  const t = useTranslations("backgroundMusic");
  const audio = useRef<HTMLAudioElement>(null);
  const objectUrl = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>(backgroundHymns[0].title);
  const [trackId, setTrackId] = useState<string>(backgroundHymns[0].id);
  const track = backgroundHymns.find((item) => item.id === trackId);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [loop, setLoop] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const matching = backgroundHymns.filter((item) => item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const options = track && !matching.some((item) => item.id === track.id) ? [track, ...matching] : matching;

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);
  // The trigger lives in the navigation shell; it signals through a window event.
  useEffect(() => {
    const toggleOpen = () => setOpen((value) => !value);
    window.addEventListener("hineni:music-toggle", toggleOpen);
    return () => window.removeEventListener("hineni:music-toggle", toggleOpen);
  }, []);
  useEffect(() => {
    if (playing) document.documentElement.dataset.music = "playing";
    else delete document.documentElement.dataset.music;
  }, [playing]);

  function choose(file?: File) {
    if (!file || !audio.current) return;
    audio.current.pause();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    audio.current.src = objectUrl.current;
    audio.current.volume = volume;
    audio.current.load();
    setName(file.name); setTrackId(""); setError(false); setPlaying(false);
  }

  function selectTrack(id: string) {
    const selected = backgroundHymns.find((item) => item.id === id);
    if (!selected || !audio.current) return;
    audio.current.pause();
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; }
    audio.current.src = selected.src;
    audio.current.load();
    setTrackId(id); setName(selected.title); setPlaying(false); setError(false);
  }

  function move(direction: number) {
    const index = backgroundHymns.findIndex((item) => item.id === trackId);
    const next = (index + direction + backgroundHymns.length) % backgroundHymns.length;
    selectTrack(backgroundHymns[next]!.id);
  }

  async function toggle() {
    if (!audio.current || !name) return;
    if (!audio.current.paused) { audio.current.pause(); return; }
    setError(false);
    audio.current.volume = volume;
    try { await audio.current.play(); } catch { setError(true); }
  }

  return <>
    <audio ref={audio} src={backgroundHymns[0].src} loop={loop} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setError(true); setPlaying(false); }} />
    {open && <section id="background-music-panel" aria-label={t("title")} className="fixed end-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-8rem)] w-[min(20rem,calc(100vw-2rem))] animate-rise overflow-y-auto rounded-[20px] border border-line bg-surface p-5 shadow-2xl lg:bottom-6">
      <div className="flex items-center justify-between gap-3"><h2 className="font-sans text-base font-semibold">{t("title")}</h2><button type="button" aria-label={t("close")} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full hover:bg-muted"><X className="size-4" aria-hidden /></button></div>
      <p className="mb-3 text-xs text-ink-muted">{t("trackCount", { count: backgroundHymns.length })}</p>
      <label className="mb-3 block text-sm">{t("search")}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="input mt-2 min-h-11 w-full rounded-xl" /></label>
      {!matching.length && <p role="status" className="mb-3 text-xs text-ink-muted">{t("noResults")}</p>}
      <label className="mb-4 block text-sm font-medium">{t("hymns")}<select value={trackId} onChange={(event) => selectTrack(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm">{!trackId && <option value="">{t("localFile")}</option>}{options.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {track && <p className="mb-4 text-xs leading-relaxed text-ink-muted"><a href={track.source} target="_blank" rel="noopener noreferrer" className="underline">{track.title}</a> — <a href={track.artistUrl} target="_blank" rel="noopener noreferrer" className="underline">{track.artist}</a> · <a href={track.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{track.license}</a> · {t("unmodified")}</p>}
      {track?.src.startsWith("https:") && <p className="mb-4 text-xs text-ink-muted">{t("external")}</p>}
      <p className="mb-4 text-xs text-ink-muted">{t("localOnly")}</p>
      <label className="block text-sm font-medium">{t("choose")}<input type="file" accept="audio/*" onChange={(event) => choose(event.target.files?.[0])} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-3 file:text-ink" /></label>
      {name && <p className="mt-3 truncate text-sm text-ink-muted" title={name}>{name}</p>}
      <button type="button" disabled={!name} onClick={toggle} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-40">{playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}{t(playing ? "pause" : "play")}</button>
      <div className="mt-2 flex gap-2"><button type="button" onClick={() => move(-1)} aria-label={t("previous")} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line hover:border-accent"><SkipBack className="size-4" aria-hidden /></button><button type="button" onClick={() => move(1)} aria-label={t("next")} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line hover:border-accent"><SkipForward className="size-4" aria-hidden /></button></div>
      <label className="mt-4 block text-sm">{t("volume")}<input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (audio.current) audio.current.volume = value; }} className="mt-2 block w-full accent-[var(--accent)]" /></label>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />{t("loop")}</label>
      {error && <p role="alert" className="mt-3 text-sm text-ink-muted">{t("error")}</p>}
    </section>}
  </>;
}
