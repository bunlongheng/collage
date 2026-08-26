// Generates every icon/social asset from one source design.
// Run: npm run gen:assets  (outputs into /public)
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const INK = "#f3ede1";
const ACCENT = "#dd3f22";

/** The two-frames-plus-chip mark, drawn in a 512 box, scaled about centre. */
function mark(scale = 1) {
  const cx = 256;
  const cy = 256;
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">
    <rect x="120" y="150" width="210" height="210" rx="42" transform="rotate(-7 225 255)" fill="${INK}" opacity="0.4"/>
    <rect x="185" y="165" width="210" height="210" rx="42" transform="rotate(9 290 270)" fill="${INK}"/>
    <circle cx="300" cy="300" r="40" fill="${ACCENT}"/>
  </g>`;
}

function iconSvg({ scale = 1, radius = 0 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2a251c"/>
        <stop offset="1" stop-color="#0c0b09"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
    ${mark(scale)}
  </svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#17140f"/>
        <stop offset="1" stop-color="#0c0b09"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <g transform="translate(150 165) scale(0.62)">
      <rect x="120" y="150" width="210" height="210" rx="42" transform="rotate(-7 225 255)" fill="${INK}" opacity="0.4"/>
      <rect x="185" y="165" width="210" height="210" rx="42" transform="rotate(9 290 270)" fill="${INK}"/>
      <circle cx="300" cy="300" r="40" fill="${ACCENT}"/>
    </g>
    <text x="470" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="128" font-weight="600" fill="${INK}">Collage</text>
    <text x="474" y="372" font-family="Helvetica, Arial, sans-serif" font-size="34" letter-spacing="1" fill="#9d9484">Make it. Caption it. Ship it.</text>
    <rect x="474" y="410" width="120" height="8" rx="4" fill="${ACCENT}"/>
  </svg>`;
}

const svgBuf = (s) => Buffer.from(s);

async function main() {
  // Master SVG icon (served directly, scales infinitely)
  await writeFile(path.join(PUB, "icon.svg"), iconSvg({ radius: 96 }));

  // PWA + platform PNGs
  await sharp(svgBuf(iconSvg())).resize(512, 512).png().toFile(path.join(PUB, "icon-512.png"));
  await sharp(svgBuf(iconSvg())).resize(192, 192).png().toFile(path.join(PUB, "icon-192.png"));
  // Maskable: pull the mark into the safe zone (~72%)
  await sharp(svgBuf(iconSvg({ scale: 0.72 }))).resize(512, 512).png().toFile(path.join(PUB, "icon-maskable.png"));
  // Apple touch: solid, no transparency, 180
  await sharp(svgBuf(iconSvg())).resize(180, 180).png().toFile(path.join(PUB, "apple-touch-icon.png"));

  // Social share card
  await sharp(svgBuf(ogSvg())).png().toFile(path.join(PUB, "og.png"));

  // Multi-size favicon.ico
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((s) => sharp(svgBuf(iconSvg())).resize(s, s).png().toBuffer())
  );
  await writeFile(path.join(PUB, "favicon.ico"), await pngToIco(pngs));

  console.log("assets written to /public");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
