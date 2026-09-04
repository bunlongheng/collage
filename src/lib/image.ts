import { decodeHeic, isHeic } from "./heic";

/** Longest edge kept for an imported photo - enough that a cell stays sharp
 * even in a 4K export, while keeping the in-memory data URL manageable. */
const MAX_EDGE = 4096;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not decode image"));
    img.src = url;
  });
}

/** Decode a picked file and re-encode it as a bounded data URL.
 *
 * Going through <img> + canvas (instead of handing the raw file to CSS) means
 * the browser's own decoder is used, EXIF orientation is applied, oversized
 * camera files are downscaled, and a format the browser cannot show (HEIC on
 * Chrome, for example) fails loudly here instead of rendering as a blank cell.
 * iOS Safari decodes HEIC natively; elsewhere HEIC goes through libheif. */
export type ReadImage = { src: string; width: number; height: number };

export async function readImageFile(file: File): Promise<ReadImage> {
  const source = await decode(file);
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  const png = file.type === "image/png";
  return { src: canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.92), width: sw, height: sh };
}

/** Native <img> decode first; HEIC falls back to the WebAssembly decoder on
 * browsers without HEIC support (Chrome, Firefox, most Android). */
async function decode(file: File): Promise<HTMLImageElement | HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } catch (err) {
    if (isHeic(file)) return decodeHeic(file);
    throw err;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** True for a file we can turn into a photo (images incl. HEIC/HEIF). */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}
