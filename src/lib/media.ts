/**
 * Small helpers for media: turning YouTube / Vimeo links into embed URLs,
 * thumbnails, and formatting times. Pure functions — easy to test.
 */

/** Accepts a full YouTube URL (watch, youtu.be, shorts, embed) or a bare ID. */
export function youTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Accepts https://vimeo.com/123, https://player.vimeo.com/video/123 or "123". */
export function vimeoId(input: string): string | null {
  const s = input.trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/);
  return m ? m[1] : null;
}

export function youTubeEmbed(id: string, autoplay = true) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`;
}

export function vimeoEmbed(id: string, autoplay = true) {
  return `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0${autoplay ? "&autoplay=1" : ""}`;
}

export const youTubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** 75.4 → "1:15", 3725 → "1:02:05". */
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Hostname for display, e.g. "example.com". */
export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Black or white text, whichever reads better on `hex`. */
export function textOn(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#0b0d13" : "#ffffff";
}
