"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Navbar } from "@/components/ui/Navbar";
import { Backdrop } from "@/components/ui/Backdrop";
import { Hud } from "@/components/ui/Hud";
import { Loader } from "@/components/ui/Loader";
import { CinemaOverlay } from "@/components/ui/CinemaOverlay";
import { Manifest } from "@/components/ui/Manifest";
import { AboutContact } from "@/components/ui/AboutContact";
import { ProjectPanel } from "@/components/project/ProjectPanel";
import { heroState } from "@/lib/heroState";
import { prefersReducedMotion } from "@/lib/motion";
import { SITE } from "@/data/site";
import { PROJECTS, projectById } from "@/data/projects";
import type { Phase } from "@/components/scene/Depot";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// WebGL only exists in the browser, so the 3D scene is never server-rendered.
const Experience = dynamic(() => import("@/components/scene/Experience"), {
  ssr: false,
  loading: () => null,
});

/**
 * The page "brain". It owns the small amount of shared state:
 *  - requestedId: what the visitor asked to open (nav link, click, manifest)
 *  - phase / openId: what the crane is actually doing right now
 *  - hoveredId: container under the pointer
 *  - started: the loading screen has finished, so the intro may play
 * Scroll position goes through `heroState` instead (see lib/heroState.ts).
 */
export default function PortfolioApp() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [started, setStarted] = useState(false);
  /** Second stage: the media panel beside the open container. */
  const [detailOpen, setDetailOpen] = useState(false);
  const requested = useRef(requestedId);
  requested.current = requestedId;
  const detailRef = useRef(detailOpen);
  detailRef.current = detailOpen;
  /** Pause 3D rendering while the hero is scrolled out of view (saves battery). */
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { rootMargin: "0px 0px -98% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPhaseChange = useCallback((p: Phase, id: string | null) => {
    setPhase(p);
    setOpenId(id);
  }, []);
  const close = useCallback(() => {
    setDetailOpen(false);
    setRequestedId(null);
  }, []);
  const openDetail = useCallback(() => setDetailOpen(true), []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);

  // The panel only belongs to an open container; picking another closes it.
  useEffect(() => {
    if (phase !== "open") setDetailOpen(false);
  }, [phase, requestedId]);

  // Camera makes room for the panel (read by the 3D CameraRig every frame).
  useEffect(() => {
    gsap.to(heroState, { panel: detailOpen ? 1 : 0, duration: 1.1, ease: "power3.inOut" });
  }, [detailOpen]);
  const onReady = useCallback(() => setSceneReady(true), []);

  /** Open a container from anywhere on the page (scrolls back up first). */
  const openFromAnywhere = useCallback((id: string | null) => {
    if (window.scrollY < 8) return setRequestedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => setRequestedId(id), 750);
  }, []);

  /** Navbar: close any open project, then scroll to a section. */
  const scrollToSection = useCallback((sectionId: string) => {
    setRequestedId(null);
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), requested.current ? 900 : 0);
  }, []);

  /** "Next container" in the panel: the crane returns this one and fetches the next. */
  const openNext = useCallback(() => {
    const i = PROJECTS.findIndex((p) => p.id === requested.current);
    setDetailOpen(false);
    setRequestedId(PROJECTS[(i + 1) % PROJECTS.length].id);
  }, []);

  // Always start at the top, wait for fonts, never hang on the loader.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.fonts?.ready.then(() => setFontsReady(true)).catch(() => setFontsReady(true));
    const failsafe = window.setTimeout(() => {
      setFontsReady(true);
      setSceneReady(true);
    }, 7000);
    return () => window.clearTimeout(failsafe);
  }, []);

  // Lock page scrolling while the loader is up or a project is being shown.
  const projectActive = phase !== "idle";
  useEffect(() => {
    document.documentElement.style.overflow = started && !projectActive ? "" : "hidden";
  }, [started, projectActive]);

  // Esc closes the open container.
  useEffect(() => {
    // (The image lightbox handles its own Esc first and marks the event as handled.)
    // Esc steps back one level: panel → container → pile.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (detailRef.current) setDetailOpen(false);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Intro choreography once the loader leaves.
  useGSAP(
    () => {
      if (!started) return;
      if (prefersReducedMotion()) {
        // Reduced motion: no dolly or letter animation, and crane moves play faster.
        heroState.intro = 1;
        gsap.globalTimeline.timeScale(1.8);
        return;
      }
      gsap.to(heroState, { intro: 1, duration: 2.6, ease: "power3.out" });
      gsap.from(".backdrop-letter", { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.055, delay: 0.35 });
      gsap.from(".reveal", { autoAlpha: 0, y: -8, duration: 0.8, stagger: 0.08, delay: 1.1 });
    },
    { scope: root, dependencies: [started] }
  );

  // Scroll: the hero is pinned (sticky) for ~1.6 screens while the camera rises,
  // the PORTFOLIO word lifts away and the small UI fades.
  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: track.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          heroState.scroll = self.progress;
          if (self.progress > 0.15 && requested.current) setRequestedId(null);
        },
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: track.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
        })
        .to(".backdrop-word", { yPercent: -70, scale: 0.84, opacity: 0.12, ease: "none" }, 0)
        .to(".hud-fade", { autoAlpha: 0, y: -12, ease: "none", duration: 0.35 }, 0);
    },
    { scope: root }
  );

  return (
    <main ref={root} className="relative w-full bg-[color:var(--harbor)]">
      <a
        href="#manifest"
        className="sr-only z-[70] rounded-full bg-white px-4 py-2 font-semibold text-[color:var(--harbor)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to the project list
      </a>
      <h1 className="sr-only">{SITE.name} — portfolio of projects, shown as an interactive 3D container depot</h1>
      <Loader ready={sceneReady && fontsReady} onDone={() => setStarted(true)} />

      {/* Scroll track: tall box; the hero inside it sticks to the screen. */}
      <div ref={track} className="relative h-[260vh]">
        <div className="sticky top-0 h-dvh w-full overflow-hidden">
          <Backdrop />

          <div className="absolute inset-0 z-10">
            <Experience
              requestedId={requestedId}
              openId={openId}
              phase={phase}
              hoveredId={hoveredId}
              started={started}
              onHover={setHoveredId}
              onSelect={setRequestedId}
              onPhaseChange={onPhaseChange}
              onExplore={openDetail}
              onCloseContainer={close}
              onBackgroundClick={() => (detailRef.current ? closeDetail() : close())}
              onReady={onReady}
              active={heroVisible}
            />
          </div>

          <CinemaOverlay />
          <Navbar onScrollTo={scrollToSection} onHome={() => openFromAnywhere(null)} />
          <Hud phase={phase} openId={openId} hoveredId={hoveredId} onClose={close} detailOpen={detailOpen} />
        </div>
      </div>

      <ProjectPanel
        project={projectById(openId) ?? null}
        open={detailOpen && phase === "open"}
        onClose={closeDetail}
        onNext={openNext}
      />
      <Manifest onOpen={openFromAnywhere} />
      <AboutContact />
    </main>
  );
}
