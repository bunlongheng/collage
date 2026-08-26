"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FONTS, getBackground, getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { filterCss } from "@/lib/filters";
import { clamp01, fitSize } from "@/lib/geometry";
import type { CollageState, Photo, TextItem } from "@/lib/types";

type Props = {
  state: CollageState;
  photos: Photo[];
  selectedCell: number | null;
  selectedTextId: string | null;
  selectedStickerId: string | null;
  filterMode: boolean;
  onTapCell: (i: number) => void;
  onCycleFilter: (i: number, dir: 1 | -1) => void;
  onSelectText: (id: string | null) => void;
  onMoveText: (id: string, xf: number, yf: number) => void;
  onSelectSticker: (id: string | null) => void;
  onMoveSticker: (id: string, xf: number, yf: number) => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
};

function useFit(aspect: [number, number]) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const [aw, ah] = aspect;
    const ro = new ResizeObserver(() => {
      const pad = 16;
      setSize(fitSize(aw, ah, el.clientWidth - pad * 2, el.clientHeight - pad * 2));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);
  return { wrapRef, size };
}

function textStyle(t: TextItem, h: number): CSSProperties {
  const p = TEXT_PRESETS[t.preset];
  const base: CSSProperties = {
    fontFamily: t.font ? FONTS[t.font].family : p.fontFamily,
    fontWeight: p.weight,
    fontStyle: p.italic ? "italic" : "normal",
    letterSpacing: `${p.tracking}em`,
    textTransform: p.uppercase ? "uppercase" : "none",
    fontSize: `${t.size * h}px`,
    color: t.color,
    lineHeight: 1.05,
    whiteSpace: "pre",
  };
  if (p.pill) {
    return { ...base, background: "var(--color-accent)", padding: `${t.size * h * 0.34}px ${t.size * h * 0.55}px`, borderRadius: "999px" };
  }
  return { ...base, textShadow: `0 ${t.size * h * 0.04}px ${t.size * h * 0.14}px rgba(0,0,0,0.4)` };
}

export function Canvas({
  state, photos, selectedCell, selectedTextId, selectedStickerId, filterMode,
  onTapCell, onCycleFilter, onSelectText, onMoveText, onSelectSticker, onMoveSticker, stageRef,
}: Props) {
  const layout = getLayout(state.layoutId);
  const { wrapRef, size } = useFit(layout.aspect);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const minD = Math.min(size.w, size.h);
  const gapPx = (state.gap / 100) * minD * 0.12;
  const radiusPx = (state.radius / 100) * minD * 0.12;
  const inset = (state.safe / 100) * minD * 0.2;
  const iw = Math.max(0, size.w - inset * 2);
  const ih = Math.max(0, size.h - inset * 2);

  const drag = useRef<{ kind: "text" | "sticker"; id: string } | null>(null);
  const cellDrag = useRef<{ i: number; x0: number; y0: number; lastX: number; steps: number } | null>(null);
  const STEP = 34; // px of horizontal swipe per filter change

  function startDrag(e: React.PointerEvent, kind: "text" | "sticker", id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, id };
    if (kind === "text") onSelectText(id);
    else onSelectSticker(id);
  }
  function onStagePointerMove(e: React.PointerEvent) {
    if (!drag.current || size.w === 0) return;
    const r = stageRef.current!.getBoundingClientRect();
    const xf = clamp01((e.clientX - r.left) / r.width);
    const yf = clamp01((e.clientY - r.top) / r.height);
    if (drag.current.kind === "text") onMoveText(drag.current.id, xf, yf);
    else onMoveSticker(drag.current.id, xf, yf);
  }

  return (
    <div
      ref={wrapRef}
      className="relative grid min-h-0 flex-1 place-items-center overflow-hidden"
      onPointerDown={() => { onSelectText(null); onSelectSticker(null); }}
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rise"
        style={{ width: size.w || 1, height: size.h || 1, background: getBackground(state.bgId).color, boxShadow: "var(--shadow)", touchAction: "none" }}
        onPointerMove={onStagePointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {layout.cells.map((cell, i) => {
          const photo = state.filled[i] ? byId.get(state.filled[i]) : undefined;
          const active = selectedCell === i;
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={photo ? `Photo slot ${i + 1}, filled` : `Photo slot ${i + 1}, empty`}
              onPointerDown={(e) => { e.stopPropagation(); cellDrag.current = { i, x0: e.clientX, y0: e.clientY, lastX: e.clientX, steps: 0 }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => {
                const d = cellDrag.current;
                if (!d || d.i !== i || !photo) return;
                // Cycle the filter live as the finger moves horizontally.
                let dx = e.clientX - d.lastX;
                while (Math.abs(dx) >= STEP) {
                  const dir = dx > 0 ? 1 : -1;
                  onCycleFilter(i, dir);
                  d.lastX += dir * STEP;
                  d.steps += 1;
                  dx = e.clientX - d.lastX;
                }
              }}
              onPointerUp={(e) => {
                const d = cellDrag.current; cellDrag.current = null;
                if (!d || d.i !== i) return;
                const moved = Math.abs(e.clientX - d.x0) > 10 || Math.abs(e.clientY - d.y0) > 10;
                if (d.steps === 0 && !moved) {
                  // In filter mode, a tap flicks to the next filter; otherwise swap.
                  if (filterMode && photo) onCycleFilter(i, 1);
                  else onTapCell(i);
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTapCell(i); } }}
              className={`absolute overflow-hidden ${photo ? "cursor-pointer" : "grid cursor-pointer place-items-center text-black/30"}`}
              style={{
                left: inset + cell.x * iw + gapPx / 2,
                top: inset + cell.y * ih + gapPx / 2,
                width: cell.w * iw - gapPx,
                height: cell.h * ih - gapPx,
                borderRadius: radiusPx,
                touchAction: "none",
                backgroundColor: photo ? undefined : "rgba(120,120,128,0.14)",
                backgroundImage: photo ? `url("${photo.src}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: photo ? filterCss(state.filters[i]) : undefined,
                boxShadow: active ? "inset 0 0 0 3px var(--color-accent)" : undefined,
              }}
            >
              {!photo && (
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </div>
          );
        })}

        {state.texts.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onPointerDown={(e) => startDrag(e, "text", t.id)}
            className={`absolute cursor-grab select-none active:cursor-grabbing ${selectedTextId === t.id ? "outline outline-2 outline-accent outline-offset-4" : ""}`}
            style={{ left: `${t.xf * 100}%`, top: `${t.yf * 100}%`, transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`, ...textStyle(t, size.h) }}
          >
            {t.text || "Text"}
          </div>
        ))}

        {state.stickers.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            aria-label={`Sticker ${s.emoji}`}
            onPointerDown={(e) => startDrag(e, "sticker", s.id)}
            className={`absolute cursor-grab select-none leading-none active:cursor-grabbing ${selectedStickerId === s.id ? "outline outline-2 outline-accent outline-offset-4" : ""}`}
            style={{ left: `${s.xf * 100}%`, top: `${s.yf * 100}%`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`, fontSize: `${s.size * size.h}px` }}
          >
            {s.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
