import type { ContainerSlot } from "./site";

/**
 * ============================================================================
 *  YOUR PROJECTS — one object = one shipping container.
 * ============================================================================
 *
 * The components read everything from here, so adding, removing or editing a
 * project never needs a component change. Every media list is optional:
 * leave it out (or empty) and that section simply doesn't appear.
 *
 * Files go in /public/projects/<project-id>/ and are referenced as
 * "/projects/<project-id>/<file>". The files there now are generated
 * placeholders marked "PLACEHOLDER".
 */

// ---------------------------------------------------------------------------
//  Media types
// ---------------------------------------------------------------------------

/** A photograph or image. Opens in the lightbox. */
export type Photo = {
  src: string;
  alt: string; // describe the image for screen readers
  caption?: string;
};

/**
 * A video. Three sources are supported:
 *   { type: "file",    src: "/projects/x/demo.mp4", poster?: "/projects/x/poster.jpg" }
 *   { type: "youtube", url: "https://www.youtube.com/watch?v=…"  (or youtu.be/…, or just the ID) }
 *   { type: "vimeo",   url: "https://vimeo.com/123456789"        (or just the ID) }
 */
export type Video =
  | { type: "file"; src: string; poster?: string; title: string; duration?: string }
  | { type: "youtube"; url: string; title: string; poster?: string; duration?: string }
  | { type: "vimeo"; url: string; title: string; poster?: string; duration?: string };

/**
 * A live website. The page is shown in an iframe when the site allows it;
 * if it refuses to be embedded, the screenshot (or a message) is shown
 * instead, with a button to open the site in a new tab.
 */
export type Website = {
  title: string;
  url?: string; // leave empty until the site is public → "Coming soon"
  /** Screenshot used as the fallback (and while the live page loads). */
  screenshot?: string;
  /** Set to false to always show the screenshot instead of trying an iframe. */
  embed?: boolean;
};

/** A PDF case study, deck or report. */
export type CaseStudy = {
  title: string;
  src: string; // "/projects/x/case-study.pdf" or an https:// link
  description?: string;
  pages?: number;
  /** Optional cover image shown on phones (which can't show PDFs inline). */
  cover?: string;
};

export type ProjectLink = { label: string; url: string };

export type Project = {
  id: string; // also the media folder name
  code: string; // painted on the right door, e.g. "PD-01"
  label: string; // stencil on the left door, "\n" = new line
  title: string;
  category: string;
  year: string;
  role: string;
  summary: string; // one sentence for the container + list
  description: string[]; // paragraphs in the panel
  tags: string[];
  color: string; // container paint + accent colour
  photos?: Photo[];
  videos?: Video[];
  websites?: Website[];
  /** Extra website screenshots shown as a strip (open in the lightbox). */
  screenshots?: Photo[];
  caseStudies?: CaseStudy[];
  links?: ProjectLink[];
  /** Where it rests in the pile on wide screens and on phones. */
  slot: ContainerSlot;
  slotTall: ContainerSlot;
};

// ---------------------------------------------------------------------------
//  Placeholder content (delete once your real content is in)
// ---------------------------------------------------------------------------

/** Paths to the generated placeholder files for project number n. */
function placeholderMedia(n: number) {
  const id = `project-${String(n).padStart(2, "0")}`;
  const f = (name: string) => `/projects/${id}/${name}`;
  return {
    photos: [1, 2, 3, 4].map((i) => ({
      src: f(`photo-${i}.jpg`),
      alt: `Project ${n}, placeholder photo ${i}`,
      caption: `Photo ${i} (placeholder)`,
    })),
    videos: [
      { type: "file", src: f("clip-1.mp4"), poster: f("photo-1.jpg"), title: "Walkthrough (placeholder)", duration: "0:06" },
      { type: "file", src: f("clip-2.mp4"), poster: f("photo-2.jpg"), title: "Behind the scenes (placeholder)", duration: "0:06" },
    ] as Video[],
    websites: [{ title: "Project website", url: "", screenshot: f("site-1.jpg") }] as Website[],
    screenshots: [1, 2].map((i) => ({
      src: f(`site-${i}.jpg`),
      alt: `Project ${n}, website screenshot ${i}`,
      caption: `Screenshot ${i} (placeholder)`,
    })),
    caseStudies: [
      { title: "Case study", src: f("case-study.pdf"), pages: 3, cover: f("photo-1.jpg"), description: "Placeholder PDF — replace with your deck or report." },
    ] as CaseStudy[],
  };
}

/** Shared placeholder text, so each container below only sets what differs. */
function placeholderProject(n: number) {
  const num = String(n).padStart(2, "0");
  return {
    id: `project-${num}`,
    code: `PD-${num}`,
    label: `PROJECT\n${num}`,
    title: `Project ${num}`,
    category: "Category · Type",
    year: "2026",
    role: "Your role",
    summary: "One sentence about this project. It appears inside the open container and in the list.",
    description: [
      "Describe the problem, who it was for and why it mattered.",
      "Then what you did and what happened as a result. Two or three short paragraphs work best.",
    ],
    tags: ["Tag one", "Tag two", "Tag three"],
    ...placeholderMedia(n),
  };
}

// ---------------------------------------------------------------------------
//  The seven containers
// ---------------------------------------------------------------------------

export const PROJECTS: Project[] = [
  {
    // Project 01 shows every media type, including live YouTube / Vimeo
    // embeds and two websites: one that allows embedding, one that doesn't.
    ...placeholderProject(1),
    color: "#e2361f",
    videos: [
      ...placeholderMedia(1).videos,
      { type: "youtube", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "YouTube embed (sample — replace)" },
      { type: "vimeo", url: "https://vimeo.com/1084537", title: "Vimeo embed (sample — replace)" },
    ],
    websites: [
      { title: "Embeddable site (sample)", url: "https://example.com", screenshot: "/projects/project-01/site-1.jpg" },
      { title: "Site that blocks embedding (sample)", url: "https://www.google.com", screenshot: "/projects/project-01/site-2.jpg" },
    ],
    links: [{ label: "Open the project", url: "https://example.com" }],
    slot: { position: [-3.4, -0.92, -0.4], rotation: [0.03, 0.14, 0.1] },
    slotTall: { position: [-3.2, -0.92, -0.4], rotation: [0.03, 0.1, 0.08] },
  },
  {
    ...placeholderProject(2),
    color: "#2342c4",
    slot: { position: [-1.7, -2.25, 0.6], rotation: [0, -0.08, 0] },
    slotTall: { position: [0, -2.25, 0.6], rotation: [0, -0.05, 0] },
  },
  {
    ...placeholderProject(3),
    color: "#f2b21b",
    slot: { position: [1.6, -2.25, 0.6], rotation: [0, 0.1, -0.03] },
    slotTall: { position: [3.3, -2.25, 0.6], rotation: [0, -0.1, -0.03] },
  },
  {
    ...placeholderProject(4),
    color: "#e2361f",
    slot: { position: [-0.1, -0.9, -0.4], rotation: [0, 0.05, -0.04] },
    slotTall: { position: [0, 0.4, -1.2], rotation: [0, 0.06, 0.05] },
  },
  {
    ...placeholderProject(5),
    color: "#2342c4",
    slot: { position: [3.2, -0.92, -0.4], rotation: [0, -0.12, -0.1] },
    slotTall: { position: [0.1, -0.92, -0.4], rotation: [0, -0.06, -0.04] },
  },
  {
    ...placeholderProject(6),
    color: "#f2711c",
    slot: { position: [-5.0, -2.25, 0.6], rotation: [0, 0.18, 0.05] },
    slotTall: { position: [-3.3, -2.25, 0.6], rotation: [0, 0.08, 0.04] },
  },
  {
    ...placeholderProject(7),
    color: "#9aa3ae",
    slot: { position: [4.9, -2.2, 0.6], rotation: [0, -0.22, -0.05] },
    slotTall: { position: [3.2, -0.92, -0.4], rotation: [0, -0.14, -0.07] },
  },
];

export const projectById = (id: string | null) => PROJECTS.find((p) => p.id === id);
