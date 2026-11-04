"use client";

import { NAV_LINKS, SITE } from "@/data/site";

type Props = {
  /** Scroll to a section of the page by its id. */
  onScrollTo: (sectionId: string) => void;
  /** Wordmark click: close any open project and go back to the top. */
  onHome: () => void;
};

/** Top bar: wordmark, section links and a "Let's Talk" shortcut. */
export function Navbar({ onScrollTo, onHome }: Props) {
  return (
    <header className="reveal pointer-events-auto absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
      <button
        onClick={onHome}
        className="whitespace-nowrap font-display text-xl leading-none tracking-tight text-white md:text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        aria-label={`${SITE.name}, back to the top`}
      >
        {SITE.wordmark}
      </button>

      <nav className="hidden gap-8 md:flex" aria-label="Sections">
        {NAV_LINKS.map((link) => (
          <button
            key={link.target}
            onClick={() => onScrollTo(link.target)}
            className="text-[13px] font-medium text-white opacity-75 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {link.label}
          </button>
        ))}
      </nav>

      <button
        onClick={() => onScrollTo("contact")}
        className="whitespace-nowrap text-[13px] font-medium text-white/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Let&apos;s Talk ↗
      </button>
    </header>
  );
}
