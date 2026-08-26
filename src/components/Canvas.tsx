"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FONTS, getBackground, getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { clamp01, fitSize } from "@/lib/geometry";
import type { CollageState, Photo, TextItem } from "@/lib/types";

type Props = {
  state: CollageState;
  photos: Photo[];
  selectedCell: number | null;
  selectedTextId: string | null;
  onSelectCell: (i: number) => void;
  onSelectText: (id: string | null) => void;
  onMoveText: (id: string, xf: number, yf: number) => void;
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

function presetStyle(t: TextItem, h: number): CSSProperties {
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
    return {
      ...base,
      background: "var(--color-accent)",
      padding: `${t.size * h * 0.34}px ${t.size * h * 0.55}px`,
      borderRadius: "999px",
    };
  }
  return {
    ...base,
    textShadow: `0 ${t.size * h * 0.04}px ${t.size * h * 0.14}px rgba(0,0,0,0.35)`,
  };
}

export function Canvas({
  state,
  photos,
  selectedCell,
  selectedTextId,
  onSelectCell,
  onSelectText,
  onMoveText,
  stageRef,
}: Props) {
  const layout = getLayout(state.layoutId);
  const { wrapRef, size } = useFit(layout.aspect);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const gapPx = (state.gap / 100) * Math.min(size.w, size.h) * 0.12;
  const radiusPx = (state.radius / 100) * Math.min(size.w, size.h) * 0.12;
  const drag = useRef<{ id: string } | null>(null);

  function onPointerDownText(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id };
    onSelectText(id);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || size.w === 0) return;
    const rect = stageRef.current!.getBoundingClientRect();
    onMoveText(
      drag.current.id,
      clamp01((e.clientX - rect.left) / rect.width),
      clamp01((e.clientY - rect.top) / rect.height)
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative grid min-h-0 flex-1 place-items-center overflow-hidden"
      onPointerDown={() => onSelectText(null)}
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rise"
        style={{
          width: size.w || 1,
          height: size.h || 1,
          background: getBackground(state.bgId).color,
          // Outer frame stays square - the exported PNG is a rectangle, and
          // Curve only rounds the photo cells (WYSIWYG).
          borderRadius: 0,
          boxShadow: "var(--shadow)",
          touchAction: "none",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {layout.cells.map((cell, i) => {
          const photo = state.filled[i] ? byId.get(state.filled[i]) : undefined;
          const active = selectedCell === i;
          return (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelectCell(i)}
              className={`absolute overflow-hidden ${
                photo ? "" : "grid place-items-center text-white/70"
              }`}
              style={{
                left: cell.x * size.w + gapPx / 2,
                top: cell.y * size.h + gapPx / 2,
                width: cell.w * size.w - gapPx,
                height: cell.h * size.h - gapPx,
                borderRadius: radiusPx,
                backgroundColor: photo ? undefined : "rgba(120,120,128,0.16)",
                backgroundImage: photo ? `url("${photo.src}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: active ? "inset 0 0 0 3px var(--color-accent)" : undefined,
              }}
              aria-label={photo ? `Photo slot ${i + 1}, filled` : `Photo slot ${i + 1}, empty`}
              aria-pressed={active}
            >
              {!photo && (
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
          );
        })}

        {state.texts.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onPointerDown={(e) => onPointerDownText(e, t.id)}
            className={`absolute cursor-grab select-none active:cursor-grabbing ${
              selectedTextId === t.id ? "outline outline-2 outline-accent outline-offset-4" : ""
            }`}
            style={{
              left: `${t.xf * 100}%`,
              top: `${t.yf * 100}%`,
              transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
              ...presetStyle(t, size.h),
            }}
          >
            {t.text || "Text"}
          </div>
        ))}
      </div>
    </div>
  );
}
