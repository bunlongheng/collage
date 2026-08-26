<div align="center">

<img src="public/icon.svg" width="88" alt="Collage logo" />

# Collage

**Make it. Caption it. Ship it.**

A fast, private, mobile-first collage maker. Drop in photos, snap them into a
layout, lay nice text over the top, and export a crisp PNG - all in the browser.
Nothing ever leaves your device.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087EA4?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-tested-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev)
[![Vercel](https://img.shields.io/badge/Vercel-live-000000?style=flat-square&logo=vercel)](https://collage-bheng.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-dd3f22?style=flat-square)](LICENSE)

[**Open the app -> collage-bheng.vercel.app**](https://collage-bheng.vercel.app)

<img src="docs/hero-dark.png" width="820" alt="Collage editor" />

</div>

---

## Why Collage

Most collage tools ask you to sign up, upload your photos to their servers, and
wait. Collage does none of that. It is a single-page app: your photos are read
straight into the browser, composed on a canvas, and rendered to a high-res PNG
locally. No account, no backend, no tracking - and because it is all static, it
scales to a CDN edge with zero infrastructure.

## Features

- **Photos in, PNG out** - pick from the built-in gallery or upload your own from
  your camera roll. Everything is processed on-device.
- **8 layouts** - single, side-by-side, stacked, feature, quad, thirds, story and
  story-split, covering square, portrait and 9:16 formats.
- **Nice text, instantly** - 4 tuned presets (Headline, Caption, Sticker,
  Signature) that already look designed. Drag to place, recolor, resize, rotate.
- **Style controls** - spacing, corner radius and 5 canvas backgrounds.
- **Light & dark** - respects your system theme with a no-flash manual toggle.
- **Mobile-first** - built for the iPhone: bottom-sheet tools, safe-area aware,
  touch-native drag and place.
- **Installable (PWA)** - add to home screen and it opens full-screen.
- **Crisp export** - a 2160px-long-edge PNG rendered on a real `<canvas>`, so the
  preview and the file share one geometry.

## Screenshots

| Light | Mobile | Sign-in |
| --- | --- | --- |
| <img src="docs/hero-light.png" width="260" /> | <img src="docs/mobile-dark.png" width="150" /> | <img src="docs/signin.png" width="260" /> |

## How it works

```
Photos (SVG gallery + FileReader uploads, all data: URIs)
        │
        ▼
CollageState ── layout · filled cells · text overlays · style
        │                         │
        ▼                         ▼
   DOM canvas               canvas 2D render
 (WYSIWYG preview)     (2160px PNG, same geometry)
        │                         │
        └──────────► one fractional cell model ◄──────┘
```

The whole editor is fractional: every cell is a `{x, y, w, h}` in the unit square,
so the on-screen preview and the exported PNG are computed from identical numbers.
The gallery art is generated as self-contained SVG data URIs, which keeps the
bundle tiny, needs no image licensing, and never taints the export canvas.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop + iPhone) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run gen:assets` | Regenerate icons / OG image from source |

## Tech stack

Next.js 16 (App Router, static) · React 19 · TypeScript · Tailwind CSS v4 ·
Canvas 2D export · Vitest · Playwright · Vercel.

No database, no auth, no server state - by design.

## License

[MIT](LICENSE) © Bunlong Heng
