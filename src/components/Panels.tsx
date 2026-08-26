"use client";

import { BACKGROUNDS, LAYOUTS } from "@/lib/layouts";
import { EMOJI, emojiSrc, type Emoji } from "@/lib/emoji";
import { LayoutGlyph } from "./LayoutGlyph";
import { ThemeToggle } from "./ThemeToggle";
import type { CollageState } from "@/lib/types";

/** Floating panel shell - drops down from just under the header (near the tool
 * icons that opened it), only rendered when its tool is active. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto absolute inset-x-2 top-2 z-20 rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise md:mx-auto md:max-w-3xl">
      {children}
    </div>
  );
}

export function LayoutsPanel({
  state,
  onSetLayout,
}: {
  state: CollageState;
  onSetLayout: (id: string) => void;
}) {
  return (
    <Shell>
      <div className="flex items-center gap-2 overflow-x-auto no-bar">
        {LAYOUTS.map((l) => {
          const active = state.layoutId === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSetLayout(l.id)}
              aria-label={`Layout ${l.name}`}
              aria-pressed={active}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 bg-surface-2 text-ink transition-colors ${
                active ? "border-accent" : "border-transparent"
              }`}
            >
              <LayoutGlyph layout={l} px={28} />
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

export function StickersPanel({ onPick }: { onPick: (e: Emoji) => void }) {
  return (
    <Shell>
      <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto no-bar sm:grid-cols-12">
        {EMOJI.map((e) => (
          <button
            key={e.code}
            type="button"
            onClick={() => onPick(e)}
            aria-label={`Add ${e.char}`}
            className="grid aspect-square place-items-center rounded-lg p-1.5 transition-colors hover:bg-surface-2"
          >
            <img src={emojiSrc(e.code)} alt="" className="size-full" draggable={false} />
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function AdjustPanel({
  state,
  onSetStyle,
}: {
  state: CollageState;
  onSetStyle: (patch: Partial<CollageState>) => void;
}) {
  return (
    <Shell>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-muted">Theme</span>
          <ThemeToggle />
          <div className="ml-auto flex items-center gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSetStyle({ bgId: b.id })}
                aria-label={`Background ${b.name}`}
                aria-pressed={state.bgId === b.id}
                className={`size-8 shrink-0 rounded-full border transition-transform ${
                  state.bgId === b.id ? "scale-110 border-accent" : "hair"
                }`}
                style={{ background: b.color }}
              />
            ))}
          </div>
        </div>
        <Slider label="Spacing" value={state.gap} onChange={(v) => onSetStyle({ gap: v })} />
        <Slider label="Curve" value={state.radius} onChange={(v) => onSetStyle({ radius: v })} />
        <Slider label="Safe area" value={state.safe} onChange={(v) => onSetStyle({ safe: v })} />
      </div>
    </Shell>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-muted">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted">{value}</span>
    </label>
  );
}
