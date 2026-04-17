import { describe, expect, it } from "vitest";

import { availableColormaps, createColormap, sampleColormap } from "../colormap";

describe("colormap", () => {
  it("exposes expected colormap names", () => {
    expect(availableColormaps).toEqual(["rainbow", "thermal", "grayscale"]);
  });

  it("creates grayscale map", () => {
    const map = createColormap("grayscale");
    expect(map(0)).toEqual([0, 0, 0]);
    expect(map(1)).toEqual([1, 1, 1]);
  });

  it("clamps sample range in sampleColormap", () => {
    const map = createColormap("grayscale");
    expect(sampleColormap(map, -10, 0, 1)).toEqual([0, 0, 0]);
    expect(sampleColormap(map, 2, 0, 1)).toEqual([1, 1, 1]);
  });

  it("returns a color for thermal", () => {
    const map = createColormap("thermal");
    const color = map(0.5);
    expect(color.length).toBe(3);
    color.forEach((channel) => {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(1);
    });
  });
});
