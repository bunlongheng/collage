"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FONTS, getBackground, getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { filterCss } from "@/lib/filters";
import { emojiSrc } from "@/lib/emoji";
import { stickerFilter } from "@/lib/sticker";
import { clamp01, clipCss, fitSize } from "@/lib/geometry";
import { contentBox, metrics, nativeScale, resolveSize } from "@/lib/sizes";
import type { CollageState, Photo, TextItem } from "@/lib/types";

type Props = {
  state: CollageState;
  photos: Photo[];
  selectedCell: number | null;
  selectedTextId: string | null;
  selectedStickerId: string | null;
  onTapCell: (i: number) => void;
  onHoldCell: (i: number) => void;
  onDeselect: () => void;
  onCycleFilter: (dir: 1 | -1) => void;
  onSelectText: (id: string | null) => void;
  onMoveText: (id: string, xf: number, yf: number) => void;
  onSelectSticker: (id: string | null) => void;
  onMoveSticker: (id: string, xf: number, yf: number) => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
};

function useFit(aw: number, ah: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const pad = 16;
      setSize(fitSize(aw, ah, el.clientWidth - pad * 2, el.clientHeight - pad * 2));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aw, ah]);
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

const STEP = 34; // px of horizontal swipe per filter change
const HOLD_MS = 500; // press-and-hold to open the photo picker
const MOVE_TOL = 12; // px before a press becomes a swipe

export function Canvas({
  state, photos, selectedCell, selectedTextId, selectedStickerId,
  onTapCell, onHoldCell, onDeselect, onCycleFilter, onSelectText, onMoveText, onSelectSticker, onMoveSticker, stageRef,
}: Props) {
  const layout = getLayout(state.layoutId);
  const out = resolveSize(state.sizeId, layout);
  const { wrapRef, size } = useFit(out.w, out.h);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const { gapPx, radiusPx, inset } = metrics(state, size.w, size.h);
  // Mirror the export: on a display preset the collage shrinks (centered) as
  // far as the photos' own resolution allows, so the preview is honest.
  const k = state.sizeId === "auto" ? 1 : nativeScale(state, layout, layout.cells.map((_, i) => byId.get(state.filled[i])));
  const box = contentBox(layout, Math.max(0, size.w - inset * 2), Math.max(0, size.h - inset * 2), k);
  const css = filterCss(state.filter);
  const hasPhotos = Object.keys(state.filled).length > 0;

  const drag = useRef<{ kind: "text" | "sticker"; id: string } | null>(null);
  const g = useRef<{ x0: number; y0: number; lastX: number; steps: number; cell: number | null; moved: boolean } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const heldRef = useRef(false);
  const [holding, setHolding] = useState<number | null>(null);

  function clearHold() {
    window.clearTimeout(holdTimer.current);
    heldRef.current = false;
    setHolding(null);
  }

  function startDrag(e: React.PointerEvent, kind: "text" | "sticker", id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, id };
    if (kind === "text") onSelectText(id);
    else onSelectSticker(id);
  }

  function onStageDown(e: React.PointerEvent) {
    e.stopPropagation();
    const el = (e.target as HTMLElement).closest("[data-cell]");
    const cell = el ? Number(el.getAttribute("data-cell")) : null;
    g.current = { x0: e.clientX, y0: e.clientY, lastX: e.clientX, steps: 0, cell, moved: false };
    heldRef.current = false;
    stageRef.current?.setPointerCapture(e.pointerId);
    if (cell != null && state.filled[cell]) {
      holdTimer.current = window.setTimeout(() => { heldRef.current = true; setHolding(cell); }, HOLD_MS);
    }
  }
  function onStageMove(e: React.PointerEvent) {
    if (drag.current && size.w) {
      const r = stageRef.current!.getBoundingClientRect();
      const xf = clamp01((e.clientX - r.left) / r.width);
      const yf = clamp01((e.clientY - r.top) / r.height);
      if (drag.current.kind === "text") onMoveText(drag.current.id, xf, yf);
      else onMoveSticker(drag.current.id, xf, yf);
      return;
    }
    const s = g.current;
    if (!s) return;
    if (!s.moved && (Math.abs(e.clientX - s.x0) > MOVE_TOL || Math.abs(e.clientY - s.y0) > MOVE_TOL)) {
      s.moved = true;
      clearHold();
    }
    if (!hasPhotos) return;
    let dx = e.clientX - s.lastX;
    while (Math.abs(dx) >= STEP) {
      onCycleFilter(dx > 0 ? 1 : -1);
      s.lastX += (dx > 0 ? 1 : -1) * STEP;
      s.steps += 1;
      dx = e.clientX - s.lastX;
    }
  }
  function onStageUp() {
    window.clearTimeout(holdTimer.current);
    drag.current = null;
    const s = g.current;
    const held = heldRef.current;
    g.current = null;
    heldRef.current = false;
    setHolding(null);
    if (!s || s.steps > 0 || s.moved) return; // swipe / drag - not a tap
    if (s.cell == null) onDeselect(); // tapped empty canvas -> clear selection
    else if (held) onHoldCell(s.cell); // long press -> picker
    else onTapCell(s.cell); // tap -> select / swap / add
  }

  return (
    <div
      ref={wrapRef}
      className="relative grid min-h-0 flex-1 place-items-center overflow-hidden"
      onPointerDown={() => onDeselect()}
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rise outline outline-1 outline-black/10 dark:outline-white/20"
        style={{ width: size.w || 1, height: size.h || 1, background: getBackground(state.bgId).color, boxShadow: "var(--shadow)", touchAction: "none" }}
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onPointerUp={onStageUp}
        onPointerCancel={onStageUp}
      >
        {layout.cells.map((cell, i) => {
          const photo = state.filled[i] ? byId.get(state.filled[i]) : undefined;
          const active = selectedCell === i;
          return (
            <div
              key={i}
              data-cell={i}
              role="button"
              tabIndex={0}
              aria-label={photo ? `Photo slot ${i + 1}, filled` : `Photo slot ${i + 1}, empty`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTapCell(i); } }}
              className={`absolute overflow-hidden ${photo ? "" : "grid place-items-center text-[#8e8e93]"}`}
              style={{
                left: inset + box.x + cell.x * box.w + gapPx / 2,
                top: inset + box.y + cell.y * box.h + gapPx / 2,
                width: cell.w * box.w - gapPx,
                height: cell.h * box.h - gapPx,
                borderRadius: cell.clip ? 0 : radiusPx,
                clipPath: clipCss(cell.clip),
                backgroundColor: photo ? undefined : "rgba(120,120,128,0.22)",
                backgroundImage: photo ? `url("${photo.src}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: photo ? css : undefined,
                boxShadow: active ? "inset 0 0 0 3px var(--color-accent)" : undefined,
              }}
            >
              {!photo && (
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              {holding === i && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-center text-xs font-medium text-white">
                  Release to change
                </div>
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

        {state.stickers.map((s) => {
          const px = s.size * size.h;
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={`Sticker ${s.emoji}`}
              onPointerDown={(e) => startDrag(e, "sticker", s.id)}
              className={`absolute cursor-grab select-none active:cursor-grabbing ${selectedStickerId === s.id ? "outline outline-2 outline-accent outline-offset-4" : ""}`}
              style={{
                left: `${s.xf * 100}%`,
                top: `${s.yf * 100}%`,
                transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
              }}
            >
              <img
                src={emojiSrc(s.code)}
                alt=""
                draggable={false}
                style={{ width: px, height: px, display: "block", pointerEvents: "none", filter: stickerFilter(px) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
