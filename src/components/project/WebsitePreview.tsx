"use client";

import { useEffect, useRef, useState } from "react";
import type { Website } from "@/data/projects";
import { hostOf, textOn } from "@/lib/media";

type Status = "idle" | "checking" | "live" | "blocked" | "none";

const DESKTOP_W = 1280; // the live page is rendered at desktop width, then scaled to fit
const LOAD_TIMEOUT = 10000;

/**
 * A website in a browser frame.
 *  1. Asks /api/embed-check whether the site allows embedding.
 *  2. If yes, loads it in an iframe (scaled down from desktop width) once the
 *     preview scrolls into view. The screenshot shows while it loads.
 *  3. If not — or it doesn't load in 10 s — shows the screenshot with a
 *     friendly message. "Open site" always opens a new tab.
 */
export function WebsitePreview({ site, accent }: { site: Website; accent: string }) {
  const frameBox = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(() =>
    !site.url ? "none" : site.embed === false ? "blocked" : "idle"
  );
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(0.4);
  const [mode, setMode] = useState<"live" | "shot">("live");

  // Start checking only when the preview is near the viewport.
  useEffect(() => {
    if (status !== "idle" || !frameBox.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setStatus("checking");
        fetch(`/api/embed-check?url=${encodeURIComponent(site.url!)}`)
          .then((r) => r.json())
          .then((d: { embeddable: boolean }) => setStatus(d.embeddable ? "live" : "blocked"))
          .catch(() => setStatus("live")); // no API (e.g. static hosting): just try, the timeout catches refusals
      },
      { rootMargin: "200px" }
    );
    io.observe(frameBox.current);
    return () => io.disconnect();
  }, [status, site.url]);

  // If the iframe never reports a load, treat it as blocked.
  useEffect(() => {
    if (status !== "live" || loaded) return;
    const t = window.setTimeout(() => setStatus("blocked"), LOAD_TIMEOUT);
    return () => window.clearTimeout(t);
  }, [status, loaded]);

  // Scale the desktop-width page to the frame.
  useEffect(() => {
    if (!frameBox.current) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / DESKTOP_W));
    ro.observe(frameBox.current);
    return () => ro.disconnect();
  }, []);

  const showLive = status === "live" && mode === "live";

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-white/12 bg-[#11182f]">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <i className="block h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-white/8 px-3 py-1 font-mono text-[11px] text-white/60">
          {site.url ? hostOf(site.url) : "coming soon"}
        </span>
        {status === "live" && site.screenshot && (
          <div className="flex shrink-0 rounded-full bg-white/8 p-0.5 text-[10px]" role="group" aria-label="Preview mode">
            {(["live", "shot"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full px-2.5 py-1 font-mono tracking-[0.1em] uppercase ${mode === m ? "bg-white text-[#0a1230]" : "text-white/70"}`}
              >
                {m === "live" ? "Live" : "Screenshot"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frame */}
      <div ref={frameBox} className="relative aspect-[16/10] w-full overflow-hidden bg-white">
        {site.screenshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.screenshot}
            alt={`Screenshot of ${site.title}`}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              showLive && loaded ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {status === "live" && (
          <iframe
            src={site.url}
            title={`${site.title} (live preview)`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            className={`absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500 ${
              showLive && loaded ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ width: DESKTOP_W, height: DESKTOP_W / 1.6, transform: `scale(${scale})` }}
          />
        )}

        {(status === "checking" || (status === "live" && !loaded && mode === "live")) && (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/65 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-white uppercase backdrop-blur-sm">
            Loading live preview…
          </span>
        )}

        {status === "blocked" && (
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-[#0a1230]/90 p-3 text-[12px] leading-snug text-white/85 backdrop-blur-sm">
            This site doesn&apos;t allow previews inside other pages
            {site.screenshot ? ", so here's a screenshot." : "."} Open it in a new tab to explore.
          </div>
        )}

        {!site.screenshot && status !== "live" && (
          <div className="absolute inset-0 grid place-items-center bg-[#0f1838] text-[13px] text-white/60">
            {status === "none" ? "Preview coming soon" : "No screenshot yet"}
          </div>
        )}
      </div>

      <figcaption className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 truncate text-[13px] font-medium text-white/85">{site.title}</span>
        {site.url ? (
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: accent, color: textOn(accent) }}
          >
            Open site ↗
          </a>
        ) : (
          <span className="shrink-0 rounded-full border border-white/20 px-3.5 py-1.5 text-[12px] text-white/55">
            Coming soon
          </span>
        )}
      </figcaption>
    </figure>
  );
}
