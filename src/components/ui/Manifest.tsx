"use client";

import { PROJECTS } from "@/data/projects";
import { SITE } from "@/data/site";

/**
 * The section after the hero: a cargo manifest listing every project.
 * Each row flies you back up and has the crane fetch that container.
 * It also gives keyboard and screen-reader users a plain way in.
 */
export function Manifest({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section
      id="manifest"
      aria-labelledby="manifest-title"
      className="relative z-10 scroll-mt-4 bg-[color:var(--deep)] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] tracking-[0.24em] text-white/60 uppercase">
          Bill of lading · {SITE.name}
        </p>
        <h2
          id="manifest-title"
          className="font-display mt-4 text-5xl leading-[0.9] tracking-[-0.03em] text-[color:var(--cream)] md:text-7xl"
        >
          Cargo manifest
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
          Seven projects, one container each. Pick one and the crane will bring it up.
        </p>

        <ol className="mt-12 border-t border-white/15">
          {PROJECTS.map((p) => (
            <li key={p.id} className="border-b border-white/15">
              <button
                onClick={() => onOpen(p.id)}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-white md:grid-cols-[90px_1.1fr_1.4fr_auto] md:gap-6"
              >
                <span
                  className="h-6 w-10 rounded-[2px] md:h-7 md:w-12"
                  style={{
                    background: `repeating-linear-gradient(90deg, ${p.color} 0 3px, color-mix(in srgb, ${p.color} 80%, black) 3px 5px)`,
                  }}
                />
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] tracking-[0.16em] text-white/55 tabular-nums">
                    {p.code} · {p.year}
                  </span>
                  <span className="font-display block text-xl tracking-[-0.01em] text-white md:text-2xl">{p.title}</span>
                  <span className="mt-0.5 block text-[12px] text-white/55">{p.category}</span>
                </span>
                <span className="hidden min-w-0 text-[14px] leading-relaxed text-white/65 md:block">{p.summary}</span>
                <span className="font-mono text-[11px] tracking-[0.14em] whitespace-nowrap text-white/80 uppercase group-hover:text-white">
                  Open ↑
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
