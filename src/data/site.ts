/**
 * Site-wide settings: your name, copy for the hero and footer, and the
 * shared types for where containers sit in the 3D pile.
 */

export const SITE = {
  name: "Monalisa Padhi",
  /** Short wordmark shown in the top-left corner. */
  wordmark: "monalisa",
  caption: "Monalisa Padhi · Project depot · 7 containers · 2026",
  /** One line under the hero. Edit freely. */
  tagline: "Strategy, numbers and stories, packed into seven containers.",
  /** About section below the project list. */
  about: [
    "I'm an MBA candidate at Masters Union with three years of experience as an accountant.",
    "I like problems where the numbers and the story have to agree: brand launches, product pitches, case competitions and operations fixes. Each container in the depot holds one of them.",
  ],
  email: "mona.padhi2001@gmail.com",
  socials: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/monalisa-padhiib" },
  ],
};

/**
 * The site's public address, used for SEO (canonical URL, sitemap, share
 * images). On Vercel it is filled in automatically; set NEXT_PUBLIC_SITE_URL
 * if you add your own domain.
 */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SEO = {
  title: "Monalisa Padhi — Portfolio",
  description:
    "Monalisa Padhi's portfolio: MBA candidate at Masters Union with an accounting background. Seven projects, each in its own shipping container in an interactive 3D depot.",
  keywords: ["Monalisa Padhi", "portfolio", "MBA", "Masters Union", "finance", "strategy", "case competition"],
};

/** Top navigation links → the id of a section on the page. */
export const NAV_LINKS: { label: string; target: string }[] = [
  { label: "Projects", target: "manifest" },
  { label: "About", target: "about" },
  { label: "Contact", target: "contact" },
];

// ---- Pile layout ------------------------------------------------------------

export type ContainerSlot = {
  /** Resting centre position in the pile [x, y, z]. */
  position: [number, number, number];
  /** Resting tilt [x, y, z] in radians, so the pile looks tumbled. */
  rotation: [number, number, number];
};

/** Which pile arrangement fits the current screen. */
export type Layout = "wide" | "tall";

export function slotFor(item: { slot: ContainerSlot; slotTall: ContainerSlot }, layout: Layout) {
  return layout === "tall" ? item.slotTall : item.slot;
}
