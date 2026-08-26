/** Photo filters. The `css` string is used verbatim for both the on-screen
 * CSS `filter` and the canvas `ctx.filter` on export, so preview == output. */
export type Filter = { id: string; label: string; css: string };

export const FILTERS: Filter[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "warm", label: "Warm", css: "sepia(0.3) saturate(1.35) brightness(1.05) hue-rotate(-8deg)" },
  { id: "cold", label: "Cold", css: "saturate(1.1) brightness(1.02) hue-rotate(12deg) contrast(1.05)" },
  { id: "dream", label: "Dream", css: "brightness(1.12) saturate(1.25) contrast(0.9)" },
  { id: "dark", label: "Dark", css: "brightness(0.82) contrast(1.3) saturate(1.1)" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.05)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.45) brightness(0.9)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.7) contrast(1.05) brightness(1.02)" },
  { id: "hdr", label: "HDR", css: "contrast(1.3) saturate(1.5) brightness(1.03)" },
  { id: "fade", label: "Fade", css: "contrast(0.88) brightness(1.1) saturate(0.8)" },
];

export function filterCss(id: string | undefined): string {
  return FILTERS.find((f) => f.id === id)?.css ?? "none";
}

/** Next/previous filter id when swiping through a cell. */
export function cycleFilter(current: string | undefined, dir: 1 | -1): string {
  const i = Math.max(0, FILTERS.findIndex((f) => f.id === (current ?? "none")));
  const n = (i + dir + FILTERS.length) % FILTERS.length;
  return FILTERS[n].id;
}
