"use client";

import { TEXT_PRESETS } from "@/lib/layouts";
import type { TextItem, TextPreset } from "@/lib/types";

const COLORS = ["#ffffff", "#000000", "#007aff", "#ff9f0a", "#30d158"];
const PRESETS = Object.keys(TEXT_PRESETS) as TextPreset[];

type Props = {
  text: TextItem;
  onUpdate: (patch: Partial<TextItem>) => void;
  onDelete: () => void;
};

/** Floating editor for the selected caption - no tab switch, edit in place. */
export function TextToolbar({ text, onUpdate, onDelete }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise md:mx-auto md:max-w-md">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={text.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Type your caption"
          aria-label="Caption text"
          className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-ink outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete caption"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto no-bar">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onUpdate({ preset: p, size: TEXT_PRESETS[p].size })}
            aria-label={`Style ${TEXT_PRESETS[p].label}`}
            aria-pressed={text.preset === p}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              text.preset === p ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"
            }`}
          >
            {TEXT_PRESETS[p].label}
          </button>
        ))}
        <span className="mx-0.5 h-5 w-px bg-line" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onUpdate({ color: c })}
            aria-label={`Color ${c}`}
            aria-pressed={text.color === c}
            className={`size-7 shrink-0 rounded-full border transition-transform ${
              text.color === c ? "scale-110 border-accent" : "hair"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
