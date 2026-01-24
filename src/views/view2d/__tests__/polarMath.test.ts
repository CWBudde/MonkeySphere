import { describe, expect, it } from "vitest";

import { buildSlicePoints, polarToCartesian, shouldClosePath } from "../polarMath";

const axis = { startDeg: 0, stepDeg: 90, count: 4 };

describe("polarMath", () => {
  it("converts polar to cartesian coordinates", () => {
    const point0 = polarToCartesian(0, 10);
    const point90 = polarToCartesian(90, 10);
    const point180 = polarToCartesian(180, 10);

    expect(point0.x).toBeCloseTo(10);
    expect(point0.y).toBeCloseTo(0);
    expect(point90.x).toBeCloseTo(0);
    expect(point90.y).toBeCloseTo(-10);
    expect(point180.x).toBeCloseTo(-10);
    expect(point180.y).toBeCloseTo(0);
  });

  it("builds slice points with normalized radii", () => {
    const values = new Float32Array([0, -6, -12, -18]);
    const points = buildSlicePoints(values, {
      axis,
      radius: 10,
      directionOffsetDeg: 0,
      minDb: -18,
      maxDb: 0,
      rangeDb: 24,
    });

    expect(points.map((point) => [point.x, point.y])).toMatchInlineSnapshot(`
      [
        [
          10,
          0,
        ],
        [
          0,
          -7.5,
        ],
        [
          -5,
          -0,
        ],
        [
          -0,
          2.5,
        ],
      ]
    `);
  });

  it("detects when a path should be closed", () => {
    expect(shouldClosePath(axis)).toBe(false);
    expect(shouldClosePath({ startDeg: 0, stepDeg: 10, count: 37 })).toBe(true);
  });
});
