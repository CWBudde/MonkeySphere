import { useMemo } from "react";
import * as THREE from "three";

import { calcCoverage, getCoverageContour } from "../../domain/coverage";
import type { Dataset } from "../../domain/dataset/types";
import { getSample } from "../../domain/dataset/dataset";
import { computeMaximum, computeMinimum } from "../../domain/normalize";

type CoverageOverlayProps = {
  dataset: Dataset;
  bandIndex: number;
  thresholds: number[];
  colors: Record<number, string>;
  opacity: number;
  heightScale: number;
};

const BASE_RADIUS = 0.6;
const MAX_SCALE = 1.4;

export function CoverageOverlay({
  dataset,
  bandIndex,
  thresholds,
  colors,
  opacity,
  heightScale,
}: CoverageOverlayProps) {
  const coverage = useMemo(() => calcCoverage(dataset, thresholds), [dataset, thresholds]);

  const overlays = useMemo(() => {
    const azCount = dataset.azimuth.count;
    const polCount = dataset.polar.count;
    if (azCount === 0 || polCount === 0) return [];

    const minDb = computeMinimum(dataset, bandIndex);
    const maxDb = computeMaximum(dataset, bandIndex);
    const range = maxDb - minDb;
    const scaleFactor = 1 + (MAX_SCALE - 1) * Math.max(0, heightScale);

    const clampPol = (value: number) => Math.max(0, Math.min(value, polCount - 1));

    return thresholds.map((threshold) => {
      const contour = getCoverageContour(dataset, coverage, threshold, bandIndex);
      const positions = new Float32Array(contour.length * 3);

      let idx = 0;
      contour.forEach((point, index) => {
        const azRad = (point.az * Math.PI) / 180;
        const polIndex = clampPol((point.pol - dataset.polar.startDeg) / dataset.polar.stepDeg);
        const polRad = ((dataset.polar.startDeg + polIndex * dataset.polar.stepDeg) * Math.PI) / 180;

        const azIndex = Math.min(
          azCount - 1,
          Math.max(0, Math.round((point.az - dataset.azimuth.startDeg) / dataset.azimuth.stepDeg)),
        );

        const polFloor = Math.floor(polIndex);
        const polCeil = Math.min(polFloor + 1, polCount - 1);
        const t = polIndex - polFloor;
        const sampleA = getSample(dataset, azIndex, polFloor, bandIndex);
        const sampleB = getSample(dataset, azIndex, polCeil, bandIndex);
        const sample = sampleA + (sampleB - sampleA) * t;

        const normalized = range > 0 ? (sample - minDb) / range : 0;
        const scaled = Math.min(Math.max(normalized, 0), 1) * (scaleFactor - 1) + 1;
        const radius = BASE_RADIUS * scaled;

        const sinPol = Math.sin(polRad);
        const cosPol = Math.cos(polRad);
        const cosAz = Math.cos(azRad);
        const sinAz = Math.sin(azRad);

        positions[idx++] = radius * sinPol * cosAz;
        positions[idx++] = radius * cosPol;
        positions[idx++] = radius * sinPol * sinAz;
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      return { threshold, geometry };
    });
  }, [dataset, bandIndex, coverage, thresholds, heightScale]);

  return (
    <group>
      {overlays.map((overlay) => (
        <lineLoop key={overlay.threshold} geometry={overlay.geometry}>
          <lineBasicMaterial
            color={colors[overlay.threshold] ?? "#ffffff"}
            transparent
            opacity={opacity}
          />
        </lineLoop>
      ))}
    </group>
  );
}
