"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { Mark } from "./Mark";
import { LayoutGlyph } from "./LayoutGlyph";
import { AdjustPanel, LayoutsPanel } from "./Panels";
import { TextToolbar } from "./TextToolbar";
import { getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { downloadCollage } from "@/lib/export";
import { clamp01 } from "@/lib/geometry";
import type { CollageState, Photo, TextItem } from "@/lib/types";

const INITIAL_LAYOUT = "grid-4";
const INITIAL: CollageState = {
  layoutId: INITIAL_LAYOUT,
  filled: {},
  texts: [],
  gap: 14,
  radius: 0,
  safe: 0,
  bgId: "snow",
};

type Tool = "layouts" | "adjust" | null;

export function Editor() {
  const [state, setState] = useState<CollageState>(INITIAL);
  const [uploads, setUploads] = useState<Photo[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1);
  const targetRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const selectedText = state.texts.find((t) => t.id === selectedTextId) ?? null;
  const cellCount = getLayout(state.layoutId).cells.length;
  const hasPhotos = Object.keys(state.filled).length > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedTextId) return;
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const t = state.texts.find((x) => x.id === selectedTextId);
      if (!t) return;
      const step = e.shiftKey ? 0.05 : 0.01;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); deleteText(); }
      else if (map[e.key]) { e.preventDefault(); moveText(t.id, clamp01(t.xf + map[e.key][0]), clamp01(t.yf + map[e.key][1])); }
      else if (e.key === "Escape") setSelectedTextId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTextId, state.texts]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }

  // Open the device photo picker; picked images fill slots from `start` in order.
  function openPicker(start: number) {
    targetRef.current = start;
    fileRef.current?.click();
  }

  function onFiles(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    let slot = targetRef.current;
    list.forEach((file) => {
      const reader = new FileReader();
      const cell = slot++ % cellCount;
      reader.onload = () => {
        const id = `u${idRef.current++}`;
        const photo: Photo = { id, name: file.name, src: String(reader.result), uploaded: true };
        setUploads((u) => [photo, ...u]);
        setState((s) => ({ ...s, filled: { ...s.filled, [cell]: id } }));
      };
      reader.readAsDataURL(file);
    });
    setSelectedCell(null);
  }

  // Tap a tile -> swap that slot's image straight from the camera roll.
  function onTapCell(i: number) {
    setSelectedCell(i);
    setSelectedTextId(null);
    openPicker(i);
  }

  function setLayout(id: string) {
    setState((s) => ({ ...s, layoutId: id }));
  }

  function addText() {
    const id = `t${idRef.current++}`;
    const item: TextItem = {
      id, text: "Your caption", preset: "headline", xf: 0.5, yf: 0.88,
      size: TEXT_PRESETS.headline.size, color: "#ffffff", rotation: 0,
    };
    setState((s) => ({ ...s, texts: [...s.texts, item] }));
    setSelectedTextId(id);
    setTool(null);
  }

  function updateText(patch: Partial<TextItem>) {
    if (!selectedTextId) return;
    setState((s) => ({ ...s, texts: s.texts.map((t) => (t.id === selectedTextId ? { ...t, ...patch } : t)) }));
  }
  function moveText(id: string, xf: number, yf: number) {
    setState((s) => ({ ...s, texts: s.texts.map((t) => (t.id === id ? { ...t, xf, yf } : t)) }));
  }
  function deleteText() {
    if (!selectedTextId) return;
    setState((s) => ({ ...s, texts: s.texts.filter((t) => t.id !== selectedTextId) }));
    setSelectedTextId(null);
  }

  async function onExport() {
    setExporting(true);
    setSelectedTextId(null);
    setTool(null);
    try {
      await downloadCollage(state, uploads);
      flash("Saved to your photos");
    } catch {
      flash("Export failed - try again");
    } finally {
      setExporting(false);
    }
  }

  function toggleTool(t: Tool) {
    setTool((cur) => (cur === t ? null : t));
    setSelectedTextId(null);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      <header className="safe-t flex shrink-0 items-center justify-between gap-2 px-4 py-3 md:mx-auto md:w-full md:max-w-3xl">
        <div className="flex items-center gap-2">
          <Mark className="size-7 text-ink" />
          <span className="hidden text-lg font-semibold tracking-tight text-ink sm:inline">Collage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton label="Layouts" active={tool === "layouts"} onClick={() => toggleTool("layouts")}>
            <LayoutGlyph layout={getLayout(state.layoutId)} px={18} />
          </IconButton>
          <IconButton label="Add text" onClick={addText}>
            <TextIcon />
          </IconButton>
          <IconButton label="Adjust" active={tool === "adjust"} onClick={() => toggleTool("adjust")}>
            <SlidersIcon />
          </IconButton>
          {hasPhotos && (
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className="ml-1 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <DownloadIcon />
              {exporting ? "Saving…" : "Export"}
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col md:mx-auto md:w-full md:max-w-3xl">
        <Canvas
          state={state}
          photos={uploads}
          selectedCell={selectedCell}
          selectedTextId={selectedTextId}
          onSelectCell={onTapCell}
          onSelectText={setSelectedTextId}
          onMoveText={moveText}
          stageRef={stageRef}
        />

        {!hasPhotos && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <button
              type="button"
              onClick={() => openPicker(0)}
              className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink shadow-[var(--shadow)] transition-opacity hover:opacity-90"
            >
              <PhotosIcon />
              Select photos
            </button>
          </div>
        )}

        {selectedText && <TextToolbar text={selectedText} onUpdate={updateText} onDelete={deleteText} />}
        {tool === "layouts" && <LayoutsPanel state={state} onSetLayout={setLayout} />}
        {tool === "adjust" && <AdjustPanel state={state} onSetStyle={(patch) => setState((s) => ({ ...s, ...patch }))} />}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        aria-live="polite"
        className={`safe-b pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}
      >
        {toast && <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-10 place-items-center rounded-full border transition-colors ${
        active ? "border-accent text-accent" : "hair text-ink hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function TextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <path d="M5 6h14M12 6v13M9 19h6" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4M14 4v4M6 10v4M12 16v4" />
    </svg>
  );
}
function PhotosIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}
