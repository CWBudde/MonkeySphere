import type { Dataset } from "./types";

export type CoverageThresholdDb = 3 | 6 | 9;

export type CoverageResult = {
  // For each threshold and azimuth index, store the polar index where level crosses threshold.
  // This matches legacy semantics closely (index-based). Convert to degrees at the view layer.
  indices: Record<CoverageThresholdDb, Uint16Array>;
};

export function computeCoverage(_dataset: Dataset, _band: number): CoverageResult {
  // TODO: Port CalcCoverage from legacy/Source/MBMain.pas
  return {
    indices: {
      3: new Uint16Array(0),
      6: new Uint16Array(0),
      9: new Uint16Array(0),
    },
  };
}
