import type { Photo } from "./types";

/**
 * Built-in gallery art. Each piece is a self-contained SVG data URI - no
 * network, no license to track, and safe to draw onto the export canvas
 * without tainting it. They double as the demo images for screenshots.
 */

type Blob = { cx: number; cy: number; r: number; color: string };
type Piece = {
  id: string;
  name: string;
  base: [string, string];
  angle: number;
  blobs: Blob[];
};

const PIECES: Piece[] = [
  {
    id: "ember",
    name: "Ember",
    base: ["#2b0f0a", "#dd3f22"],
    angle: 145,
    blobs: [
      { cx: 22, cy: 24, r: 60, color: "#ff9a3c" },
      { cx: 82, cy: 86, r: 55, color: "#7a1206" },
    ],
  },
  {
    id: "dune",
    name: "Dune",
    base: ["#e9c68a", "#b5703b"],
    angle: 120,
    blobs: [
      { cx: 30, cy: 78, r: 66, color: "#f6e2b0" },
      { cx: 85, cy: 20, r: 44, color: "#8a4a24" },
    ],
  },
  {
    id: "tide",
    name: "Tide",
    base: ["#08303a", "#1f8a8a" ],
    angle: 160,
    blobs: [
      { cx: 78, cy: 30, r: 58, color: "#7fe3cf" },
      { cx: 18, cy: 82, r: 50, color: "#04202a" },
    ],
  },
  {
    id: "orchid",
    name: "Orchid",
    base: ["#2a0f39", "#b8438f"],
    angle: 135,
    blobs: [
      { cx: 24, cy: 30, r: 55, color: "#ff9ecf" },
      { cx: 84, cy: 84, r: 52, color: "#4a1057" },
    ],
  },
  {
    id: "meadow",
    name: "Meadow",
    base: ["#14351f", "#4f9d55"],
    angle: 120,
    blobs: [
      { cx: 76, cy: 26, r: 54, color: "#c7e79b" },
      { cx: 20, cy: 80, r: 48, color: "#0c2413" },
    ],
  },
  {
    id: "slate",
    name: "Slate",
    base: ["#1a1c22", "#4a5262"],
    angle: 150,
    blobs: [
      { cx: 30, cy: 26, r: 58, color: "#9aa6bd" },
      { cx: 82, cy: 82, r: 50, color: "#0e1013" },
    ],
  },
  {
    id: "peach",
    name: "Peach",
    base: ["#ffd7c2", "#f2896b"],
    angle: 125,
    blobs: [
      { cx: 26, cy: 74, r: 62, color: "#fff0e2" },
      { cx: 82, cy: 22, r: 42, color: "#d94f39" },
    ],
  },
  {
    id: "indigo",
    name: "Indigo",
    base: ["#0c1130", "#3a49b0"],
    angle: 160,
    blobs: [
      { cx: 74, cy: 28, r: 56, color: "#8ea2ff" },
      { cx: 22, cy: 84, r: 50, color: "#060a20" },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    base: ["#3a2a06", "#e0a72a"],
    angle: 140,
    blobs: [
      { cx: 28, cy: 30, r: 58, color: "#ffe08a" },
      { cx: 84, cy: 84, r: 46, color: "#7a5410" },
    ],
  },
  {
    id: "rose",
    name: "Rose",
    base: ["#3a0c1a", "#d94f6c"],
    angle: 130,
    blobs: [
      { cx: 78, cy: 26, r: 54, color: "#ffb3c1" },
      { cx: 20, cy: 82, r: 48, color: "#5a1024" },
    ],
  },
];

function svg(p: Piece): string {
  const [c1, c2] = p.base;
  const rad = (p.angle * Math.PI) / 180;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;
  const blobs = p.blobs
    .map(
      (b, i) => `
      <radialGradient id="${p.id}-b${i}" cx="${b.cx}%" cy="${b.cy}%" r="${b.r}%">
        <stop offset="0%" stop-color="${b.color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${b.color}" stop-opacity="0"/>
      </radialGradient>
      <rect width="900" height="1200" fill="url(#${p.id}-b${i})"/>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <defs>
      <linearGradient id="${p.id}-bg" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <filter id="${p.id}-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="900" height="1200" fill="url(#${p.id}-bg)"/>
    ${blobs}
    <rect width="900" height="1200" filter="url(#${p.id}-grain)" opacity="0.06"/>
  </svg>`;
}

function toUri(s: string): string {
  return `data:image/svg+xml,${encodeURIComponent(s.replace(/\s+/g, " ").trim())}`;
}

export const GALLERY: Photo[] = PIECES.map((p) => ({
  id: p.id,
  name: p.name,
  src: toUri(svg(p)),
}));
