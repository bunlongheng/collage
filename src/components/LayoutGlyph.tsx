import { clipCss } from "@/lib/geometry";
import type { Layout } from "@/lib/types";

/** Muted per-cell tints so each slot in a preview reads as a distinct photo. */
const TINTS = ["#4a6fa5", "#7b5ea7", "#a8623a", "#4e8a5e", "#9a8a36", "#b05a6a"];

/** A tiny preview of a layout's cells, sized to a `px` bounding box. */
export function LayoutGlyph({ layout, px = 30 }: { layout: Layout; px?: number }) {
  const [aw, ah] = layout.aspect;
  const w = aw >= ah ? px : (px * aw) / ah;
  const h = ah >= aw ? px : (px * ah) / aw;
  return (
    <span className="relative block" style={{ width: w, height: h }} aria-hidden>
      {layout.cells.map((c, i) => (
        <span
          key={i}
          className="absolute rounded-[2px]"
          style={{
            background: TINTS[i % TINTS.length],
            clipPath: clipCss(c.clip),
            left: `${c.x * 100 + 5}%`,
            top: `${c.y * 100 + 5}%`,
            width: `${c.w * 100 - 10}%`,
            height: `${c.h * 100 - 10}%`,
          }}
        />
      ))}
    </span>
  );
}
