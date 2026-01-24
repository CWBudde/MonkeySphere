import { describe, expect, it } from "vitest";
import { thirdOctaveFrequency, thirdOctaveIndex } from "../thirdOctave";

const TERZ_TABLE = [
  10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
  1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000, 25000,
  31500, 40000, 50000, 63000, 80000, 100000,
];

describe("thirdOctaveFrequency", () => {
  it("tracks the legacy table within 1%", () => {
    TERZ_TABLE.forEach((expected, index) => {
      const computed = thirdOctaveFrequency(index);
      const relativeError = Math.abs(computed - expected) / expected;
      expect(relativeError).toBeLessThanOrEqual(0.01);
    });
  });
});

describe("thirdOctaveIndex", () => {
  it("maps legacy cThirdOctaveTab values back to indices", () => {
    TERZ_TABLE.forEach((frequency, index) => {
      expect(thirdOctaveIndex(frequency)).toBe(index);
    });
  });

  it("round-trips with thirdOctaveFrequency", () => {
    for (let index = 0; index <= 40; index += 1) {
      const frequency = thirdOctaveFrequency(index);
      expect(thirdOctaveIndex(frequency)).toBe(index);
    }
  });
});
