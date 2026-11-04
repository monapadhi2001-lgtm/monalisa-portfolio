"use client";

import { useEffect, useState } from "react";
import type { CaseStudy } from "@/data/projects";
import { textOn } from "@/lib/media";

/**
 * A PDF case study.
 *  - Desktop: the browser's own PDF viewer inside the panel (zoom, pages, search).
 *  - Phones/tablets (which can't show PDFs inline reliably): the cover image
 *    with "Open PDF". Both get Open and Download buttons.
 */
export function PdfViewer({ doc, accent }: { doc: CaseStudy; accent: string }) {
  const [inline, setInline] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Inline PDFs work in desktop browsers with a fine pointer.
    setInline(window.matchMedia("(pointer: fine) and (min-width: 768px)").matches);
  }, []);

  const sameSite = doc.src.startsWith("/");

  return (
    <article className="overflow-hidden rounded-xl border border-white/12 bg-[#11182f]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h4 className="m-0 flex items-center gap-2 text-[14px] font-semibold text-white">
            <span className="rounded bg-white/12 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-white/80">PDF</span>
            <span className="truncate">{doc.title}</span>
          </h4>
          {(doc.description || doc.pages) && (
            <p className="mt-1 text-[12px] text-white/60">
              {doc.description}
              {doc.pages ? ` ${doc.description ? "· " : ""}${doc.pages} pages` : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={doc.src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: accent, color: textOn(accent) }}
          >
            Open PDF ↗
          </a>
          {sameSite && (
            <a
              href={doc.src}
              download
              className="inline-flex min-h-9 items-center rounded-full border border-white/25 px-4 py-2 text-[12px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            >
              Download
            </a>
          )}
        </div>
      </header>

      {inline ? (
        show ? (
          <iframe src={`${doc.src}#view=FitH`} title={doc.title} className="block h-[560px] w-full border-0 bg-white" />
        ) : (
          <button
            onClick={() => setShow(true)}
            className="group relative block aspect-[16/9] w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-white"
            aria-label={`Read ${doc.title} here`}
          >
            {doc.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.cover} alt="" className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90" />
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="rounded-full bg-black/65 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm">
                Read the case study here
              </span>
            </span>
          </button>
        )
      ) : (
        doc.cover && (
          <a href={doc.src} target="_blank" rel="noopener noreferrer" className="block aspect-[16/9] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doc.cover} alt={`Cover of ${doc.title}`} className="h-full w-full object-cover" />
          </a>
        )
      )}
    </article>
  );
}
