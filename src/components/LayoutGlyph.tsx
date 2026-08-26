import type { Layout } from "@/lib/types";

/** A tiny preview of a layout's cells, sized to a `px` bounding box. Cells use
 * `currentColor`, so the parent's text color controls the tint. */
export function LayoutGlyph({ layout, px = 30 }: { layout: Layout; px?: number }) {
  const [aw, ah] = layout.aspect;
  const w = aw >= ah ? px : (px * aw) / ah;
  const h = ah >= aw ? px : (px * ah) / aw;
  return (
    <span className="relative block" style={{ width: w, height: h }} aria-hidden>
      {layout.cells.map((c, i) => (
        <span
          key={i}
          className="absolute rounded-[2px] bg-current opacity-70"
          style={{
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
