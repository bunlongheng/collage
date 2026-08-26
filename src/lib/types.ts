/** A fractional rectangle inside the canvas (all values 0..1). */
export type Rect = { x: number; y: number; w: number; h: number };

/** A collage layout: a canvas aspect ratio and a set of photo cells. */
export type Layout = {
  id: string;
  name: string;
  /** [width, height] used only as a ratio. */
  aspect: [number, number];
  cells: Rect[];
};

/** A built-in gallery artwork or a user upload, both as image sources. */
export type Photo = {
  id: string;
  name: string;
  /** data: URI - same-origin, so it never taints the export canvas. */
  src: string;
  /** True for device uploads (shown with a small badge, revocable). */
  uploaded?: boolean;
};

/** Named text styles so a caption looks good the instant it is added. */
export type TextPreset = "headline" | "caption" | "sticker" | "signature";

/** Font family choice, overrides the preset's default family when set. */
export type FontKey = "sans" | "serif" | "mono" | "rounded";

export type TextItem = {
  id: string;
  text: string;
  preset: TextPreset;
  /** Optional font-family override. */
  font?: FontKey;
  /** Center position as canvas fractions. */
  xf: number;
  yf: number;
  /** Font size as a fraction of canvas height. */
  size: number;
  color: string;
  rotation: number;
};

export type Background = {
  id: string;
  name: string;
  color: string;
};

export type CollageState = {
  layoutId: string;
  /** cell index -> Photo id. */
  filled: Record<number, string>;
  texts: TextItem[];
  gap: number;
  radius: number;
  /** Outer margin around the whole collage, 0..100. */
  safe: number;
  bgId: string;
};
