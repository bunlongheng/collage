/** A die-cut sticker look: a white outline that hugs the emoji's own shape
 * (built from stacked white drop-shadows on its alpha) plus a soft drop shadow.
 * The same string drives the CSS preview and the canvas export, so they match. */
export function stickerFilter(px: number): string {
  const w = Math.max(1, px * 0.05);
  const white = `drop-shadow(0 0 ${w}px #fff)`;
  const depth = `drop-shadow(0 ${px * 0.035}px ${px * 0.06}px rgba(0,0,0,0.35))`;
  return `${white} ${white} ${white} ${depth}`;
}
