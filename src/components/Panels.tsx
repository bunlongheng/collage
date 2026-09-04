"use client";

import { BACKGROUNDS, getBackground, getLayout, LAYOUTS } from "@/lib/layouts";
import { FILTERS } from "@/lib/filters";
import { contentBox, metrics, nativeScale, resolveSize, screenPreset, SIZES, type SizeIcon } from "@/lib/sizes";
import { EMOJI, emojiSrc, type Emoji } from "@/lib/emoji";
import { LayoutGlyph } from "./LayoutGlyph";
import { ThemeToggle } from "./ThemeToggle";
import type { CollageState, Photo } from "@/lib/types";

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
  // Fills the stage: it closes itself on pick, so there is nothing to see behind it.
  return (
    <div className="pointer-events-auto absolute inset-x-2 top-2 bottom-2 z-20 overflow-y-auto rounded-2xl border hair bg-surface/95 p-3 shadow-[var(--shadow)] backdrop-blur rise no-bar md:mx-auto md:max-w-3xl">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {LAYOUTS.map((l) => {
          const active = state.layoutId === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSetLayout(l.id)}
              aria-label={`Layout ${l.name}`}
              aria-pressed={active}
              className={`grid aspect-square w-full place-items-center rounded-xl border-2 bg-surface-2 transition-colors ${
                active ? "border-accent" : "border-transparent"
              }`}
            >
              <LayoutGlyph layout={l} px={60} />
            </button>
          );
        })}
      </div>
    </div>
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

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function fmtBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

/** Output size, look settings and per-photo metadata for the current collage. */
export function InfoPanel({ state, photos }: { state: CollageState; photos: Photo[] }) {
  const layout = getLayout(state.layoutId);
  const { w, h } = resolveSize(state.sizeId, layout);
  const g = gcd(w, h);
  const preset = state.sizeId === "screen" ? screenPreset()?.name : SIZES.find((p) => p.id === state.sizeId)?.name;
  const byId = new Map(photos.map((p) => [p.id, p]));
  const filled = layout.cells.filter((_, i) => state.filled[i]).length;
  const placed = layout.cells.map((_, i) => byId.get(state.filled[i])).filter((p): p is Photo => !!p);
  const filter = FILTERS.find((f) => f.id === state.filter)?.label ?? "Original";
  const k = nativeScale(state, layout, layout.cells.map((_, i) => byId.get(state.filled[i])));
  const { inset } = metrics(state, w, h);
  const area = contentBox(layout, w - inset * 2, h - inset * 2, k);
  const rows: [string, string][] = [
    ["Output", `${preset ?? "Collage"} · ${w} × ${h} px · ${w / g}:${h / g} · ${((w * h) / 1e6).toFixed(1)} MP · PNG`],
    ["Collage", `${area.w} × ${area.h} px on the canvas${k < 1 ? " · held at photo resolution, no upscaling" : " · sharp"}`],
    ["Layout", `${layout.name} · ${filled} of ${layout.cells.length} slots filled`],
    ["Look", `${filter} · Spacing ${state.gap} · Curve ${state.radius} · Safe area ${state.safe} · ${getBackground(state.bgId).name}`],
    ["Overlays", `${state.texts.length} text · ${state.stickers.length} sticker${state.stickers.length === 1 ? "" : "s"}`],
  ];
  return (
    <Shell>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <dt className="w-16 shrink-0 text-xs leading-5 text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
        {placed.length > 0 && (
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-xs leading-5 text-muted">Photos</dt>
            <dd className="min-w-0 flex-1 space-y-0.5 text-ink">
              {placed.map((p, i) => (
                <div key={p.id} className="flex gap-2 tabular-nums">
                  <span className="w-4 shrink-0 text-muted">{i + 1}</span>
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto shrink-0 text-muted">
                    {p.width && p.height ? `${p.width} × ${p.height}` : ""}
                    {p.type ? ` · ${p.type.replace("image/", "").toUpperCase()}` : ""}
                    {p.bytes ? ` · ${fmtBytes(p.bytes)}` : ""}
                  </span>
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </Shell>
  );
}

/** Export size picker: choosing a size updates the preview so you can see how
 * the collage sits on that display; the button at the bottom exports it. */
export function ExportMenu({
  state,
  photos,
  onPick,
  onExport,
}: {
  state: CollageState;
  photos: Photo[];
  onPick: (sizeId: string) => void;
  onExport: () => void;
}) {
  const layout = getLayout(state.layoutId);
  const own = resolveSize("auto", layout);
  const screen = screenPreset();
  const list = [...SIZES];
  if (screen && !SIZES.some((p) => p.w === screen.w && p.h === screen.h)) list.splice(1, 0, screen);
  const { w, h } = resolveSize(state.sizeId, layout);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const k = nativeScale(state, layout, layout.cells.map((_, i) => byId.get(state.filled[i])));
  return (
    <Shell>
      <div className="grid gap-1 sm:grid-cols-2">
        {list.map((p) => {
          const active = state.sizeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              aria-label={`Size ${p.name}`}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2 ${active ? "bg-surface-2 text-accent" : "text-ink"}`}
            >
              <SizeGlyph icon={p.icon} />
              <span className="flex-1 text-sm font-medium">{p.name}</span>
              <span className="text-xs tabular-nums text-muted">{p.w || own.w} × {p.h || own.h}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="min-w-0 flex-1 text-xs text-muted">
          {k < 1 ? "Collage shrunk to keep every photo sharp - no upscaling." : "Every photo has enough pixels for this size."}
        </span>
        <button
          type="button"
          onClick={onExport}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          Export {w} × {h}
        </button>
      </div>
    </Shell>
  );
}

function SizeGlyph({ icon }: { icon: SizeIcon }) {
  const common = { viewBox: "0 0 24 24", className: "size-5 shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (icon) {
    case "collage": return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>;
    case "laptop": return <svg {...common}><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>;
    case "phone": return <svg {...common}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18h2" /></svg>;
    case "tablet": return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M11 18h2" /></svg>;
    default: return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M12 16v4M8 20h8" /></svg>;
  }
}
