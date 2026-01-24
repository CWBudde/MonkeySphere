export type AxisDef = {
  /** Start angle in degrees */
  startDeg: number;
  /** Step size in degrees */
  stepDeg: number;
  /** Number of values/samples along this axis */
  count: number;
};

export type FreqDef = {
  /** Start frequency in Hz */
  startHz: number;
  /** Bands per octave (1, 3, 4, 10, 12, or 24) */
  bandsPerOctave: number;
  /** Total number of frequency bands */
  bandCount: number;
};

export type SphereMode = "quarter" | "half" | "full" | "horizontal" | "vertical";

export type DatasetMeta = {
  name?: string;
  manufacturer?: string;
  date?: string;
  notes?: string;
};

export type SpectrumData = {
  /** Per-band spectrum arrays (optional, from `spec` chunk) */
  data: Float32Array[];
};

export type Dataset = {
  azimuth: AxisDef;
  polar: AxisDef;
  freq: FreqDef;
  sphereMode: SphereMode;
  samples: Float32Array;
  meta: DatasetMeta;
  spectrum?: SpectrumData;
};

// --- Axis Helpers ---

/**
 * Calculate the frequency in Hz for a given band index.
 * Uses the formula: f_i = startHz * 2^(bandIndex / bandsPerOctave)
 */
export function getFrequencyAtBand(freq: FreqDef, bandIndex: number): number {
  return freq.startHz * Math.pow(2, bandIndex / freq.bandsPerOctave);
}

/**
 * Calculate the angle in degrees for a given axis index.
 */
export function getAngleAtIndex(axis: AxisDef, index: number): number {
  return axis.startDeg + index * axis.stepDeg;
}
