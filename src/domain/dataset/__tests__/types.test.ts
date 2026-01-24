import { describe, expect, it } from "vitest";
import { getFrequencyAtBand, getAngleAtIndex, type AxisDef, type FreqDef } from "../types";

describe("getFrequencyAtBand", () => {
  it("returns startHz for band index 0", () => {
    const freq: FreqDef = { startHz: 100, bandsPerOctave: 3, bandCount: 30 };
    expect(getFrequencyAtBand(freq, 0)).toBe(100);
  });

  it("doubles frequency after bandsPerOctave steps", () => {
    const freq: FreqDef = { startHz: 100, bandsPerOctave: 3, bandCount: 30 };
    // After 3 bands (one octave), frequency should double
    expect(getFrequencyAtBand(freq, 3)).toBeCloseTo(200, 5);
  });

  it("calculates third-octave frequencies correctly", () => {
    const freq: FreqDef = { startHz: 1000, bandsPerOctave: 3, bandCount: 10 };
    // Third-octave: 1000 -> 1260 -> 1587 -> 2000 (approx)
    expect(getFrequencyAtBand(freq, 0)).toBeCloseTo(1000, 1);
    expect(getFrequencyAtBand(freq, 1)).toBeCloseTo(1260, 0);
    expect(getFrequencyAtBand(freq, 2)).toBeCloseTo(1587, 0);
    expect(getFrequencyAtBand(freq, 3)).toBeCloseTo(2000, 1);
  });

  it("works with 1 band per octave (full octave steps)", () => {
    const freq: FreqDef = { startHz: 100, bandsPerOctave: 1, bandCount: 5 };
    expect(getFrequencyAtBand(freq, 0)).toBe(100);
    expect(getFrequencyAtBand(freq, 1)).toBe(200);
    expect(getFrequencyAtBand(freq, 2)).toBe(400);
    expect(getFrequencyAtBand(freq, 3)).toBe(800);
  });

  it("works with 12 bands per octave (semitones)", () => {
    const freq: FreqDef = { startHz: 440, bandsPerOctave: 12, bandCount: 24 };
    // 12 semitones = one octave = double frequency
    expect(getFrequencyAtBand(freq, 12)).toBeCloseTo(880, 5);
  });
});

describe("getAngleAtIndex", () => {
  it("returns startDeg for index 0", () => {
    const axis: AxisDef = { startDeg: 0, stepDeg: 5, count: 72 };
    expect(getAngleAtIndex(axis, 0)).toBe(0);
  });

  it("calculates angle correctly with positive step", () => {
    const axis: AxisDef = { startDeg: 0, stepDeg: 5, count: 72 };
    expect(getAngleAtIndex(axis, 1)).toBe(5);
    expect(getAngleAtIndex(axis, 10)).toBe(50);
    expect(getAngleAtIndex(axis, 36)).toBe(180);
  });

  it("handles non-zero start angle", () => {
    const axis: AxisDef = { startDeg: -90, stepDeg: 5, count: 37 };
    expect(getAngleAtIndex(axis, 0)).toBe(-90);
    expect(getAngleAtIndex(axis, 18)).toBe(0);
    expect(getAngleAtIndex(axis, 36)).toBe(90);
  });

  it("handles negative step (descending angles)", () => {
    const axis: AxisDef = { startDeg: 90, stepDeg: -5, count: 37 };
    expect(getAngleAtIndex(axis, 0)).toBe(90);
    expect(getAngleAtIndex(axis, 18)).toBe(0);
    expect(getAngleAtIndex(axis, 36)).toBe(-90);
  });

  it("handles 1-degree resolution", () => {
    const axis: AxisDef = { startDeg: 0, stepDeg: 1, count: 360 };
    expect(getAngleAtIndex(axis, 90)).toBe(90);
    expect(getAngleAtIndex(axis, 180)).toBe(180);
    expect(getAngleAtIndex(axis, 359)).toBe(359);
  });
});
