"use client";

import { FONTS, TEXT_PRESETS } from "@/lib/layouts";
import type { FontKey, TextItem, TextPreset } from "@/lib/types";

const COLORS = ["#ffffff", "#000000", "#007aff", "#ff9f0a", "#30d158", "#ff2d55"];
const PRESETS = Object.keys(TEXT_PRESETS) as TextPreset[];
const FONT_KEYS = Object.keys(FONTS) as FontKey[];
const POSITIONS: [string, number][] = [["Top", 0.12], ["Middle", 0.5], ["Bottom", 0.88]];

type Props = {
  text: TextItem;
  onUpdate: (patch: Partial<TextItem>) => void;
  onDelete: () => void;
};

/** Floating in-place editor for the selected caption - no tab switch. */
export function TextToolbar({ text, onUpdate, onDelete }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 space-y-2.5 rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise md:mx-auto md:max-w-md">
      {/* Words + delete */}
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

      {/* Position + style */}
      <Group label="Place">
        {POSITIONS.map(([name, yf]) => (
          <Pill key={name} active={Math.abs(text.yf - yf) < 0.02} onClick={() => onUpdate({ yf })}>
            {name}
          </Pill>
        ))}
        <Divider />
        {PRESETS.map((p) => (
          <Pill key={p} active={text.preset === p} onClick={() => onUpdate({ preset: p, size: TEXT_PRESETS[p].size })}>
            {TEXT_PRESETS[p].label}
          </Pill>
        ))}
      </Group>

      {/* Font + color */}
      <Group label="Font">
        {FONT_KEYS.map((f) => (
          <Pill
            key={f}
            active={(text.font ?? "sans") === f}
            onClick={() => onUpdate({ font: f })}
            style={{ fontFamily: FONTS[f].family }}
          >
            {FONTS[f].label}
          </Pill>
        ))}
        <Divider />
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
        <label
          className="relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border hair"
          aria-label="Custom color"
          style={{ background: "conic-gradient(from 0deg, #ff2d55, #ff9f0a, #30d158, #007aff, #ff2d55)" }}
        >
          <input
            type="color"
            value={text.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-bar">{children}</div>
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
  style,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={style}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-line" />;
}
