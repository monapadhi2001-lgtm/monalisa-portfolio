"use client";

import { useState } from "react";
import { vimeoEmbed, vimeoId, youTubeEmbed, youTubeId, youTubeThumb } from "@/lib/media";

type Props = {
  provider: "youtube" | "vimeo";
  url: string;
  title: string;
  poster?: string;
  accent?: string;
};

/**
 * YouTube / Vimeo player. Shows a lightweight cover first and only loads the
 * provider's player (with its own full playback controls) when clicked.
 * That keeps the panel fast and avoids tracking until the visitor chooses to play.
 */
export function EmbedPlayer({ provider, url, title, poster, accent = "#ffffff" }: Props) {
  const [active, setActive] = useState(false);
  const id = provider === "youtube" ? youTubeId(url) : vimeoId(url);

  if (!id) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-xl bg-black/60 p-6 text-center text-[13px] text-white/75">
        This {provider === "youtube" ? "YouTube" : "Vimeo"} link doesn&apos;t look right: {url}
      </div>
    );
  }

  const src = provider === "youtube" ? youTubeEmbed(id) : vimeoEmbed(id);
  const cover = poster ?? (provider === "youtube" ? youTubeThumb(id) : undefined);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {active ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          onClick={() => setActive(true)}
          className="group absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={`Play ${title} (loads ${provider === "youtube" ? "YouTube" : "Vimeo"})`}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100" />
          ) : (
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#2a3a7a,#0a1230)]" />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-full text-2xl shadow-lg transition-transform group-hover:scale-105"
              style={{ background: accent, color: "#0b0d13" }}
              aria-hidden
            >
              ▶
            </span>
          </span>
          <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-white uppercase backdrop-blur-sm">
            {provider === "youtube" ? "YouTube" : "Vimeo"}
          </span>
        </button>
      )}
    </div>
  );
}
