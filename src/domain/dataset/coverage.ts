import { getSample } from "./dataset";
import type { Dataset } from "./types";

export type CoverageResult = {
  thresholds: number[];
  // indices[thresholdIndex][bandIndex][azimuthIndex] -> polar index (fractional)
  indices: number[][][];
};

export function calcCoverage(dataset: Dataset, thresholds: number[]): CoverageResult {
  const azCount = dataset.azimuth.count;
  const polCount = dataset.polar.count;
  const bandCount = dataset.freq.bandCount;

  const indices = thresholds.map(() =>
    Array.from({ length: bandCount }, () => new Array<number>(azCount).fill(polCount)),
  );

  if (azCount === 0 || polCount === 0 || bandCount === 0) {
    return { thresholds: [...thresholds], indices };
  }

  for (let band = 0; band < bandCount; band++) {
    const startGain = getSample(dataset, 0, 0, band);

    for (let az = 0; az < azCount; az++) {
      for (let t = 0; t < thresholds.length; t++) {
        const threshold = thresholds[t];
        let coverageIndex = polCount;

        for (let pol = 1; pol < polCount; pol++) {
          const current = getSample(dataset, az, pol, band);
          if (startGain - current > threshold) {
            const prev = getSample(dataset, az, pol - 1, band);
            const delta = prev - current;
            if (delta !== 0) {
              coverageIndex = pol - (startGain - threshold - current) / delta;
            } else {
              coverageIndex = pol;
            }
            break;
          }
        }

        indices[t][band][az] = coverageIndex;
      }
    }
  }

  return { thresholds: [...thresholds], indices };
}

export function getCoverageIndex(
  result: CoverageResult,
  threshold: number,
  bandIndex: number,
  azimuthIndex: number,
): number {
  const thresholdIndex = result.thresholds.indexOf(threshold);
  if (thresholdIndex === -1) {
    throw new Error(`Threshold ${threshold} dB not found in coverage result.`);
  }
  return result.indices[thresholdIndex][bandIndex][azimuthIndex];
}

export function getCoverageAngle(
  dataset: Dataset,
  result: CoverageResult,
  threshold: number,
  bandIndex: number,
  azimuthIndex: number,
): number {
  const polIndex = getCoverageIndex(result, threshold, bandIndex, azimuthIndex);
  return dataset.polar.startDeg + polIndex * dataset.polar.stepDeg;
}

export function getCoverageContour(
  dataset: Dataset,
  result: CoverageResult,
  threshold: number,
  bandIndex: number,
): { az: number; pol: number }[] {
  const azCount = dataset.azimuth.count;
  const contour: { az: number; pol: number }[] = [];
  for (let az = 0; az < azCount; az++) {
    contour.push({
      az: dataset.azimuth.startDeg + az * dataset.azimuth.stepDeg,
      pol: getCoverageAngle(dataset, result, threshold, bandIndex, az),
    });
  }
  return contour;
}
