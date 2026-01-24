import { describe, expect, it } from "vitest";
import {
  getSampleIndex,
  getSample,
  setSample,
  getHorizontalSlice,
  getVerticalSlice,
  getBandData,
} from "../dataset";
import type { Dataset } from "../types";

/**
 * Create a test dataset with predictable values.
 * Value at (az, pol, band) = az * 1000 + pol * 10 + band
 */
function createTestDataset(azCount: number, polCount: number, bandCount: number): Dataset {
  const samples = new Float32Array(azCount * polCount * bandCount);
  let idx = 0;
  for (let az = 0; az < azCount; az++) {
    for (let pol = 0; pol < polCount; pol++) {
      for (let band = 0; band < bandCount; band++) {
        samples[idx++] = az * 1000 + pol * 10 + band;
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

describe("getSampleIndex", () => {
  it("matches legacy formula: az * polar.count * bandCount + pol * bandCount + band", () => {
    const dataset = createTestDataset(36, 19, 30);

    // Test various combinations
    expect(getSampleIndex(dataset, 0, 0, 0)).toBe(0);
    expect(getSampleIndex(dataset, 0, 0, 1)).toBe(1);
    expect(getSampleIndex(dataset, 0, 1, 0)).toBe(30);
    expect(getSampleIndex(dataset, 1, 0, 0)).toBe(19 * 30);

    // General formula check
    const az = 5,
      pol = 10,
      band = 15;
    const expected = az * 19 * 30 + pol * 30 + band;
    expect(getSampleIndex(dataset, az, pol, band)).toBe(expected);
  });
});

describe("getSample", () => {
  it("retrieves the correct value from the samples array", () => {
    const dataset = createTestDataset(36, 19, 30);

    expect(getSample(dataset, 0, 0, 0)).toBe(0);
    expect(getSample(dataset, 5, 10, 15)).toBe(5 * 1000 + 10 * 10 + 15);
    expect(getSample(dataset, 35, 18, 29)).toBe(35 * 1000 + 18 * 10 + 29);
  });
});

describe("setSample", () => {
  it("modifies the samples array at the correct position", () => {
    const dataset = createTestDataset(36, 19, 30);

    setSample(dataset, 5, 10, 15, -999);
    expect(getSample(dataset, 5, 10, 15)).toBe(-999);

    // Other values should remain unchanged
    expect(getSample(dataset, 5, 10, 14)).toBe(5 * 1000 + 10 * 10 + 14);
    expect(getSample(dataset, 5, 10, 16)).toBe(5 * 1000 + 10 * 10 + 16);
  });
});

describe("getHorizontalSlice", () => {
  it("returns all polar values for azimuth=0", () => {
    const dataset = createTestDataset(36, 19, 30);
    const slice = getHorizontalSlice(dataset, 5);

    expect(slice.length).toBe(19);
    for (let pol = 0; pol < 19; pol++) {
      // az=0, band=5
      expect(slice[pol]).toBe(0 * 1000 + pol * 10 + 5);
    }
  });

  it("works with single-band dataset", () => {
    const dataset = createTestDataset(36, 19, 1);
    const slice = getHorizontalSlice(dataset, 0);

    expect(slice.length).toBe(19);
    expect(slice[0]).toBe(0);
    expect(slice[18]).toBe(180);
  });
});

describe("getVerticalSlice", () => {
  it("returns all polar values for azimuth=90°", () => {
    // With startDeg=0 and stepDeg=10, azimuth index 9 = 90°
    const dataset = createTestDataset(36, 19, 30);
    const slice = getVerticalSlice(dataset, 5);

    expect(slice.length).toBe(19);
    for (let pol = 0; pol < 19; pol++) {
      // az=9 (90°), band=5
      expect(slice[pol]).toBe(9 * 1000 + pol * 10 + 5);
    }
  });

  it("returns empty array when 90° azimuth does not exist", () => {
    // Only azimuth 0-80° available (9 values with step 10°)
    const dataset = createTestDataset(9, 19, 30);
    const slice = getVerticalSlice(dataset, 5);

    expect(slice.length).toBe(0);
  });
});

describe("getBandData", () => {
  it("returns all az×pol samples for a specific band", () => {
    const dataset = createTestDataset(36, 19, 30);
    const data = getBandData(dataset, 5);

    expect(data.length).toBe(36 * 19);

    let idx = 0;
    for (let az = 0; az < 36; az++) {
      for (let pol = 0; pol < 19; pol++) {
        expect(data[idx++]).toBe(az * 1000 + pol * 10 + 5);
      }
    }
  });
});

describe("edge cases", () => {
  it("handles single-value dataset", () => {
    const dataset = createTestDataset(1, 1, 1);
    expect(getSample(dataset, 0, 0, 0)).toBe(0);
    expect(getHorizontalSlice(dataset, 0)).toEqual(new Float32Array([0]));
    expect(getBandData(dataset, 0)).toEqual(new Float32Array([0]));
  });

  it("handles single-band dataset", () => {
    const dataset = createTestDataset(36, 19, 1);
    expect(getSample(dataset, 5, 10, 0)).toBe(5100);
    expect(getHorizontalSlice(dataset, 0).length).toBe(19);
    expect(getBandData(dataset, 0).length).toBe(36 * 19);
  });
});
