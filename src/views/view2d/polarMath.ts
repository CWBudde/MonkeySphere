import type { AxisDef } from "../../domain/dataset/types";
import { getAngleAtIndex } from "../../domain/dataset/types";
import { normalizeValue } from "../../domain/normalize";

export type PolarPoint = {
  x: number;
  y: number;
};

export type SlicePoint = PolarPoint & {
  angleDeg: number;
  value: number;
  normalized: number;
};

export type SlicePointOptions = {
  axis: AxisDef;
  radius: number;
  directionOffsetDeg: number;
  minDb: number;
  maxDb: number;
  rangeDb: number;
};

export function polarToCartesian(angleDeg: number, radius: number): PolarPoint {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: -Math.sin(radians) * radius,
  };
}

export function buildSlicePoints(
  values: Float32Array,
  options: SlicePointOptions,
): SlicePoint[] {
  const { axis, radius, directionOffsetDeg, minDb, maxDb, rangeDb } = options;
  const points: SlicePoint[] = [];

  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    const angleDeg = getAngleAtIndex(axis, index) + directionOffsetDeg;
    const normalized = normalizeValue(value, minDb, maxDb, rangeDb);
    const point = polarToCartesian(angleDeg, normalized * radius);
    points.push({ angleDeg, value, normalized, ...point });
  }

  return points;
}

export function shouldClosePath(axis: AxisDef): boolean {
  const span = (axis.count - 1) * axis.stepDeg;
  return span >= 359.5;
}

export function resolveDirectionOffset(direction: string): number {
  switch (direction) {
    case "back":
      return 180;
    case "left":
      return -90;
    case "right":
      return 90;
    case "front":
    default:
      return 0;
  }
}
