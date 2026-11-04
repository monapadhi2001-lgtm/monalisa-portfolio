"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import type { Photo } from "@/data/projects";

type Props = {
  photos: Photo[];
  /** Index of the photo to show, or null when closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Full-screen image viewer.
 *  - ← / → or swipe: previous / next      - Esc: close
 *  - click the image or Z: zoom to 2× (drag to look around while zoomed)
 *  - thumbnail strip, counter and caption
 * Rendered into <body> with a portal so it sits above everything.
 */
export function Lightbox({ photos, index, onIndexChange, onClose }: Props) {
  const open = index !== null;
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const [zoom, setZoom] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const count = photos.length;
  const i = index ?? 0;

  const go = useCallback(
    (to: number) => {
      setZoom(false);
      setPan({ x: 0, y: 0 });
      onIndexChange((to + count) % count);
    },
    [count, onIndexChange]
  );

  // Open / close animation + focus handling.
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement;
    closeBtn.current?.focus({ preventScroll: true });
    if (root.current) gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
    return () => {
      (returnFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Cross-fade each time the photo changes; preload its neighbours.
  useEffect(() => {
    if (!open || !img.current) return;
    gsap.fromTo(img.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power3.out" });
    [i - 1, i + 1].forEach((k) => {
      const p = photos[(k + count) % count];
      if (p) new Image().src = p.src;
    });
  }, [open, i, photos, count]);

  // Keyboard. Capture phase + preventDefault so Esc doesn't also close the project.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key.toLowerCase() === "z") setZoom((z) => !z);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, i, go, onClose]);

  if (!open || typeof document === "undefined") return null;
  const photo = photos[i];

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${i + 1} of ${count}`}
      className="fixed inset-0 z-[60] flex flex-col bg-[#050814]/95 text-white backdrop-blur-md"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <span className="font-mono text-[11px] tracking-[0.16em] text-white/70 tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => !z)}
            className="rounded-full border border-white/25 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            aria-pressed={zoom}
          >
            {zoom ? "Zoom out" : "Zoom in"}
          </button>
          <button
            ref={closeBtn}
            onClick={onClose}
            className="rounded-full border border-white/25 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase hover:bg-white hover:text-[#050814] focus-visible:outline-2 focus-visible:outline-white"
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Image stage */}
      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 md:px-16 ${zoom ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        style={{ touchAction: zoom ? "none" : "pan-y" }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !zoom) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
          setPan({ x: d.px + dx, y: d.py + dy });
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (!zoom && Math.abs(dx) > 50) return go(i + (dx < 0 ? 1 : -1)); // swipe
          if (!d.moved && e.target === img.current) {
            setZoom((z) => !z);
            setPan({ x: 0, y: 0 });
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !zoom) onClose(); // click the dark backdrop
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-300 ease-out"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom ? 2 : 1})` }}
        />

        {count > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(i - 1)} />
            <ArrowButton side="right" onClick={() => go(i + 1)} />
          </>
        )}
      </div>

      {/* Caption + thumbnails */}
      <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-5">
        <p className="min-h-[1.25rem] text-center text-[13px] text-white/75" aria-live="polite">
          {photo.caption}
        </p>
        {count > 1 && (
          <div className="flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
            {photos.map((p, k) => (
              <button
                key={p.src + k}
                onClick={() => go(k)}
                aria-label={`Show image ${k + 1}`}
                aria-current={k === i}
                className={`h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-white ${
                  k === i ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 ${side === "left" ? "left-3 md:left-5" : "right-3 md:right-5"} grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-lg backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white`}
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}
