"use client";

import { useState } from "react";
import type { Video } from "@/data/projects";
import { youTubeId, youTubeThumb } from "@/lib/media";
import { MediaPlayer } from "./MediaPlayer";
import { EmbedPlayer } from "./EmbedPlayer";

/**
 * Plays one video at a time from a list (MP4 files, YouTube and Vimeo mixed).
 * Switching videos unmounts the previous player, so only one ever plays.
 */
export function VideoGallery({ videos, accent }: { videos: Video[]; accent: string }) {
  const [active, setActive] = useState(0);
  if (videos.length === 0) return null;
  const v = videos[Math.min(active, videos.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div key={active}>
        {v.type === "file" ? (
          <MediaPlayer src={v.src} poster={v.poster} title={v.title} accent={accent} />
        ) : (
          <EmbedPlayer provider={v.type} url={v.url} title={v.title} poster={v.poster} accent={accent} />
        )}
      </div>
      <p className="text-[13px] font-medium text-white/85">{v.title}</p>

      {videos.length > 1 && (
        <ol className="flex flex-col gap-1.5" aria-label="Videos">
          {videos.map((item, i) => (
            <li key={i}>
              <button
                onClick={() => setActive(i)}
                aria-current={i === active}
                className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                  i === active ? "bg-white/12" : "hover:bg-white/6"
                }`}
              >
                <span className="relative h-11 w-[72px] shrink-0 overflow-hidden rounded-md bg-black/50">
                  {thumb(item) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(item)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <span className="absolute inset-0 grid place-items-center text-[11px] text-white" aria-hidden>
                    {i === active ? "●" : "▶"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-white">{item.title}</span>
                  <span className="block font-mono text-[10px] tracking-[0.12em] text-white/50 uppercase">
                    {item.type === "file" ? "Video" : item.type === "youtube" ? "YouTube" : "Vimeo"}
                    {item.duration ? ` · ${item.duration}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function thumb(v: Video) {
  if (v.poster) return v.poster;
  if (v.type === "youtube") {
    const id = youTubeId(v.url);
    return id ? youTubeThumb(id) : undefined;
  }
  return undefined;
}
