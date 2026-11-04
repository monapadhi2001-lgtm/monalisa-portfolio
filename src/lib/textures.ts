import * as THREE from "three";

/**
 * Procedural textures, drawn on a <canvas> at runtime.
 * No image files to download — the corrugated steel and the stencil
 * lettering are both generated in code.
 */

// ---------- Corrugated steel -------------------------------------------------

/** Height of one corrugation ridge at position t (0..1): a trapezoid wave. */
function ridgeHeight(t: number) {
  if (t < 0.15) return 1;
  if (t < 0.35) return 1 - (t - 0.15) / 0.2;
  if (t < 0.65) return 0;
  if (t < 0.85) return (t - 0.65) / 0.2;
  return 1;
}

let corrugationCanvases: { color: HTMLCanvasElement; normal: HTMLCanvasElement } | null = null;

function getCorrugationCanvases() {
  if (corrugationCanvases) return corrugationCanvases;
  const w = 128;
  const h = 4;
  const color = document.createElement("canvas");
  const normal = document.createElement("canvas");
  color.width = normal.width = w;
  color.height = normal.height = h;
  const cctx = color.getContext("2d")!;
  const nctx = normal.getContext("2d")!;

  for (let x = 0; x < w; x++) {
    const t = x / w;
    const height = ridgeHeight(t);
    // Shade grooves slightly darker so the ridges read even in flat light.
    const shade = Math.round(255 * (0.84 + 0.16 * height));
    cctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    cctx.fillRect(x, 0, 1, h);

    // Normal from the slope of the profile.
    const slope = (ridgeHeight(t + 1 / w) - ridgeHeight(t - 1 / w)) * (w / 2);
    const nx = -slope * 0.06;
    const len = Math.hypot(nx, 1);
    const r = Math.round(((nx / len) * 0.5 + 0.5) * 255);
    const b = Math.round(((1 / len) * 0.5 + 0.5) * 255);
    nctx.fillStyle = `rgb(${r},128,${b})`;
    nctx.fillRect(x, 0, 1, h);
  }
  corrugationCanvases = { color, normal };
  return corrugationCanvases;
}

const corrugationCache = new Map<number, { map: THREE.Texture; normalMap: THREE.Texture }>();

/** Returns a colour map + normal map with `ridges` vertical ridges across a face. */
export function getCorrugation(ridges: number) {
  const cached = corrugationCache.get(ridges);
  if (cached) return cached;
  const { color, normal } = getCorrugationCanvases();
  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(ridges, 1);
    tex.anisotropy = 4;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const result = { map: make(color, true), normalMap: make(normal, false) };
  corrugationCache.set(ridges, result);
  return result;
}

// ---------- Stencil lettering ------------------------------------------------

/** Reads the next/font family name from a CSS variable set in layout.tsx. */
function cssFont(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

/**
 * Creates a transparent texture and draws on it with `draw`.
 * It draws once immediately, then again once web fonts have loaded,
 * so the lettering always ends up in the right typeface.
 */
function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  fontToWaitFor?: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    texture.needsUpdate = true;
  };
  paint();
  if (fontToWaitFor && document.fonts) {
    document.fonts.load(fontToWaitFor).then(paint).catch(() => {});
  }
  return texture;
}

/** Big white label like "WHAT\nI DO", with a soft grey drop shadow. */
export function makeLabelTexture(label: string) {
  const family = cssFont("--font-archivo", "Impact, 'Arial Black', sans-serif");
  const font = `400 150px ${family}`;
  return makeCanvasTexture(
    1024,
    810, // same aspect ratio as one door
    (ctx, w) => {
      ctx.font = font;
      ctx.textBaseline = "top";
      const lines = label.split("\n");
      lines.forEach((line, i) => {
        const x = 56;
        const y = 64 + i * 150;
        ctx.fillStyle = "rgba(40, 40, 50, 0.45)";
        ctx.fillText(line, x + 9, y + 9, w - 100);
        ctx.fillStyle = "#f7f4ee";
        ctx.fillText(line, x, y, w - 100);
      });
    },
    font
  );
}

/** Small container ID like "PD-03" for the bottom-right corner. */
export function makeCodeTexture(code: string) {
  const family = cssFont("--font-jetbrains", "ui-monospace, monospace");
  const font = `700 64px ${family}`;
  return makeCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.font = font;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(code, w - 24, h / 2);
    },
    font
  );
}
