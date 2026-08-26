"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { Mark } from "./Mark";
import { ThemeToggle } from "./ThemeToggle";
import { Tray } from "./Tray";
import { GALLERY } from "@/lib/gallery";
import { TEXT_PRESETS } from "@/lib/layouts";
import { downloadCollage } from "@/lib/export";
import { clamp01 } from "@/lib/geometry";
import type { CollageState, Photo, TextItem, TextPreset } from "@/lib/types";

const INITIAL: CollageState = {
  layoutId: "trio",
  filled: { 0: "ember", 1: "tide", 2: "gold" },
  texts: [
    {
      id: "t0",
      text: "Golden hour",
      preset: "headline",
      xf: 0.42,
      yf: 0.87,
      size: 0.092,
      color: "#fffaf5",
      rotation: -3,
    },
  ],
  gap: 20,
  radius: 26,
  bgId: "ink",
};

export function Editor() {
  const [state, setState] = useState<CollageState>(INITIAL);
  const [uploads, setUploads] = useState<Photo[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(1);
  const stageRef = useRef<HTMLDivElement>(null);

  const photos = useMemo(() => [...uploads, ...GALLERY], [uploads]);
  const selectedText =
    state.texts.find((t) => t.id === selectedTextId) ?? null;

  // Keyboard control for the selected text: nudge with arrows, remove with
  // Backspace/Delete. Ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedTextId) return;
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      const step = e.shiftKey ? 0.05 : 0.01;
      const t = state.texts.find((x) => x.id === selectedTextId);
      if (!t) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        deleteText();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveText(t.id, clamp01(t.xf - step), t.yf);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveText(t.id, clamp01(t.xf + step), t.yf);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveText(t.id, t.xf, clamp01(t.yf - step));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveText(t.id, t.xf, clamp01(t.yf + step));
      } else if (e.key === "Escape") {
        setSelectedTextId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTextId, state.texts]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function place(cellIndex: number) {
    if (!activePhotoId) return;
    setState((s) => ({
      ...s,
      filled: { ...s.filled, [cellIndex]: activePhotoId },
    }));
    setActivePhotoId(null);
  }

  function upload(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    let first: string | null = null;
    let pending = list.length;
    if (pending === 0) return;
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const id = `u${idRef.current++}`;
        if (!first) first = id;
        setUploads((u) => [{ id, name: file.name, src: String(reader.result), uploaded: true }, ...u]);
        if (--pending === 0 && first) setActivePhotoId(first);
      };
      reader.readAsDataURL(file);
    });
  }

  function addText(preset: TextPreset) {
    const id = `t${idRef.current++}`;
    const item: TextItem = {
      id,
      text: TEXT_PRESETS[preset].label,
      preset,
      xf: 0.5,
      yf: 0.5,
      size: TEXT_PRESETS[preset].size,
      color: TEXT_PRESETS[preset].color,
      rotation: 0,
    };
    setState((s) => ({ ...s, texts: [...s.texts, item] }));
    setSelectedTextId(id);
  }

  function updateText(patch: Partial<TextItem>) {
    if (!selectedTextId) return;
    setState((s) => ({
      ...s,
      texts: s.texts.map((t) => (t.id === selectedTextId ? { ...t, ...patch } : t)),
    }));
  }

  function moveText(id: string, xf: number, yf: number) {
    setState((s) => ({
      ...s,
      texts: s.texts.map((t) => (t.id === id ? { ...t, xf, yf } : t)),
    }));
  }

  function deleteText() {
    if (!selectedTextId) return;
    setState((s) => ({ ...s, texts: s.texts.filter((t) => t.id !== selectedTextId) }));
    setSelectedTextId(null);
  }

  async function onExport() {
    setExporting(true);
    try {
      await downloadCollage(state, photos);
      flash("Saved to your downloads");
    } catch {
      flash("Export failed - try again");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-paper">
      <header className="safe-t flex shrink-0 items-center justify-between gap-3 border-b hair px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Mark className="size-7 text-ink" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Collage
          </span>
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
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Canvas
          state={state}
          photos={photos}
          activePhotoId={activePhotoId}
          selectedTextId={selectedTextId}
          onPlace={place}
          onSelectText={setSelectedTextId}
          onMoveText={moveText}
          stageRef={stageRef}
        />
        <Tray
          state={state}
          photos={photos}
          activePhotoId={activePhotoId}
          selectedText={selectedText}
          onPickPhoto={(id) => setActivePhotoId((cur) => (cur === id ? null : id))}
          onUpload={upload}
          onSetLayout={(id) => setState((s) => ({ ...s, layoutId: id }))}
          onAddText={addText}
          onUpdateText={updateText}
          onDeleteText={deleteText}
          onSetStyle={(patch) => setState((s) => ({ ...s, ...patch }))}
        />
      </div>

      <div
        aria-live="polite"
        className={`safe-b pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center transition-opacity ${
          toast ? "opacity-100" : "opacity-0"
        }`}
      >
        {toast && (
          <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg">
            {toast}
          </span>
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
