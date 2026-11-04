"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/media";

type Props = {
  src: string;
  poster?: string;
  title: string;
  accent?: string;
};

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

/**
 * Custom player for MP4 / WebM files.
 * Controls: play/pause, seek bar (with buffered range), time, mute + volume,
 * playback speed, picture-in-picture and fullscreen.
 * Keyboard (when the player is focused): Space/K play, ←/→ seek 5 s,
 * M mute, F fullscreen. Controls fade out while playing and come back on
 * mouse move or focus.
 */
export function MediaPlayer({ src, poster, title, accent = "#ffffff" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showUi, setShowUi] = useState(true);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  const v = () => video.current;

  const toggle = () => {
    const el = v();
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const seek = (to: number) => {
    const el = v();
    if (el) el.currentTime = Math.max(0, Math.min(to, el.duration || 0));
  };
  const fullscreen = () => {
    const box = wrap.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const el = v() as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (box?.requestFullscreen) box.requestFullscreen().catch(() => {});
    else el?.webkitEnterFullscreen?.(); // iPhone Safari
  };
  const pip = () => {
    const el = v();
    if (!el || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else el.requestPictureInPicture().catch(() => {});
  };

  // Auto-hide controls while playing.
  const poke = () => {
    setShowUi(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!v()?.paused) setShowUi(false);
    }, 2500);
  };
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Keep the element in sync with volume / speed state.
  useEffect(() => {
    const el = v();
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
    el.playbackRate = speed;
  }, [volume, muted, speed]);

  const pct = duration ? (time / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrap}
      tabIndex={0}
      role="group"
      aria-label={`Video player: ${title}`}
      className="group/player relative aspect-video w-full overflow-hidden rounded-xl bg-black outline-none focus-visible:ring-2 focus-visible:ring-white"
      onMouseMove={poke}
      onFocus={poke}
      onKeyDown={(e) => {
        poke();
        if (e.target !== e.currentTarget) return; // let buttons and sliders handle their own keys
        const k = e.key.toLowerCase();
        if (k === " " || k === "k") {
          e.preventDefault();
          toggle();
        } else if (k === "arrowright") seek((v()?.currentTime ?? 0) + 5);
        else if (k === "arrowleft") seek((v()?.currentTime ?? 0) - 5);
        else if (k === "m") setMuted((m) => !m);
        else if (k === "f") fullscreen();
        poke();
      }}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setShowUi(true);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onProgress={(e) => {
          const b = e.currentTarget.buffered;
          if (b.length) setBuffered(b.end(b.length - 1));
        }}
        onEnded={() => setShowUi(true)}
        onError={() => setError(true)}
      />

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-[13px] text-white/80">
          This video couldn&apos;t be loaded. Check that the file exists at {src}.
        </div>
      )}

      {/* Big play button before the first play */}
      {!started && !error && (
        <button
          onClick={toggle}
          aria-label={`Play ${title}`}
          className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 to-transparent"
        >
          <span
            className="grid h-16 w-16 place-items-center rounded-full text-2xl shadow-lg transition-transform hover:scale-105"
            style={{ background: accent, color: "#0b0d13" }}
            aria-hidden
          >
            ▶
          </span>
        </button>
      )}

      {/* Control bar */}
      {started && (
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pt-8 pb-2.5 transition-opacity duration-300 ${
            showUi ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Seek bar */}
          <div className="relative h-1.5 w-full rounded-full bg-white/20">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${bufPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: accent }} />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
              className="absolute -inset-y-2 inset-x-0 w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex items-center gap-2 text-white">
            <CtrlButton label={playing ? "Pause" : "Play"} onClick={toggle}>
              {playing ? "❚❚" : "▶"}
            </CtrlButton>
            <span className="font-mono text-[11px] text-white/85 tabular-nums">
              {formatTime(time)} / {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <CtrlButton label={muted || volume === 0 ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
                {muted || volume === 0 ? "🔇" : "🔊"}
              </CtrlButton>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(Number(e.target.value) === 0);
                }}
                aria-label="Volume"
                className="hidden w-16 accent-white sm:block"
              />
              <label className="sr-only" htmlFor={`speed-${src}`}>
                Playback speed
              </label>
              <select
                id={`speed-${src}`}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="rounded bg-white/10 px-1.5 py-1 font-mono text-[11px] text-white"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s} className="text-black">
                    {s}×
                  </option>
                ))}
              </select>
              <CtrlButton label="Picture in picture" onClick={pip}>
                ⧉
              </CtrlButton>
              <CtrlButton label="Fullscreen" onClick={fullscreen}>
                ⛶
              </CtrlButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-[13px] hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}
