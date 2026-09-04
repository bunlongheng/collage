/** Decode a HEIC/HEIF file to a canvas with libheif (WebAssembly), loaded on
 * first use only - Safari never needs it, and it is ~1.4MB. */
export async function decodeHeic(file: File): Promise<HTMLCanvasElement> {
  const { HeifDecoder } = await import("libheif-js/wasm-bundle");
  const images = new HeifDecoder().decode(new Uint8Array(await file.arrayBuffer()));
  const image = images[0];
  if (!image) throw new Error("no image in HEIC");
  try {
    const w = image.get_width();
    const h = image.get_height();
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    const pixels = ctx.createImageData(w, h);
    await new Promise<void>((resolve, reject) => {
      image.display(pixels, (out) => (out ? resolve() : reject(new Error("HEIC decode failed"))));
    });
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  } finally {
    images.forEach((i) => i.free());
  }
}

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}
