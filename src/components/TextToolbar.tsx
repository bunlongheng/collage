"use client";

import { FONTS } from "@/lib/layouts";
import type { FontKey, TextItem } from "@/lib/types";

const FONT_KEYS = Object.keys(FONTS) as FontKey[];

type Props = {
  text: TextItem;
  onUpdate: (patch: Partial<TextItem>) => void;
  onDelete: () => void;
};

/** Floating in-place editor for the selected text: font, size, color. */
export function TextToolbar({ text, onUpdate, onDelete }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 space-y-2.5 rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise md:mx-auto md:max-w-md">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={text.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Type here"
          aria-label="Text"
          className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-ink outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete text"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <select
          value={text.font ?? "sans"}
          onChange={(e) => onUpdate({ font: e.target.value as FontKey })}
          aria-label="Font"
          className="shrink-0 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink outline-none"
        >
          {FONT_KEYS.map((f) => (
            <option key={f} value={f}>{FONTS[f].label}</option>
          ))}
        </select>

        <label className="flex flex-1 items-center gap-2">
          <span className="text-xs text-muted">Size</span>
          <input
            type="range"
            min={2}
            max={24}
            value={Math.round(text.size * 100)}
            onChange={(e) => onUpdate({ size: Number(e.target.value) / 100 })}
            aria-label="Text size"
            className="min-w-0 flex-1 accent-accent"
          />
        </label>

        <label
          className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border hair"
          style={{ background: text.color }}
          aria-label="Text color"
        >
          <input
            type="color"
            value={text.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
