import { describe, expect, it } from "vitest";
import { BACKGROUNDS, getBackground, getLayout, LAYOUTS, TEXT_PRESETS } from "./layouts";
import { GALLERY } from "./gallery";

describe("layouts", () => {
  it("every layout has at least one cell and a valid aspect", () => {
    for (const l of LAYOUTS) {
      expect(l.cells.length).toBeGreaterThan(0);
      expect(l.aspect[0]).toBeGreaterThan(0);
      expect(l.aspect[1]).toBeGreaterThan(0);
    }
  });

  it("cells stay within the unit square", () => {
    for (const l of LAYOUTS) {
      for (const c of l.cells) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w).toBeLessThanOrEqual(1.0001);
        expect(c.y + c.h).toBeLessThanOrEqual(1.0001);
      }
    }
  });

  it("layout ids are unique", () => {
    const ids = LAYOUTS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getLayout falls back to the first layout for unknown ids", () => {
    expect(getLayout("does-not-exist")).toBe(LAYOUTS[0]);
    expect(getLayout("single").id).toBe("single");
  });

  it("getBackground falls back for unknown ids", () => {
    expect(getBackground("nope")).toBe(BACKGROUNDS[0]);
    expect(getBackground("ink").id).toBe("ink");
  });
});

describe("text presets", () => {
  it("defines all four named presets with sane sizes", () => {
    for (const key of ["headline", "caption", "sticker", "signature"] as const) {
      const p = TEXT_PRESETS[key];
      expect(p.size).toBeGreaterThan(0);
      expect(p.size).toBeLessThan(0.5);
      expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("gallery", () => {
  it("ships several pieces with unique ids", () => {
    expect(GALLERY.length).toBeGreaterThanOrEqual(8);
    const ids = GALLERY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every piece is a self-contained svg data URI", () => {
    for (const g of GALLERY) {
      expect(g.src.startsWith("data:image/svg+xml,")).toBe(true);
      expect(g.src).not.toContain("http://");
      expect(g.src).not.toContain("https://");
    }
  });
});
