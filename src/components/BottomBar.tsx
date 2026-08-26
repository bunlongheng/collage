"use client";

import { useRef, useState } from "react";
import { BACKGROUNDS, LAYOUTS } from "@/lib/layouts";
import type { CollageState, Photo } from "@/lib/types";

type Props = {
  state: CollageState;
  photos: Photo[];
  selectedCell: number | null;
  onSetLayout: (id: string) => void;
  onPickPhoto: (id: string) => void;
  onUpload: (files: FileList) => void;
  onAddText: () => void;
  onShuffle: () => void;
  onSetStyle: (patch: Partial<CollageState>) => void;
};

export function BottomBar({
  state,
  photos,
  selectedCell,
  onSetLayout,
  onPickPhoto,
  onUpload,
  onAddText,
  onShuffle,
  onSetStyle,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAdjust, setShowAdjust] = useState(false);

  return (
    <div className="safe-b shrink-0 border-t hair bg-surface/95 backdrop-blur md:mx-auto md:w-full md:max-w-3xl">
      {/* Layouts */}
      <Row label="Layouts">
        {LAYOUTS.map((l) => {
          const active = state.layoutId === l.id;
          const [aw, ah] = l.aspect;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSetLayout(l.id)}
              aria-label={`Layout ${l.name}`}
              aria-pressed={active}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2 transition-colors ${
                active ? "border-accent" : "border-transparent"
              }`}
            >
              <span className="absolute inset-0 grid place-items-center">
                <span
                  className="relative block"
                  style={{ width: aw >= ah ? 30 : (30 * aw) / ah, height: ah >= aw ? 30 : (30 * ah) / aw }}
                >
                  {l.cells.map((c, i) => (
                    <span
                      key={i}
                      className="absolute rounded-[2px] bg-ink/30"
                      style={{
                        left: `${c.x * 100 + 4}%`,
                        top: `${c.y * 100 + 4}%`,
                        width: `${c.w * 100 - 8}%`,
                        height: `${c.h * 100 - 8}%`,
                      }}
                    />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </Row>

      {/* Photos */}
      <Row label={selectedCell !== null ? `Photos -> slot ${selectedCell + 1}` : "Photos"}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Add photos from device"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-dashed hair text-accent"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
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
            aria-label={p.name}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl transition-transform active:scale-95"
            style={{ backgroundImage: `url("${p.src}")`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            {p.uploaded && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/55 px-1 text-[8px] font-semibold text-white">
                you
              </span>
            )}
          </button>
        ))}
      </Row>

      {/* Actions */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 no-bar">
        <Chip onClick={onAddText} icon={<TextIcon />}>Text</Chip>
        <Chip onClick={onShuffle} icon={<ShuffleIcon />}>Shuffle</Chip>
        <Chip onClick={() => setShowAdjust((v) => !v)} icon={<SlidersIcon />} active={showAdjust}>
          Adjust
        </Chip>
        <span className="mx-1 h-6 w-px bg-line" />
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

      {showAdjust && (
        <div className="flex items-center gap-5 border-t hair px-4 py-3">
          <Slider label="Spacing" value={state.gap} onChange={(v) => onSetStyle({ gap: v })} />
          <Slider label="Corners" value={state.radius} onChange={(v) => onSetStyle({ radius: v })} />
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b hair px-4 py-2.5 last:border-b-0">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="flex items-center gap-2 overflow-x-auto no-bar">{children}</div>
    </div>
  );
}

function Chip({
  children,
  icon,
  onClick,
  active,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-1 items-center gap-2">
      <span className="w-16 text-xs text-muted">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
    </label>
  );
}

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <path d="M5 6h14M12 6v13M9 19h6" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4M14 4v4M6 10v4M12 16v4" />
    </svg>
  );
}
