/** Pure geometry helpers shared by the on-screen canvas and the PNG export. */
import type { Clip } from "./types";

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Largest [w,h] with the given aspect that fits inside the available box. */
export function fitSize(
  aw: number,
  ah: number,
  availW: number,
  availH: number
): { w: number; h: number } {
  if (availW <= 0 || availH <= 0 || aw <= 0 || ah <= 0) return { w: 0, h: 0 };
  const scale = Math.min(availW / aw, availH / ah);
  return { w: Math.round(aw * scale), h: Math.round(ah * scale) };
}

/** Source crop for drawing an image into a box with object-fit: cover. */
export function coverCrop(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const ir = imgW / imgH;
  const br = boxW / boxH;
  let sw = imgW;
  let sh = imgH;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = imgH * br;
    sx = (imgW - sw) / 2;
  } else {
    sh = imgW / br;
    sy = (imgH - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

/** CSS clip-path for a cell mask, or undefined for a plain rectangle. */
export function clipCss(clip?: Clip): string | undefined {
  if (!clip) return undefined;
  if (clip === "circle") return "ellipse(50% 50% at 50% 50%)";
  return `polygon(${clip.map(([px, py]) => `${px * 100}% ${py * 100}%`).join(", ")})`;
}
