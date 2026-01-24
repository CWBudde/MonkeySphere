import { describe, expect, it } from "vitest";

import type { Dataset } from "../dataset/types";
import { computeMaximum, computeMinimum, normalizeValue } from "../normalize";

const baseDataset: Dataset = {
  azimuth: { startDeg: 0, stepDeg: 90, count: 2 },
  polar: { startDeg: 0, stepDeg: 90, count: 2 },
  freq: { startHz: 100, bandsPerOctave: 3, bandCount: 2 },
  sphereMode: "full",
  samples: new Float32Array([
    0, -3, // az0 pol0
    -6, -9, // az0 pol1
    1, -2, // az1 pol0
    -5, -8, // az1 pol1
  ]),
  meta: {},
};

describe("normalize", () => {
  it("computes band minimum and maximum", () => {
    expect(computeMaximum(baseDataset, 0)).toBe(1);
    expect(computeMinimum(baseDataset, 0)).toBe(-6);
    expect(computeMaximum(baseDataset, 1)).toBe(-2);
    expect(computeMinimum(baseDataset, 1)).toBe(-9);
  });

  it("normalizes values within a range", () => {
    const max = 0;
    const min = -12;
    const range = 12;
    expect(normalizeValue(0, min, max, range)).toBeCloseTo(1);
    expect(normalizeValue(-6, min, max, range)).toBeCloseTo(0.5);
    expect(normalizeValue(-12, min, max, range)).toBeCloseTo(0);
  });

  it("clamps values outside the range", () => {
    const max = 0;
    const min = -12;
    const range = 12;
    expect(normalizeValue(6, min, max, range)).toBe(1);
    expect(normalizeValue(-18, min, max, range)).toBe(0);
  });
});
