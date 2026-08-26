"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { Mark } from "./Mark";
import { LayoutGlyph } from "./LayoutGlyph";
import { AdjustPanel, LayoutsPanel, StickersPanel } from "./Panels";
import { TextToolbar } from "./TextToolbar";
import { StickerToolbar } from "./StickerToolbar";
import { getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { cycleFilter, FILTERS } from "@/lib/filters";
import { saveCollage } from "@/lib/export";
import { readImageFile, isImageFile } from "@/lib/image";
import { clamp01 } from "@/lib/geometry";
import type { Emoji } from "@/lib/emoji";
import type { CollageState, Photo, StickerItem, TextItem } from "@/lib/types";

const INITIAL_LAYOUT = "grid-4";
const INITIAL: CollageState = {
  layoutId: INITIAL_LAYOUT,
  filled: {},
  filter: "none",
  texts: [],
  stickers: [],
  gap: 14,
  radius: 0,
  safe: 0,
  bgId: "snow",
};

type Tool = "layouts" | "stickers" | "adjust" | null;

export function Editor() {
  const [state, setState] = useState<CollageState>(INITIAL);
  const [uploads, setUploads] = useState<Photo[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1);
  const targetRef = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const selectedText = state.texts.find((t) => t.id === selectedTextId) ?? null;
  const selectedSticker = state.stickers.find((s) => s.id === selectedStickerId) ?? null;
  const cellCount = getLayout(state.layoutId).cells.length;
  const hasPhotos = Object.keys(state.filled).length > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const step = e.shiftKey ? 0.05 : 0.01;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      if (selectedTextId) {
        const t = state.texts.find((x) => x.id === selectedTextId);
        if (!t) return;
        if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); deleteText(); }
        else if (map[e.key]) { e.preventDefault(); moveText(t.id, clamp01(t.xf + map[e.key][0]), clamp01(t.yf + map[e.key][1])); }
        else if (e.key === "Escape") setSelectedTextId(null);
      } else if (selectedStickerId) {
        const s = state.stickers.find((x) => x.id === selectedStickerId);
        if (!s) return;
        if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); deleteSticker(); }
        else if (map[e.key]) { e.preventDefault(); moveSticker(s.id, clamp01(s.xf + map[e.key][0]), clamp01(s.yf + map[e.key][1])); }
        else if (e.key === "Escape") setSelectedStickerId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTextId, selectedStickerId, state.texts, state.stickers]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  }

  function openPicker(start: number) {
    targetRef.current = start;
    fileRef.current?.click();
  }

  function onFiles(files: FileList) {
    const list = Array.from(files).filter(isImageFile);
    if (!list.length) return;
    const start = targetRef.current;
    list.forEach((file, idx) => {
      const cell = (start + idx) % cellCount;
      readImageFile(file)
        .then((src) => {
          const id = `u${idRef.current++}`;
          const photo: Photo = { id, name: file.name, src, uploaded: true };
          setUploads((u) => [photo, ...u]);
          setState((s) => ({ ...s, filled: { ...s.filled, [cell]: id } }));
        })
        .catch(() => flash("Couldn't read that photo"));
    });
    setSelectedCell(null);
  }

  function onTapCell(i: number) {
    setSelectedCell(i);
    setSelectedTextId(null);
    setSelectedStickerId(null);
    openPicker(i);
  }

  // One filter for the whole collage.
  function cycle(dir: 1 | -1) {
    setState((s) => {
      const next = cycleFilter(s.filter, dir);
      flash(FILTERS.find((f) => f.id === next)?.label ?? "Filter");
      return { ...s, filter: next };
    });
  }

  function setLayout(id: string) {
    setState((s) => ({ ...s, layoutId: id }));
  }

  function addText() {
    const id = `t${idRef.current++}`;
    const item: TextItem = {
      id, text: "Texts", preset: "headline", xf: 0.5, yf: 0.85,
      size: TEXT_PRESETS.headline.size, color: "#ffffff", rotation: 0,
    };
    setState((s) => ({ ...s, texts: [...s.texts, item] }));
    setSelectedStickerId(null);
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

  function addSticker(e: Emoji) {
    const id = `s${idRef.current++}`;
    const item: StickerItem = { id, emoji: e.char, code: e.code, xf: 0.5, yf: 0.5, size: 0.16, rotation: 0 };
    setState((s) => ({ ...s, stickers: [...s.stickers, item] }));
    setSelectedTextId(null);
    setSelectedStickerId(id);
    setTool(null);
  }
  function updateSticker(patch: Partial<StickerItem>) {
    if (!selectedStickerId) return;
    setState((s) => ({ ...s, stickers: s.stickers.map((x) => (x.id === selectedStickerId ? { ...x, ...patch } : x)) }));
  }
  function moveSticker(id: string, xf: number, yf: number) {
    setState((s) => ({ ...s, stickers: s.stickers.map((x) => (x.id === id ? { ...x, xf, yf } : x)) }));
  }
  function deleteSticker() {
    if (!selectedStickerId) return;
    setState((s) => ({ ...s, stickers: s.stickers.filter((x) => x.id !== selectedStickerId) }));
    setSelectedStickerId(null);
  }

  async function onSave() {
    setExporting(true);
    setSelectedTextId(null);
    setSelectedStickerId(null);
    setTool(null);
    try {
      const result = await saveCollage(state, uploads);
      if (result === "downloaded") flash("Saved to your downloads");
      else if (result === "shared") flash("Saved");
    } catch {
      flash("Save failed - try again");
    } finally {
      setExporting(false);
    }
  }

  function toggleTool(t: Tool) {
    setTool((cur) => (cur === t ? null : t));
    setSelectedTextId(null);
    setSelectedStickerId(null);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:mx-auto md:w-full md:max-w-3xl">
        <div className="flex items-center gap-2">
          <Mark className="size-7 text-ink" />
          <span className="hidden text-lg font-semibold tracking-tight text-ink sm:inline">Collage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton label="Layouts" active={tool === "layouts"} onClick={() => toggleTool("layouts")}>
            <LayoutGlyph layout={getLayout(state.layoutId)} px={18} />
          </IconButton>
          {hasPhotos && (
            <>
              <IconButton label="Filter" onClick={() => cycle(1)}>
                <FilterIcon />
              </IconButton>
              <IconButton label="Add text" onClick={addText}><TextIcon /></IconButton>
              <IconButton label="Stickers" active={tool === "stickers"} onClick={() => toggleTool("stickers")}><SmileIcon /></IconButton>
              <IconButton label="Adjust" active={tool === "adjust"} onClick={() => toggleTool("adjust")}><SlidersIcon /></IconButton>
            </>
          )}
          {hasPhotos ? (
            <button
              type="button"
              onClick={onSave}
              disabled={exporting}
              className="ml-1 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <SaveIcon />
              {exporting ? "Saving…" : "Save"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openPicker(0)}
              className="ml-1 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              <PhotosIcon />
              Select {cellCount} photo{cellCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col pt-3 sm:pt-6 md:mx-auto md:w-full md:max-w-3xl">
        <Canvas
          state={state}
          photos={uploads}
          selectedCell={selectedCell}
          selectedTextId={selectedTextId}
          selectedStickerId={selectedStickerId}
          onTapCell={onTapCell}
          onCycleFilter={cycle}
          onSelectText={setSelectedTextId}
          onMoveText={moveText}
          onSelectSticker={setSelectedStickerId}
          onMoveSticker={moveSticker}
          stageRef={stageRef}
        />

        {selectedText && <TextToolbar text={selectedText} onUpdate={updateText} onDelete={deleteText} />}
        {selectedSticker && <StickerToolbar sticker={selectedSticker} onUpdate={updateSticker} onDelete={deleteSticker} />}
        {tool === "layouts" && <LayoutsPanel state={state} onSetLayout={setLayout} />}
        {tool === "stickers" && <StickersPanel onPick={addSticker} />}
        {tool === "adjust" && <AdjustPanel state={state} onSetStyle={(patch) => setState((s) => ({ ...s, ...patch }))} />}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }}
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

function IconButton({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-9 place-items-center rounded-full border transition-colors ${active ? "border-accent text-accent" : "hair text-ink hover:bg-surface-2"}`}
    >
      {children}
    </button>
  );
}

function TextIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden><path d="M5 6h14M12 6v13M9 19h6" /></svg>;
}
function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="9" r="6" /><circle cx="15" cy="15" r="6" /></svg>;
}
function SmileIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M8.5 14a4 4 0 0 0 7 0" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>;
}
function SlidersIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4M14 4v4M6 10v4M12 16v4" /></svg>;
}
function PhotosIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
}
function SaveIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>;
}
