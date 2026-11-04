"use client";

import { Html } from "@react-three/drei";
import { CONTAINER } from "@/lib/constants";
import { textOn } from "@/lib/media";
import type { Project } from "@/data/projects";

type Props = {
  project: Project;
  visible: boolean;
  onExplore: () => void;
  onClose: () => void;
  /** Phones: the container is smaller on screen, so show fewer, larger items. */
  compact?: boolean;
};

/**
 * The content painted on the dark back wall of an open container, as in the
 * reference: an index line, a headline with one highlighted italic word, tag
 * pills — plus buttons to explore the project's media or close the container.
 * It's real HTML (drei <Html transform>), so it moves with the 3D container
 * but stays sharp and clickable.
 */
export function ContainerContent({ project, visible, onExplore, onClose, compact = false }: Props) {
  const [first, ...rest] = project.title.split(" ");
  const media = [
    project.photos?.length && `${project.photos.length} photos`,
    project.videos?.length && `${project.videos.length} video${project.videos.length > 1 ? "s" : ""}`,
    project.caseStudies?.length && "case study",
  ].filter(Boolean);

  if (compact) {
    return (
      <Html
        transform
        distanceFactor={2}
        position={[0, 0, -CONTAINER.depth / 2 + 0.08]}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <div
          className="flex h-[230px] w-[560px] flex-col justify-end pb-6 text-left text-white transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
        >
          <p className="font-mono text-[18px] font-bold tracking-[0.2em] text-white/70 uppercase">
            {project.code.replace("PD-", "")} / {project.category.split("·")[0].trim()}
          </p>
          <h2 className="mt-2 font-sans text-[64px] leading-[0.95] font-bold tracking-tight">
            {first}{" "}
            <em className="font-semibold" style={{ color: project.color === "#9aa3ae" ? "#c9d0d8" : project.color }}>
              {rest.join(" ")}
            </em>
          </h2>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onExplore}
              className="rounded-full px-7 py-3 text-[24px] font-semibold"
              style={{ background: project.color, color: textOn(project.color) }}
            >
              Explore project →
            </button>
            <button onClick={onClose} className="rounded-full border-2 border-white/40 px-6 py-3 text-[24px] text-white">
              Close
            </button>
          </div>
        </div>
      </Html>
    );
  }

  return (
    <Html
      transform
      distanceFactor={2} // 1 world unit ≈ 200 CSS px before scaling
      position={[0, 0, -CONTAINER.depth / 2 + 0.08]} // on the back wall
      zIndexRange={[10, 0]}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div
        className="flex h-[230px] w-[560px] flex-col justify-end pb-6 text-left text-white transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-white/60 uppercase">
          {project.code.replace("PD-", "")} / {project.label.replace("\n", " ")}
        </p>
        <h2 className="mt-2 font-sans text-[40px] leading-[0.95] font-bold tracking-tight">
          {first}{" "}
          <em className="font-semibold" style={{ color: project.color === "#9aa3ae" ? "#c9d0d8" : project.color }}>
            {rest.join(" ") || ""}
          </em>
        </h2>
        <p className="mt-2 line-clamp-2 max-w-[470px] text-[13px] leading-[1.45] text-white/70">{project.summary}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((t) => (
            <li key={t} className="rounded-full border border-white/35 px-2.5 py-[3px] text-[11px] text-white/90">
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onExplore}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: project.color, color: textOn(project.color) }}
          >
            Explore project →
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-white/35 px-4 py-1.5 text-[12px] text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            Close
          </button>
          {media.length > 0 && (
            <span className="ml-1 font-mono text-[10px] tracking-[0.12em] text-white/45 uppercase">{media.join(" · ")}</span>
          )}
        </div>
      </div>
    </Html>
  );
}
