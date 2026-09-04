import { fitSize } from "./geometry";
import type { CollageState, Layout, Photo, Rect } from "./types";

/** Longest edge of the exported image when no display preset is chosen. */
export const LONG_EDGE = 2160;

export type SizeIcon = "collage" | "screen" | "laptop" | "monitor" | "phone" | "tablet";
export type SizePreset = { id: string; name: string; w: number; h: number; icon: SizeIcon };

/** Built-in export sizes. "auto" is the layout's own aspect at LONG_EDGE. */
export const SIZES: SizePreset[] = [
  { id: "auto", name: "Collage", w: 0, h: 0, icon: "collage" },
  { id: "macbook", name: "MacBook", w: 2560, h: 1600, icon: "laptop" },
  { id: "monitor-4k", name: "4K monitor", w: 3840, h: 2160, icon: "monitor" },
  { id: "monitor-portrait", name: "Portrait monitor", w: 1440, h: 2560, icon: "monitor" },
  { id: "iphone", name: "iPhone wallpaper", w: 1290, h: 2796, icon: "phone" },
  { id: "ipad", name: "iPad wallpaper", w: 2048, h: 2732, icon: "tablet" },
];

/** The display this page is on, in device pixels (null during SSR). */
export function screenPreset(): SizePreset | null {
  if (typeof window === "undefined") return null;
  const d = window.devicePixelRatio || 1;
  return { id: "screen", name: "This screen", w: Math.round(screen.width * d), h: Math.round(screen.height * d), icon: "screen" };
}

/** Pixel size of the layout's native export (longest edge = LONG_EDGE). */
export function exportSize(layout: Layout): { w: number; h: number } {
  const [aw, ah] = layout.aspect;
  const scale = LONG_EDGE / Math.max(aw, ah);
  return { w: Math.round(aw * scale), h: Math.round(ah * scale) };
}

/** Output pixel size for a size preset id, falling back to the layout's own. */
export function resolveSize(sizeId: string, layout: Layout): { w: number; h: number } {
  if (sizeId === "screen") {
    const s = screenPreset();
    if (s) return { w: s.w, h: s.h };
  }
  const p = SIZES.find((s) => s.id === sizeId);
  return p && p.w ? { w: p.w, h: p.h } : exportSize(layout);
}

/** Gap, corner radius and edge inset for a W x H canvas, all in its pixels.
 * Cells are inset by half a gap on every side, so the edge margin gets another
 * half to match the spacing between cells. */
export function metrics(state: CollageState, W: number, H: number) {
  const minD = Math.min(W, H);
  const gapPx = (state.gap / 100) * minD * 0.12;
  const radiusPx = (state.radius / 100) * minD * 0.12;
  const inset = (state.safe / 100) * minD * 0.2 + gapPx / 2;
  return { gapPx, radiusPx, inset };
}

/** Largest scale (<= 1) of the collage at export size at which no placed photo
 * has to be upscaled - the source of blur. 1 means every photo has pixels to
 * spare; smaller means the collage shrinks (centered) to stay sharp. */
export function nativeScale(state: CollageState, layout: Layout, cellPhotos: (Photo | undefined)[]): number {
  const { w: W, h: H } = resolveSize(state.sizeId, layout);
  const { gapPx, inset } = metrics(state, W, H);
  const box = contentBox(layout, W - inset * 2, H - inset * 2);
  let k = 1;
  layout.cells.forEach((c, i) => {
    const p = cellPhotos[i];
    if (!p?.width || !p.height) return;
    const cw = c.w * box.w - gapPx;
    const ch = c.h * box.h - gapPx;
    if (cw <= 0 || ch <= 0) return;
    const need = Math.max(cw / p.width, ch / p.height); // > 1 = upscaling
    if (need > 1) k = Math.min(k, 1 / need);
  });
  return k;
}

/** Where the layout goes inside a W x H canvas: it keeps its own aspect and
 * sits centered, scaled by `k` (see nativeScale), so a display export never
 * stretches or blurs the cells - the background color fills the rest. */
export function contentBox(layout: Layout, W: number, H: number, k = 1): Rect {
  const [aw, ah] = layout.aspect;
  const fit = fitSize(aw, ah, W, H);
  const w = Math.round(fit.w * k);
  const h = Math.round(fit.h * k);
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}
