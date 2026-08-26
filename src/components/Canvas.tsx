"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getBackground, getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { clamp01, fitSize } from "@/lib/geometry";
import type { CollageState, Photo, TextItem } from "@/lib/types";

type Props = {
  state: CollageState;
  photos: Photo[];
  activePhotoId: string | null;
  selectedTextId: string | null;
  onPlace: (cellIndex: number) => void;
  onSelectText: (id: string | null) => void;
  onMoveText: (id: string, xf: number, yf: number) => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
};

/** Best-fit pixel size for the stage inside its parent, preserving aspect. */
function useFit(aspect: [number, number]) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const [aw, ah] = aspect;
    const ro = new ResizeObserver(() => {
      const pad = 24;
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
    fontFamily: p.fontFamily,
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
  activePhotoId,
  selectedTextId,
  onPlace,
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
    const xf = clamp01((e.clientX - rect.left) / rect.width);
    const yf = clamp01((e.clientY - rect.top) / rect.height);
    onMoveText(drag.current.id, xf, yf);
  }
  function endDrag() {
    drag.current = null;
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
          borderRadius: Math.max(6, radiusPx * 0.5),
          boxShadow: "var(--shadow)",
          touchAction: "none",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {layout.cells.map((cell, i) => {
          const photo = state.filled[i] ? byId.get(state.filled[i]) : undefined;
          const style: CSSProperties = {
            left: cell.x * size.w + gapPx / 2,
            top: cell.y * size.h + gapPx / 2,
            width: cell.w * size.w - gapPx,
            height: cell.h * size.h - gapPx,
            borderRadius: radiusPx,
          };
          return (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onPlace(i)}
              className={`absolute overflow-hidden transition-shadow ${
                photo
                  ? ""
                  : "grid place-items-center border border-dashed hair text-muted"
              } ${activePhotoId ? "ring-2 ring-accent/50" : ""}`}
              style={{
                ...style,
                backgroundColor: photo ? undefined : "var(--color-surface-2)",
                backgroundImage: photo ? `url("${photo.src}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-label={
                photo ? `Cell ${i + 1}, filled` : `Cell ${i + 1}, empty - tap to place photo`
              }
            >
              {!photo && (
                <span className="text-2xl font-light" aria-hidden>
                  +
                </span>
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
