import type { Background, Clip, FontKey, Layout, Rect, TextPreset } from "./types";

const DIAMOND: Clip = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const HEX: Clip = [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]];

/** Isometric cube of width `w` at (x, y): top face (rhombus), then the left and right faces. */
function cube(x: number, y: number, w: number): Rect[] {
  const h = (w * 8) / 7;
  return [
    { x, y, w, h: h / 2, clip: DIAMOND },
    { x, y: y + h / 4, w: w / 2, h: (h * 3) / 4, clip: [[0, 0], [1, 1 / 3], [1, 1], [0, 2 / 3]] },
    { x: x + w / 2, y: y + h / 4, w: w / 2, h: (h * 3) / 4, clip: [[0, 1 / 3], [1, 0], [1, 2 / 3], [0, 1]] },
  ];
}

/** `n` circles of diameter `d` evenly spaced on a ring of radius `r` around the center. */
function ring(n: number, d: number, r: number): Rect[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: 0.5 + r * Math.cos(a) - d / 2, y: 0.5 + r * Math.sin(a) - d / 2, w: d, h: d, clip: "circle" };
  });
}

/**
 * Every layout is expressed as fractional cells (0..1) so the on-screen
 * canvas and the exported PNG share one geometry - no drift between preview
 * and output.
 */
export const LAYOUTS: Layout[] = [
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
    id: "hero-right",
    name: "Hero Right",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 },
    ],
  },
  {
    id: "hero-top",
    name: "Hero Top",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 1 / 3, h: 0.4 },
      { x: 1 / 3, y: 0.6, w: 1 / 3, h: 0.4 },
      { x: 2 / 3, y: 0.6, w: 1 / 3, h: 0.4 },
    ],
  },
  {
    id: "magazine",
    name: "Magazine",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 1, h: 0.4 },
      { x: 0, y: 0.4, w: 0.5, h: 0.6 },
      { x: 0.5, y: 0.4, w: 0.5, h: 0.6 },
    ],
  },
  {
    id: "mosaic",
    name: "Mosaic",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 2 / 3, h: 2 / 3 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 2 / 3, h: 1 / 3 },
    ],
  },
  {
    id: "center-stage",
    name: "Center Stage",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 1 / 3, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.3 },
      { x: 2 / 3, y: 0.3, w: 1 / 3, h: 0.7 },
    ],
  },
  {
    id: "film-strip",
    name: "Film Strip",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 1, h: 0.25 },
      { x: 0, y: 0.25, w: 1, h: 0.25 },
      { x: 0, y: 0.5, w: 1, h: 0.25 },
      { x: 0, y: 0.75, w: 1, h: 0.25 },
    ],
  },
  {
    id: "four-columns",
    name: "Four Columns",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.25, h: 1 },
      { x: 0.25, y: 0, w: 0.25, h: 1 },
      { x: 0.5, y: 0, w: 0.25, h: 1 },
      { x: 0.75, y: 0, w: 0.25, h: 1 },
    ],
  },
  {
    id: "cross",
    name: "Cross",
    aspect: [1, 1],
    cells: [
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
  },
  {
    id: "staircase",
    name: "Staircase",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.25 },
      { x: 0.5, y: 0.25, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.75, w: 0.5, h: 0.25 },
    ],
  },
  {
    id: "shifted-thirds",
    name: "Shifted Thirds",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 2 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 2 / 3, h: 0.5 },
    ],
  },
  {
    id: "focus-frame",
    name: "Focus Frame",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.25, h: 0.55 },
      { x: 0.25, y: 0, w: 0.75, h: 0.28 },
      { x: 0.25, y: 0.28, w: 0.5, h: 0.46 },
      { x: 0, y: 0.55, w: 0.25, h: 0.45 },
      { x: 0.25, y: 0.74, w: 0.75, h: 0.26 },
    ],
  },
  {
    id: "tall-center",
    name: "Tall Center",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.28, h: 0.5 },
      { x: 0, y: 0.5, w: 0.28, h: 0.5 },
      { x: 0.28, y: 0, w: 0.44, h: 1 },
      { x: 0.72, y: 0, w: 0.28, h: 0.45 },
      { x: 0.72, y: 0.45, w: 0.28, h: 0.55 },
    ],
  },
  {
    id: "panorama",
    name: "Panorama",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
  },
  {
    id: "offset-blocks",
    name: "Offset Blocks",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 2 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.75 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.75, w: 1 / 3, h: 0.25 },
    ],
  },
  {
    id: "six-grid",
    name: "Six Grid",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
    ],
  },
  {
    id: "brick-wall",
    name: "Brick Wall",
    aspect: [1, 1],
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 0, w: 0.5, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 0.25, h: 1 / 3 },
      { x: 0.25, y: 1 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.75, y: 1 / 3, w: 0.25, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 },
    ],
  },
  {
    id: "flower",
    name: "Flower",
    aspect: [1, 1],
    cells: [
      { x: 0.35, y: 0.02, w: 0.3, h: 0.3, clip: "circle" },
      { x: 0.02, y: 0.35, w: 0.3, h: 0.3, clip: "circle" },
      { x: 0.36, y: 0.36, w: 0.28, h: 0.28, clip: "circle" },
      { x: 0.68, y: 0.35, w: 0.3, h: 0.3, clip: "circle" },
      { x: 0.35, y: 0.68, w: 0.3, h: 0.3, clip: "circle" },
    ],
  },
  {
    id: "photo-ring",
    name: "Photo Ring",
    aspect: [1, 1],
    cells: ring(5, 0.3, 0.33),
  },
  {
    id: "soft-stack",
    name: "Soft Stack",
    aspect: [1, 1],
    cells: [
      { x: 0.08, y: 0.06, w: 0.5, h: 0.5, clip: "circle" },
      { x: 0.46, y: 0.3, w: 0.46, h: 0.46, clip: "circle" },
      { x: 0.18, y: 0.44, w: 0.5, h: 0.5, clip: "circle" },
    ],
  },
  {
    id: "photo-cube",
    name: "Photo Cube",
    aspect: [1, 1],
    cells: cube(0.08, 0.04, 0.84),
  },
  {
    id: "diamond-stack",
    name: "Diamond Stack",
    aspect: [1, 1],
    cells: [
      { x: 0.27, y: 0.04, w: 0.46, h: 0.46, clip: DIAMOND },
      { x: 0.27, y: 0.27, w: 0.46, h: 0.46, clip: DIAMOND },
      { x: 0.27, y: 0.5, w: 0.46, h: 0.46, clip: DIAMOND },
    ],
  },
  {
    id: "cube-and-cell",
    name: "Cube and Cell",
    aspect: [1, 1],
    cells: [...cube(0.06, 0.04, 0.62), { x: 0.64, y: 0.6, w: 0.32, h: 0.37, clip: HEX }],
  },
  {
    id: "cube-steps",
    name: "Cube Steps",
    aspect: [1, 1],
    cells: [...cube(0.02, 0.58, 0.32), ...cube(0.32, 0.32, 0.32), ...cube(0.62, 0.06, 0.32)],
  },
  {
    id: "3d-panels",
    name: "3D Panels",
    aspect: [1, 1],
    cells: [
      { x: 0.02, y: 0.1, w: 0.28, h: 0.8, clip: [[0, 0.12], [1, 0], [1, 1], [0, 0.88]] },
      { x: 0.36, y: 0.06, w: 0.28, h: 0.88 },
      { x: 0.7, y: 0.1, w: 0.28, h: 0.8, clip: [[0, 0], [1, 0.12], [1, 0.88], [0, 1]] },
    ],
  },
];

export function getLayout(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export const BACKGROUNDS: Background[] = [
  { id: "snow", name: "White", color: "#ffffff" },
  { id: "ink", name: "Black", color: "#000000" },
  { id: "grey", name: "Grey", color: "#f2f2f7" },
  { id: "accent", name: "Blue", color: "#007aff" },
  { id: "sand", name: "Sand", color: "#efe7db" },
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

// System font stacks only - nothing to download, so text renders instantly and
// the export canvas has the exact fonts available with no web-font wait.
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const ROUNDED = 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif';

/** Selectable font families - override a preset's default family. */
export const FONTS: Record<FontKey, { label: string; family: string }> = {
  sans: { label: "Sans", family: SANS },
  serif: { label: "Serif", family: SERIF },
  mono: { label: "Mono", family: MONO },
  rounded: { label: "Round", family: ROUNDED },
};

export const TEXT_PRESETS: Record<TextPreset, PresetStyle> = {
  headline: {
    label: "Headline",
    fontFamily: SANS,
    weight: 700,
    italic: false,
    tracking: -0.02,
    uppercase: false,
    size: 0.1,
    color: "#ffffff",
  },
  caption: {
    label: "Caption",
    fontFamily: SANS,
    weight: 600,
    italic: false,
    tracking: 0.22,
    uppercase: true,
    size: 0.035,
    color: "#ffffff",
  },
  sticker: {
    label: "Sticker",
    fontFamily: SANS,
    weight: 700,
    italic: false,
    tracking: 0.01,
    uppercase: false,
    size: 0.05,
    color: "#ffffff",
    pill: true,
  },
  signature: {
    label: "Signature",
    fontFamily: SERIF,
    weight: 500,
    italic: true,
    tracking: 0,
    uppercase: false,
    size: 0.06,
    color: "#ffffff",
  },
};
