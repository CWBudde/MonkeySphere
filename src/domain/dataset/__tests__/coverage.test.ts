import { describe, expect, it } from "vitest";
import type { Dataset } from "../types";
import {
  calcCoverage,
  getCoverageAngle,
  getCoverageContour,
  getCoverageIndex,
} from "../coverage";

function createFalloffDataset(azCount: number, polCount: number, bandCount: number): Dataset {
  const samples = new Float32Array(azCount * polCount * bandCount);
  let idx = 0;
  for (let az = 0; az < azCount; az++) {
    for (let pol = 0; pol < polCount; pol++) {
      for (let band = 0; band < bandCount; band++) {
        samples[idx++] = -pol * 2 - az * 1 - band * 4;
      }
    }
  }

  return {
    azimuth: { startDeg: 0, stepDeg: 10, count: azCount },
    polar: { startDeg: 0, stepDeg: 5, count: polCount },
    freq: { startHz: 100, bandsPerOctave: 3, bandCount: bandCount },
    sphereMode: "full",
    samples,
    meta: {},
  };
}

function createFlatDataset(azCount: number, polCount: number, bandCount: number): Dataset {
  return {
    azimuth: { startDeg: 0, stepDeg: 10, count: azCount },
    polar: { startDeg: 0, stepDeg: 5, count: polCount },
    freq: { startHz: 100, bandsPerOctave: 3, bandCount: bandCount },
    sphereMode: "full",
    samples: new Float32Array(azCount * polCount * bandCount),
    meta: {},
  };
}

describe("calcCoverage", () => {
  it("calculates fractional polar indices for thresholds", () => {
    const dataset = createFalloffDataset(3, 6, 2);
    const result = calcCoverage(dataset, [3, 6, 9]);

    expect(getCoverageIndex(result, 3, 0, 0)).toBeCloseTo(1.5, 5);
    expect(getCoverageIndex(result, 6, 0, 0)).toBeCloseTo(3, 5);
    expect(getCoverageIndex(result, 9, 0, 0)).toBeCloseTo(4.5, 5);

    expect(getCoverageIndex(result, 3, 0, 1)).toBeCloseTo(1, 5);
    expect(getCoverageIndex(result, 6, 0, 1)).toBeCloseTo(2.5, 5);
    expect(getCoverageIndex(result, 9, 0, 1)).toBeCloseTo(4, 5);
  });

  it("returns max index when response never drops", () => {
    const dataset = createFlatDataset(2, 5, 1);
    const result = calcCoverage(dataset, [3, 6, 9]);

    for (const threshold of [3, 6, 9]) {
      for (let az = 0; az < 2; az++) {
        expect(getCoverageIndex(result, threshold, 0, az)).toBe(5);
      }
    }
  });
});

describe("coverage helpers", () => {
  it("converts coverage index to angle and contour", () => {
    const dataset = createFalloffDataset(3, 6, 1);
    const result = calcCoverage(dataset, [3, 6, 9]);

    const angle = getCoverageAngle(dataset, result, 3, 0, 0);
    expect(angle).toBeCloseTo(7.5, 5);

    const contour = getCoverageContour(dataset, result, 3, 0);
    expect(contour.length).toBe(3);
    expect(contour[0].az).toBe(0);
    expect(contour[0].pol).toBeCloseTo(7.5, 5);
  });
});
