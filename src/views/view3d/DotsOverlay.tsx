import { useMemo } from "react";
import * as THREE from "three";

import type { Dataset } from "../../domain/dataset/types";
import { getSample } from "../../domain/dataset/dataset";
import { computeMaximum, computeMinimum } from "../../domain/normalize";
import { createAzimuthSampling } from "./azimuthSampling";

type DotsOverlayProps = {
  dataset: Dataset;
  bandIndex: number;
  color: string;
  size: number;
  heightScale: number;
};

const BASE_RADIUS = 0.6;
const MAX_SCALE = 1.4;

export function DotsOverlay({
  dataset,
  bandIndex,
  color,
  size,
  heightScale,
}: DotsOverlayProps) {
  const geometry = useMemo(() => {
    const sampling = createAzimuthSampling(dataset);
    const azCount = sampling.angles.length;
    const polCount = dataset.polar.count;
    const vertexCount = azCount * polCount;
    const positions = new Float32Array(vertexCount * 3);

    const minDb = computeMinimum(dataset, bandIndex);
    const maxDb = computeMaximum(dataset, bandIndex);
    const range = maxDb - minDb;
    const scaleFactor = 1 + (MAX_SCALE - 1) * Math.max(0, heightScale);

    const polStart = dataset.polar.startDeg;
    const polStep = dataset.polar.stepDeg;

    let index = 0;
    for (let az = 0; az < azCount; az++) {
      const azDeg = sampling.angles[az];
      const azIndex = sampling.mapAngleToIndex(azDeg);
      const azRad = (azDeg * Math.PI) / 180;
      const cosAz = Math.cos(azRad);
      const sinAz = Math.sin(azRad);

      for (let pol = 0; pol < polCount; pol++) {
        const polDeg = polStart + pol * polStep;
        const polRad = (polDeg * Math.PI) / 180;
        const sinPol = Math.sin(polRad);
        const cosPol = Math.cos(polRad);

        const sample = getSample(dataset, azIndex, pol, bandIndex);
        const normalized = range > 0 ? (sample - minDb) / range : 0;
        const scaled = Math.min(Math.max(normalized, 0), 1) * (scaleFactor - 1) + 1;
        const radius = BASE_RADIUS * scaled;

        positions[index++] = radius * sinPol * cosAz;
        positions[index++] = radius * cosPol;
        positions[index++] = radius * sinPol * sinAz;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [dataset, bandIndex, heightScale]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color={color} size={size} sizeAttenuation />
    </points>
  );
}
