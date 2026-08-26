"use client";

import { useRef, useState } from "react";
import {
  BACKGROUNDS,
  getLayout,
  LAYOUTS,
  TEXT_PRESETS,
} from "@/lib/layouts";
import type { CollageState, Photo, TextItem, TextPreset } from "@/lib/types";

const TABS = ["Photos", "Layout", "Text", "Style"] as const;
type Tab = (typeof TABS)[number];

const TEXT_COLORS = ["#fffaf5", "#17140f", "#dd3f22", "#f2c14e", "#5a8f7b"];

type Props = {
  state: CollageState;
  photos: Photo[];
  activePhotoId: string | null;
  selectedText: TextItem | null;
  onPickPhoto: (id: string) => void;
  onUpload: (files: FileList) => void;
  onSetLayout: (id: string) => void;
  onAddText: (preset: TextPreset) => void;
  onUpdateText: (patch: Partial<TextItem>) => void;
  onDeleteText: () => void;
  onSetStyle: (patch: Partial<CollageState>) => void;
};

export function Tray(props: Props) {
  const [tab, setTab] = useState<Tab>("Photos");
  return (
    <aside className="flex shrink-0 flex-col border-t hair bg-surface md:w-[380px] md:border-l md:border-t-0">
      <nav className="flex shrink-0 gap-1 px-3 pt-3" role="tablist" aria-label="Editor tools">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-ink text-paper"
                : "text-muted hover:bg-surface-2"
            }`}
            type="button"
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 no-bar md:max-h-[unset]">
        {tab === "Photos" && <PhotosPanel {...props} />}
        {tab === "Layout" && <LayoutPanel {...props} />}
        {tab === "Text" && <TextPanel {...props} />}
        {tab === "Style" && <StylePanel {...props} />}
      </div>
    </aside>
  );
}

function PhotosPanel({ photos, activePhotoId, onPickPhoto, onUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Tap a photo, then tap a cell to place it.
      </p>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-square place-items-center rounded-xl border border-dashed hair text-muted transition-colors hover:bg-surface-2"
          aria-label="Upload from device"
        >
          <span className="text-2xl">+</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPickPhoto(p.id)}
            className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
              activePhotoId === p.id
                ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                : "hover:opacity-90"
            }`}
            style={{
              backgroundImage: `url("${p.src}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-label={p.name}
            aria-pressed={activePhotoId === p.id}
          >
            {p.uploaded && (
              <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[9px] font-medium text-white">
                you
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayoutPanel({ state, onSetLayout }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {LAYOUTS.map((l) => {
        const active = state.layoutId === l.id;
        const [aw, ah] = l.aspect;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onSetLayout(l.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors ${
              active ? "border-accent bg-surface-2" : "hair hover:bg-surface-2"
            }`}
            aria-pressed={active}
          >
            <div
              className="relative w-full overflow-hidden rounded-md bg-surface-2"
              style={{ aspectRatio: `${aw} / ${ah}` }}
            >
              {l.cells.map((c, i) => (
                <span
                  key={i}
                  className="absolute rounded-[3px] bg-ink/25"
                  style={{
                    left: `${c.x * 100 + 3}%`,
                    top: `${c.y * 100 + 3}%`,
                    width: `${c.w * 100 - 6}%`,
                    height: `${c.h * 100 - 6}%`,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted">{l.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextPanel({ selectedText, onAddText, onUpdateText, onDeleteText }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TEXT_PRESETS) as TextPreset[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onAddText(key)}
            className="rounded-xl border hair px-3 py-3 text-left transition-colors hover:bg-surface-2"
          >
            <span
              className="block text-ink"
              style={{
                fontFamily: TEXT_PRESETS[key].fontFamily,
                fontWeight: TEXT_PRESETS[key].weight,
                fontStyle: TEXT_PRESETS[key].italic ? "italic" : "normal",
              }}
            >
              {TEXT_PRESETS[key].label}
            </span>
            <span className="text-[11px] text-muted">Add</span>
          </button>
        ))}
      </div>

      {selectedText ? (
        <div className="space-y-4 rounded-xl border hair p-3">
          <input
            type="text"
            value={selectedText.text}
            onChange={(e) => onUpdateText({ text: e.target.value })}
            placeholder="Your words"
            className="w-full rounded-lg border hair bg-paper px-3 py-2 text-ink outline-none"
            aria-label="Text content"
          />
          <Slider
            label="Size"
            min={2}
            max={20}
            value={Math.round(selectedText.size * 100)}
            onChange={(v) => onUpdateText({ size: v / 100 })}
          />
          <Slider
            label="Rotate"
            min={-30}
            max={30}
            value={selectedText.rotation}
            onChange={(v) => onUpdateText({ rotation: v })}
          />
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted">Color</span>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onUpdateText({ color: c })}
                className={`size-7 rounded-full border transition-transform ${
                  selectedText.color === c ? "scale-110 border-accent" : "hair"
                }`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onDeleteText}
            className="w-full rounded-lg border hair py-2 text-sm text-accent transition-colors hover:bg-surface-2"
          >
            Remove text
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Add a style above, then tap it on the canvas to edit or drag it.
        </p>
      )}
    </div>
  );
}

function StylePanel({ state, onSetStyle }: Props) {
  return (
    <div className="space-y-5">
      <Slider
        label="Spacing"
        min={0}
        max={100}
        value={state.gap}
        onChange={(v) => onSetStyle({ gap: v })}
      />
      <Slider
        label="Corners"
        min={0}
        max={100}
        value={state.radius}
        onChange={(v) => onSetStyle({ radius: v })}
      />
      <div>
        <span className="mb-2 block text-xs text-muted">Background</span>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSetStyle({ bgId: b.id })}
              className={`size-9 rounded-full border transition-transform ${
                state.bgId === b.id ? "scale-110 border-accent" : "hair"
              }`}
              style={{ background: b.color }}
              aria-label={b.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

/** Exposed so the empty-state helper can reference layout names if needed. */
export { getLayout };
