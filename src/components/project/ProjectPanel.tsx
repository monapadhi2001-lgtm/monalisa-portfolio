"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/data/projects";
import { textOn } from "@/lib/media";
import { ProjectGallery } from "./ProjectGallery";
import { VideoGallery } from "./VideoGallery";
import { WebsitePreview } from "./WebsitePreview";
import { PdfViewer } from "./PdfViewer";

type Props = {
  /** Project to show; null when nothing is open. */
  project: Project | null;
  /** True once the doors are open: the panel slides in. */
  open: boolean;
  onClose: () => void;
  onNext: () => void;
};

/**
 * The detail panel that slides in beside an open container.
 * Desktop: a tall panel on the right. Phones: a bottom sheet.
 * It keeps showing the last project while it animates out.
 */
export function ProjectPanel({ project, open, onClose, onNext }: Props) {
  const root = useRef<HTMLElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Project | null>(project);
  // Bumped after the panel closes, to remount media and stop any playing video.
  const [session, setSession] = useState(0);
  if (project && project !== shown) setShown(project); // keep the last one for the exit animation

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const sheet = window.innerWidth / window.innerHeight < 0.9;
      const off = sheet ? { xPercent: 0, yPercent: 105 } : { xPercent: 105, yPercent: 0 };

      if (open) {
        scroller.current?.scrollTo({ top: 0 });
        gsap
          .timeline()
          .set(el, { autoAlpha: 1 })
          .fromTo(el, off, { xPercent: 0, yPercent: 0, duration: 0.9, ease: "expo.out" })
          .fromTo(
            ".pp-item",
            { y: 26, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "power3.out" },
            "-=0.6"
          );
        closeBtn.current?.focus({ preventScroll: true });
      } else {
        el.querySelectorAll("video").forEach((v) => v.pause());
        gsap.to(el, {
          ...off,
          duration: 0.5,
          ease: "power3.in",
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0 });
            setSession((n) => n + 1);
          },
        });
      }
    },
    { scope: root, dependencies: [open, shown?.id] }
  );

  // Keep wheel / touch scrolling inside the panel from reaching the page.
  useEffect(() => {
    document.documentElement.style.overscrollBehavior = open ? "contain" : "";
  }, [open]);

  const p = shown;
  const accent = p?.color ?? "#ffffff";

  return (
    <aside
      ref={root}
      role="dialog"
      aria-modal="false"
      aria-labelledby="project-title"
      aria-hidden={!open}
      inert={!open}
      className="invisible fixed z-40 flex flex-col overflow-hidden border-white/10 bg-[#0a1230]/94 text-white shadow-[0_30px_80px_rgba(0,8,40,0.55)] backdrop-blur-xl
        inset-x-0 bottom-0 h-[64dvh] rounded-t-3xl border-t
        wide:inset-x-auto wide:top-0 wide:right-0 wide:h-dvh wide:w-[min(600px,50vw)] wide:rounded-none wide:border-t-0 wide:border-l"
    >
      {p && (
        <>
          {/* Sticky header: drag handle (phones), code, close */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-8">
            <span className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-white/65 uppercase">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: accent }} aria-hidden />
              {p.code} · {p.year}
            </span>
            <button
              ref={closeBtn}
              onClick={onClose}
              className="rounded-full border border-white/30 px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:bg-white hover:text-[#0a1230] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back to container ✕
            </button>
          </div>

          <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-6 pt-7 pb-12 md:px-8">
            <p className="pp-item font-mono text-[11px] tracking-[0.18em] text-white/55 uppercase">{p.category}</p>
            <h2
              id="project-title"
              className="pp-item font-display mt-3 text-[40px] leading-[0.95] tracking-[-0.02em] text-balance text-[color:var(--cream)] md:text-[52px]"
            >
              {p.title}
            </h2>
            <p className="pp-item mt-3 text-[13px] text-white/60">{p.role}</p>

            <div className="pp-item mt-6 flex max-w-[62ch] flex-col gap-4 text-[15px] leading-relaxed text-white/82">
              {p.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <ul className="pp-item mt-6 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li key={t} className="rounded-full border border-white/20 px-3 py-1 text-[12px] text-white/80">
                  {t}
                </li>
              ))}
            </ul>

            {/* Each section appears only if the project has that kind of media. */}
            <div key={session}>
            {!!p.videos?.length && (
              <Section title={p.videos.length > 1 ? `Videos · ${p.videos.length}` : "Video"}>
                <VideoGallery key={p.id} videos={p.videos} accent={accent} />
              </Section>
            )}

            {!!p.photos?.length && (
              <Section title={`Photos · ${p.photos.length}`}>
                <ProjectGallery key={p.id} photos={p.photos} />
              </Section>
            )}

            {!!p.websites?.length && (
              <Section title={p.websites.length > 1 ? "Live websites" : "Live website"}>
                <div className="flex flex-col gap-4">
                  {p.websites.map((w) => (
                    <WebsitePreview key={`${p.id}-${w.title}`} site={w} accent={accent} />
                  ))}
                </div>
              </Section>
            )}

            {!!p.screenshots?.length && (
              <Section title="Screenshots">
                <ProjectGallery key={p.id} photos={p.screenshots} variant="strip" />
              </Section>
            )}

            {!!p.caseStudies?.length && (
              <Section title={p.caseStudies.length > 1 ? "Case studies" : "Case study"}>
                <div className="flex flex-col gap-4">
                  {p.caseStudies.map((d) => (
                    <PdfViewer key={`${p.id}-${d.src}`} doc={d} accent={accent} />
                  ))}
                </div>
              </Section>
            )}

            </div>

            <div className="pp-item mt-10 flex flex-wrap gap-3">
              {(p.links ?? []).map((l, i) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={
                    i === 0
                      ? { background: accent, color: textOn(accent) }
                      : { border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }
                  }
                >
                  {l.label} ↗
                </a>
              ))}
              <button
                onClick={onNext}
                className="rounded-full border border-white/30 px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Next container →
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pp-item mt-10" aria-label={title}>
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.18em] text-white/55 uppercase">{title}</h3>
      {children}
    </section>
  );
}
