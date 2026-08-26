"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { Mark } from "./Mark";
import { ThemeToggle } from "./ThemeToggle";
import { BottomBar } from "./BottomBar";
import { TextToolbar } from "./TextToolbar";
import { GALLERY } from "@/lib/gallery";
import { getLayout, TEXT_PRESETS } from "@/lib/layouts";
import { downloadCollage } from "@/lib/export";
import { clamp01 } from "@/lib/geometry";
import type { CollageState, Photo, TextItem } from "@/lib/types";

/** Fill every empty cell of the layout with distinct gallery art. */
function autoFill(filled: Record<number, string>, layoutId: string): Record<number, string> {
  const layout = getLayout(layoutId);
  const used = new Set(Object.values(filled));
  const pool = GALLERY.filter((g) => !used.has(g.id));
  let p = 0;
  const next = { ...filled };
  for (let i = 0; i < layout.cells.length; i++) {
    if (next[i]) continue;
    next[i] = (pool[p++] ?? GALLERY[i % GALLERY.length]).id;
  }
  return next;
}

function shuffled(layoutId: string): Record<number, string> {
  const layout = getLayout(layoutId);
  const pool = [...GALLERY].sort(() => Math.random() - 0.5);
  const next: Record<number, string> = {};
  for (let i = 0; i < layout.cells.length; i++) next[i] = pool[i % pool.length].id;
  return next;
}

const INITIAL_LAYOUT = "grid-4";
const INITIAL: CollageState = {
  layoutId: INITIAL_LAYOUT,
  filled: autoFill({}, INITIAL_LAYOUT),
  texts: [
    {
      id: "t0",
      text: "Summer 2026",
      preset: "caption",
      xf: 0.5,
      yf: 0.92,
      size: TEXT_PRESETS.caption.size,
      color: "#ffffff",
      rotation: 0,
    },
  ],
  gap: 14,
  radius: 34,
  bgId: "snow",
};

export function Editor() {
  const [state, setState] = useState<CollageState>(INITIAL);
  const [uploads, setUploads] = useState<Photo[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(0);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1);
  const stageRef = useRef<HTMLDivElement>(null);

  const photos = useMemo(() => [...uploads, ...GALLERY], [uploads]);
  const selectedText = state.texts.find((t) => t.id === selectedTextId) ?? null;
  const cellCount = getLayout(state.layoutId).cells.length;

  // Keyboard control for the selected caption.
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

  // Tap a photo -> drop into the selected slot, then advance. One tap per photo.
  function pickPhoto(photoId: string) {
    const target = selectedCell ?? 0;
    setState((s) => ({ ...s, filled: { ...s.filled, [target]: photoId } }));
    setSelectedCell((target + 1) % cellCount);
  }

  // Upload -> photos auto-drop into slots in order. Fewest clicks for real users.
  function upload(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    let slot = selectedCell ?? 0;
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
    setSelectedCell((slot % cellCount));
  }

  // Switch layout -> keep photos, auto-fill any new empty slots. Never blank.
  function setLayout(id: string) {
    setState((s) => ({ ...s, layoutId: id, filled: autoFill(s.filled, id) }));
    setSelectedCell(0);
  }

  function shuffle() {
    setState((s) => ({ ...s, filled: shuffled(s.layoutId) }));
  }

  function addText() {
    const id = `t${idRef.current++}`;
    const item: TextItem = {
      id, text: "Your caption", preset: "headline", xf: 0.5, yf: 0.5,
      size: TEXT_PRESETS.headline.size, color: "#ffffff", rotation: 0,
    };
    setState((s) => ({ ...s, texts: [...s.texts, item] }));
    setSelectedTextId(id);
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
    try {
      await downloadCollage(state, photos);
      flash("Saved to your photos");
    } catch {
      flash("Export failed - try again");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      <header className="safe-t flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:mx-auto md:w-full md:max-w-3xl">
        <div className="flex items-center gap-2">
          <Mark className="size-7 text-ink" />
          <span className="text-lg font-semibold tracking-tight text-ink">Collage</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <DownloadIcon />
            {exporting ? "Saving…" : "Export"}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col md:mx-auto md:w-full md:max-w-3xl">
        <Canvas
          state={state}
          photos={photos}
          selectedCell={selectedCell}
          selectedTextId={selectedTextId}
          onSelectCell={(i) => { setSelectedCell(i); setSelectedTextId(null); }}
          onSelectText={setSelectedTextId}
          onMoveText={moveText}
          stageRef={stageRef}
        />
        {selectedText && (
          <TextToolbar text={selectedText} onUpdate={updateText} onDelete={deleteText} />
        )}
      </div>

      <BottomBar
        state={state}
        photos={photos}
        selectedCell={selectedCell}
        onSetLayout={setLayout}
        onPickPhoto={pickPhoto}
        onUpload={upload}
        onAddText={addText}
        onShuffle={shuffle}
        onSetStyle={(patch) => setState((s) => ({ ...s, ...patch }))}
      />

      <div
        aria-live="polite"
        className={`safe-b pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}
      >
        {toast && (
          <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg">{toast}</span>
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}
