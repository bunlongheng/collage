import type { Background, FontKey, Layout, TextPreset } from "./types";

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
