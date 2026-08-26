"use client";

import type { StickerItem } from "@/lib/types";

type Props = {
  sticker: StickerItem;
  onUpdate: (patch: Partial<StickerItem>) => void;
  onDelete: () => void;
};

export function StickerToolbar({ sticker, onUpdate, onDelete }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 flex items-center gap-3 rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise md:mx-auto md:max-w-md">
      <span className="text-2xl leading-none" aria-hidden>{sticker.emoji}</span>
      <label className="flex flex-1 items-center gap-2">
        <span className="text-xs text-muted">Size</span>
        <input
          type="range"
          min={4}
          max={45}
          value={Math.round(sticker.size * 100)}
          onChange={(e) => onUpdate({ size: Number(e.target.value) / 100 })}
          className="flex-1 accent-accent"
          aria-label="Sticker size"
        />
      </label>
      <label className="flex items-center gap-2">
        <span className="text-xs text-muted">Spin</span>
        <input
          type="range"
          min={-180}
          max={180}
          value={sticker.rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-20 accent-accent"
          aria-label="Sticker rotation"
        />
      </label>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete sticker"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      </button>
    </div>
  );
}
