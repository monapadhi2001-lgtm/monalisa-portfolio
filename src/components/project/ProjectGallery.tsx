"use client";

import { useState } from "react";
import type { Photo } from "@/data/projects";
import { Lightbox } from "./Lightbox";

type Props = {
  photos: Photo[];
  /** "grid" for photographs, "strip" for a row of wide screenshots. */
  variant?: "grid" | "strip";
};

/**
 * ProjectGallery — reusable thumbnail layout that opens the Lightbox.
 * The first photo is featured large in the grid; the rest sit below it.
 */
export function ProjectGallery({ photos, variant = "grid" }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const tile = (p: Photo, i: number, className: string) => (
    <button
      key={p.src + i}
      onClick={() => setOpen(i)}
      className={`group relative overflow-hidden rounded-lg bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
      aria-label={`Open image: ${p.caption ?? p.alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.src}
        alt={p.alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        ⤢ View
      </span>
    </button>
  );

  return (
    <>
      {variant === "grid" ? (
        <div className="grid grid-cols-3 gap-2">
          {tile(photos[0], 0, "col-span-3 aspect-[16/10]")}
          {photos.slice(1).map((p, k) => tile(p, k + 1, "aspect-[4/3]"))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {photos.map((p, i) => tile(p, i, "aspect-[16/10] w-[72%] shrink-0 sm:w-[46%]"))}
        </div>
      )}
      <Lightbox photos={photos} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
