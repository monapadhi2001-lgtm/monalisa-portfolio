"use client";

import { PROJECTS } from "@/data/projects";
import { SITE } from "@/data/site";
import type { Phase } from "@/components/scene/Depot";

type Props = {
  phase: Phase;
  openId: string | null;
  hoveredId: string | null;
  onClose: () => void;
  /** True while the media panel is open (it has its own back button). */
  detailOpen: boolean;
};

/** Heads-up layer: caption, status line, tagline, scroll cue, Close button. */
export function Hud({ phase, openId, hoveredId, onClose, detailOpen }: Props) {
  const active = phase !== "idle";
  const hovered = PROJECTS.find((s) => s.id === hoveredId);
  const open = PROJECTS.find((s) => s.id === openId);

  let status = "Tap a container to open a project";
  if (phase === "fetching" && open) status = `Fetching ${open.code} · ${open.title}`;
  else if (phase === "closing" && open) status = `Returning ${open.code} to the pile`;
  else if (phase === "open" && open) status = `${open.code} open · Explore the project or press Esc`;
  else if (hovered) status = `${hovered.code} · ${hovered.title} · ${hovered.category}`;

  return (
    <>
      {/* Outer div fades on scroll, inner element fades in during the intro */}
      <div
        className={`hud-fade pointer-events-none absolute top-[68px] left-6 z-20 max-w-[60vw] transition-opacity duration-500 md:left-10 ${active ? "opacity-0" : ""}`}
      >
        <p className="reveal font-mono text-[10px] tracking-[0.18em] text-white/90 uppercase">
          {SITE.caption}
        </p>
      </div>

      <div className="reveal pointer-events-none absolute bottom-6 left-6 z-20 flex max-w-[calc(100vw-48px)] items-center gap-3 md:left-10 md:max-w-[70vw]">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[color:var(--signal)]" />
        <p className="font-mono text-[10px] tracking-[0.12em] text-white/90 uppercase md:text-[11px]" aria-live="polite">
          {status}
        </p>
      </div>

      <div
        className={`hud-fade pointer-events-none absolute right-6 bottom-6 z-20 hidden transition-opacity duration-500 md:right-10 md:block ${active ? "opacity-0" : ""}`}
      >
        <div className="reveal flex flex-col items-end gap-3">
        <p className="max-w-[280px] text-right text-[13px] leading-snug text-white">{SITE.tagline}</p>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-white/90 uppercase">
          Scroll
          <span className="relative block h-8 w-px overflow-hidden bg-white/25">
            <span className="scroll-tick absolute inset-x-0 top-0 h-3 bg-white" />
          </span>
        </div>
        </div>
      </div>

      {phase === "open" && !detailOpen && (
        <button
          onClick={onClose}
          className="absolute top-[64px] right-6 z-30 min-h-10 rounded-full border border-white/50 bg-[color:var(--harbor)]/40 px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-white uppercase backdrop-blur-sm transition-colors hover:bg-white hover:text-[color:var(--harbor)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-10"
        >
          Close container ✕
        </button>
      )}
    </>
  );
}
