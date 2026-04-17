import type { Dataset } from "../../domain/dataset/types";

type AzimuthSampling = {
  angles: number[];
  wrap: boolean;
  mapAngleToIndex: (angleDeg: number) => number;
};

export function createAzimuthSampling(dataset: Dataset): AzimuthSampling {
  const axis = dataset.azimuth;
  const step = axis.stepDeg === 0 ? 1 : axis.stepDeg;
  const absStep = Math.abs(step);
  const axisSpan = absStep * Math.max(0, axis.count - 1);
  const isFull = dataset.sphereMode === "full";

  if (isFull || axis.count <= 1 || axisSpan === 0) {
    const angles = Array.from({ length: axis.count }, (_, index) => axis.startDeg + step * index);
    const wrap =
      isFull && axis.count > 2 && axisSpan >= 360 - absStep * 0.5;
    return {
      angles,
      wrap,
      mapAngleToIndex: (angleDeg) =>
        clampIndex(angleToIndex(axis, angleDeg), axis.count),
    };
  }

  const virtualCount = Math.max(2, Math.round(360 / absStep));
  const angles = Array.from({ length: virtualCount }, (_, index) => index * absStep);

  return {
    angles,
    wrap: true,
    mapAngleToIndex: (angleDeg) => {
      const folded = foldAngle(angleDeg, axis.startDeg, axisSpan);
      return clampIndex(angleToIndex(axis, folded), axis.count);
    },
  };
}

function angleToIndex(axis: Dataset["azimuth"], angleDeg: number): number {
  const step = axis.stepDeg === 0 ? 1 : axis.stepDeg;
  return Math.round((angleDeg - axis.startDeg) / step);
}

function clampIndex(value: number, count: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, Math.max(0, count - 1)));
}

function foldAngle(angleDeg: number, startDeg: number, spanDeg: number): number {
  if (spanDeg <= 0) return startDeg;
  const fullSpan = spanDeg * 2;
  let relative = angleDeg - startDeg;
  relative = ((relative % fullSpan) + fullSpan) % fullSpan;
  if (relative > spanDeg) {
    relative = fullSpan - relative;
  }
  return startDeg + relative;
}
