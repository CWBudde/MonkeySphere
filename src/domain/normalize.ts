import type { Dataset } from "./dataset/types";
import { getBandData } from "./dataset/dataset";
import { clamp } from "../utils/math";

export function computeMaximum(dataset: Dataset, bandIndex: number): number {
  const data = getBandData(dataset, bandIndex);
  let max = Number.NEGATIVE_INFINITY;
  for (const value of data) {
    if (value > max) max = value;
  }
  return Number.isFinite(max) ? max : 0;
}

export function computeMinimum(dataset: Dataset, bandIndex: number): number {
  const data = getBandData(dataset, bandIndex);
  let min = Number.POSITIVE_INFINITY;
  for (const value of data) {
    if (value < min) min = value;
  }
  return Number.isFinite(min) ? min : 0;
}

export function normalizeValue(
  value: number,
  min: number,
  max: number,
  range: number,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return 0;
  if (range <= 0) return 0;
  const lowerBound = Math.min(min, max - range);
  return clamp((value - lowerBound) / range, 0, 1);
}
