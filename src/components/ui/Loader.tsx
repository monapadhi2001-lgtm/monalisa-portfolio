"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SITE } from "@/data/site";

type Props = {
  /** True once fonts are loaded and the 3D scene has drawn its first frames. */
  ready: boolean;
  /** Called the moment the loader starts leaving, so the intro can begin. */
  onDone: () => void;
};

/**
 * Loading screen: a counter and a little container riding a crane rail.
 * It counts quickly to 88%, waits for the scene to be ready, finishes to
 * 100% and then slides up like a shutter door.
 */
export function Loader({ ready, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const cart = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const progress = useRef({ v: 0 });
  const firstLeg = useRef<Promise<void> | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const paint = () => {
    const v = progress.current.v;
    if (counter.current) counter.current.textContent = String(Math.round(v)).padStart(3, "0");
    if (cart.current) cart.current.style.left = `${v}%`;
    if (fill.current) fill.current.style.transform = `scaleX(${v / 100})`;
  };

  useGSAP(
    () => {
      firstLeg.current = new Promise<void>((resolve) => {
        gsap.to(progress.current, { v: 88, duration: 1.6, ease: "power2.out", onUpdate: paint, onComplete: resolve });
      });
    },
    { scope: root }
  );

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    firstLeg.current?.then(() => {
      if (cancelled || !root.current) return;
      gsap
        .timeline()
        .to(progress.current, { v: 100, duration: 0.5, ease: "power1.inOut", onUpdate: paint })
        .add(() => doneRef.current())
        .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" })
        .set(root.current, { display: "none" });
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return (
    <div
      ref={root}
      role="status"
      aria-label="Loading portfolio"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-[color:var(--harbor)] px-6"
    >
      {/* Shutter edge, like the bottom of a roller door */}
      <div className="absolute inset-x-0 bottom-0 h-3 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0_2px,transparent_2px_10px)]" />

      <p className="font-mono text-[11px] tracking-[0.24em] text-white/90 uppercase">
        Unloading cargo · {SITE.name}
      </p>

      <span
        ref={counter}
        className="font-display text-[28vw] leading-[0.8] tracking-[-0.05em] text-[color:var(--cream)] tabular-nums md:text-[16vw]"
      >
        000
      </span>

      {/* Crane rail with a tiny container riding along it */}
      <div className="relative h-8 w-[min(520px,80vw)]">
        <div className="absolute inset-x-0 top-1 h-[3px] rounded-full bg-white/25" />
        <div ref={fill} className="absolute inset-x-0 top-1 h-[3px] origin-left scale-x-0 rounded-full bg-white" />
        <div ref={cart} className="absolute top-0 left-0 -translate-x-1/2">
          <div className="mx-auto h-2 w-[2px] bg-white/80" />
          <div className="h-4 w-9 rounded-[2px] bg-[repeating-linear-gradient(90deg,#e2361f_0_3px,#c42c18_3px_5px)] shadow-md" />
        </div>
      </div>
    </div>
  );
}
