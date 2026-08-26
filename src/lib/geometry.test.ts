import { describe, expect, it } from "vitest";
import { clamp01, coverCrop, fitSize } from "./geometry";

describe("clamp01", () => {
  it("clamps below 0 and above 1", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.42)).toBe(0.42);
  });
});

describe("fitSize", () => {
  it("fits a square into a wide box by height", () => {
    expect(fitSize(1, 1, 800, 400)).toEqual({ w: 400, h: 400 });
  });
  it("fits a portrait into a short box by height", () => {
    expect(fitSize(4, 5, 1000, 500)).toEqual({ w: 400, h: 500 });
  });
  it("preserves the aspect ratio", () => {
    const { w, h } = fitSize(9, 16, 500, 900);
    expect(w / h).toBeCloseTo(9 / 16, 2);
  });
  it("returns zero for a degenerate box", () => {
    expect(fitSize(1, 1, 0, 500)).toEqual({ w: 0, h: 0 });
    expect(fitSize(1, 1, 500, -1)).toEqual({ w: 0, h: 0 });
  });
});

describe("coverCrop", () => {
  it("crops the sides of a wide image into a square box", () => {
    const c = coverCrop(200, 100, 100, 100);
    expect(c.sw).toBe(100);
    expect(c.sh).toBe(100);
    expect(c.sx).toBe(50);
    expect(c.sy).toBe(0);
  });
  it("crops the top/bottom of a tall image into a square box", () => {
    const c = coverCrop(100, 200, 100, 100);
    expect(c.sw).toBe(100);
    expect(c.sh).toBe(100);
    expect(c.sy).toBe(50);
    expect(c.sx).toBe(0);
  });
  it("never crops when the aspect already matches", () => {
    const c = coverCrop(400, 500, 80, 100);
    expect(c).toEqual({ sx: 0, sy: 0, sw: 400, sh: 500 });
  });
});
