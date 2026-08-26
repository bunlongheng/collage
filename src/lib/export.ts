import { FONTS, getBackground, getLayout, TEXT_PRESETS } from "./layouts";
import { filterCss } from "./filters";
import { coverCrop } from "./geometry";
import type { CollageState, Photo, Rect } from "./types";

/** Longest edge of the exported image, in device pixels. */
const LONG_EDGE = 2160;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });
}

/** Resolve a font-family that may contain a CSS var() to a canvas-usable stack. */
function resolveFamily(family: string): string {
  return family.replace(/var\((--[\w-]+)\)/g, (_m, name: string) => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || "sans-serif";
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Draw an image into a rect with object-fit: cover semantics. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect,
  cw: number,
  ch: number
) {
  const dx = rect.x * cw;
  const dy = rect.y * ch;
  const dw = rect.w * cw;
  const dh = rect.h * ch;
  const { sx, sy, sw, sh } = coverCrop(img.width, img.height, dw, dh);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** Render the collage to a canvas at export resolution. */
export async function renderCollage(
  state: CollageState,
  photos: Photo[]
): Promise<HTMLCanvasElement> {
  const layout = getLayout(state.layoutId);
  const [aw, ah] = layout.aspect;
  const scale = LONG_EDGE / Math.max(aw, ah);
  const cw = Math.round(aw * scale);
  const ch = Math.round(ah * scale);

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  // Background
  ctx.fillStyle = getBackground(state.bgId).color;
  ctx.fillRect(0, 0, cw, ch);

  const byId = new Map(photos.map((p) => [p.id, p]));
  const minD = Math.min(cw, ch);
  const gapPx = (state.gap / 100) * minD * 0.12;
  const radiusPx = (state.radius / 100) * minD * 0.12;
  const inset = (state.safe / 100) * minD * 0.2;
  const iw = cw - inset * 2;
  const ih = ch - inset * 2;

  // Cells - load every image in parallel first so export stays fast.
  const jobs = layout.cells.map((cell, i) => {
    const photo = state.filled[i] ? byId.get(state.filled[i]) : undefined;
    return photo ? { cell, i, src: photo.src } : null;
  });
  const loaded = await Promise.all(
    jobs.map((j) => (j ? loadImage(j.src).catch(() => null) : Promise.resolve(null)))
  );
  jobs.forEach((j, k) => {
    const img = loaded[k];
    if (!j || !img) return;
    const x = inset + j.cell.x * iw + gapPx / 2;
    const y = inset + j.cell.y * ih + gapPx / 2;
    const w = j.cell.w * iw - gapPx;
    const h = j.cell.h * ih - gapPx;
    if (w <= 0 || h <= 0) return;
    ctx.save();
    roundRectPath(ctx, x, y, w, h, radiusPx);
    ctx.clip();
    const css = filterCss(state.filter);
    if (css !== "none") ctx.filter = css;
    drawCover(ctx, img, { x: x / cw, y: y / ch, w: w / cw, h: h / ch }, cw, ch);
    ctx.restore();
  });

  // Text overlays
  for (const t of state.texts) {
    const preset = TEXT_PRESETS[t.preset];
    const fontPx = t.size * ch;
    const family = resolveFamily(t.font ? FONTS[t.font].family : preset.fontFamily);
    const label = preset.uppercase ? t.text.toUpperCase() : t.text;
    ctx.save();
    ctx.translate(t.xf * cw, t.yf * ch);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.font = `${preset.italic ? "italic " : ""}${preset.weight} ${fontPx}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    try {
      // Letter-spacing is honoured by recent Chromium/Safari; ignored elsewhere.
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${preset.tracking}em`;
    } catch {
      /* not supported - fine */
    }

    if (preset.pill) {
      const m = ctx.measureText(label);
      const padX = fontPx * 0.55;
      const padY = fontPx * 0.34;
      const pw = m.width + padX * 2;
      const phh = fontPx + padY * 2;
      roundRectPath(ctx, -pw / 2, -phh / 2, pw, phh, phh / 2);
      ctx.fillStyle = "#007aff";
      ctx.fill();
      ctx.fillStyle = t.color;
      ctx.fillText(label, 0, fontPx * 0.04);
    } else {
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = fontPx * 0.14;
      ctx.shadowOffsetY = fontPx * 0.04;
      ctx.fillStyle = t.color;
      ctx.fillText(label, 0, 0);
    }
    ctx.restore();
  }

  // Emoji stickers - die-cut look: HD vector emoji on a white rounded pad + shadow.
  const stickerImgs = await Promise.all(
    state.stickers.map((s) => loadImage(`/emoji/${s.code}.svg`).catch(() => null))
  );
  state.stickers.forEach((s, k) => {
    const img = stickerImgs[k];
    const px = s.size * ch;
    const pad = px * 0.24;
    const box = px + pad * 2;
    ctx.save();
    ctx.translate(s.xf * cw, s.yf * ch);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = px * 0.16;
    ctx.shadowOffsetY = px * 0.07;
    ctx.fillStyle = "#ffffff";
    roundRectPath(ctx, -box / 2, -box / 2, box, box, box * 0.3);
    ctx.fill();
    ctx.restore();
    if (img) ctx.drawImage(img, -px / 2, -px / 2, px, px);
    ctx.restore();
  });

  return canvas;
}

export async function exportBlob(
  state: CollageState,
  photos: Photo[]
): Promise<Blob> {
  if ("fonts" in document) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* continue with fallback fonts */
    }
  }
  const canvas = await renderCollage(state, photos);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export failed"))),
      "image/png"
    );
  });
}

export type SaveResult = "shared" | "cancelled" | "downloaded";

/**
 * Save the collage. On phones this opens the native share sheet where "Save
 * Image" adds it straight to Photos (no Files app). Desktop / unsupported
 * browsers fall back to a normal PNG download.
 */
export async function saveCollage(
  state: CollageState,
  photos: Photo[]
): Promise<SaveResult> {
  const blob = await exportBlob(state, photos);
  const filename = `collage-${Date.now()}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Collage" });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "cancelled";
      // any other share failure -> fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
