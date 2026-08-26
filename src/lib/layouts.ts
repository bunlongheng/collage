import type { Background, Layout, TextPreset } from "./types";

/**
 * Every layout is expressed as fractional cells (0..1) so the on-screen
 * canvas and the exported PNG share one geometry - no drift between preview
 * and output.
 */
export const LAYOUTS: Layout[] = [
  {
    id: "single",
    name: "Single",
    aspect: [4, 5],
    cells: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: "duo-v",
    name: "Side by side",
    aspect: [4, 5],
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: "duo-h",
    name: "Stacked",
    aspect: [4, 5],
    cells: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: "trio",
    name: "Feature",
    aspect: [4, 5],
    cells: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  {
    id: "grid-4",
    name: "Quad",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: "thirds",
    name: "Thirds",
    aspect: [4, 5],
    cells: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
  },
  {
    id: "story",
    name: "Story",
    aspect: [9, 16],
    cells: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: "story-split",
    name: "Story split",
    aspect: [9, 16],
    cells: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 1, h: 0.4 },
    ],
  },
];

export function getLayout(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export const BACKGROUNDS: Background[] = [
  { id: "paper", name: "Paper", color: "#f6f2ea" },
  { id: "ink", name: "Ink", color: "#17140f" },
  { id: "snow", name: "Snow", color: "#ffffff" },
  { id: "accent", name: "Ember", color: "#dd3f22" },
  { id: "sage", name: "Sage", color: "#c7d0bd" },
];

export function getBackground(id: string): Background {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/**
 * Text presets. Each maps to a concrete font stack, weight and default color
 * so "add text" produces something that already looks designed. The same
 * definitions drive both the DOM overlay and the canvas export.
 */
export type PresetStyle = {
  label: string;
  fontFamily: string;
  weight: number;
  italic: boolean;
  tracking: number; // em
  uppercase: boolean;
  /** Default size as a fraction of canvas height. */
  size: number;
  color: string;
  pill?: boolean;
};

export const TEXT_PRESETS: Record<TextPreset, PresetStyle> = {
  headline: {
    label: "Headline",
    fontFamily: "var(--font-fraunces), Georgia, serif",
    weight: 600,
    italic: false,
    tracking: -0.01,
    uppercase: false,
    size: 0.11,
    color: "#fffaf5",
  },
  caption: {
    label: "Caption",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    weight: 600,
    italic: false,
    tracking: 0.22,
    uppercase: true,
    size: 0.035,
    color: "#fffaf5",
  },
  sticker: {
    label: "Sticker",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    weight: 700,
    italic: false,
    tracking: 0.01,
    uppercase: false,
    size: 0.05,
    color: "#150b07",
    pill: true,
  },
  signature: {
    label: "Signature",
    fontFamily: "var(--font-fraunces), Georgia, serif",
    weight: 500,
    italic: true,
    tracking: 0,
    uppercase: false,
    size: 0.06,
    color: "#fffaf5",
  },
};

/** The font family strings used above, for canvas export font readiness. */
export const EXPORT_FONT_FAMILIES = [
  "var(--font-fraunces)",
  "var(--font-geist-sans)",
];
