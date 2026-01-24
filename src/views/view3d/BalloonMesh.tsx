import { useMemo } from "react";
import * as THREE from "three";

import type { Dataset } from "../../domain/dataset/types";
import { getSample } from "../../domain/dataset/dataset";
import { createColormap, sampleColormap } from "../../domain/colormap";
import { computeMaximum, computeMinimum } from "../../domain/normalize";

type BalloonMeshProps = {
  dataset: Dataset;
  bandIndex: number;
  colormap: "rainbow" | "thermal" | "grayscale";
  wireframe: boolean;
  heightScale: number;
};

const BASE_RADIUS = 0.6;
const MAX_SCALE = 1.4;

export function BalloonMesh({
  dataset,
  bandIndex,
  colormap,
  wireframe,
  heightScale,
}: BalloonMeshProps) {
  const geometry = useMemo(() => {
    const azCount = dataset.azimuth.count;
    const polCount = dataset.polar.count;

    const vertexCount = azCount * polCount;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);

    const minDb = computeMinimum(dataset, bandIndex);
    const maxDb = computeMaximum(dataset, bandIndex);
    const range = maxDb - minDb;
    const scaleFactor = 1 + (MAX_SCALE - 1) * Math.max(0, heightScale);
    const mapSample = createColormap(colormap);

    const azStart = dataset.azimuth.startDeg;
    const azStep = dataset.azimuth.stepDeg;
    const polStart = dataset.polar.startDeg;
    const polStep = dataset.polar.stepDeg;

    let vertexIndex = 0;
    let colorIndex = 0;
    for (let az = 0; az < azCount; az++) {
      const azDeg = azStart + az * azStep;
      const azRad = (azDeg * Math.PI) / 180;
      const cosAz = Math.cos(azRad);
      const sinAz = Math.sin(azRad);

      for (let pol = 0; pol < polCount; pol++) {
        const polDeg = polStart + pol * polStep;
        const polRad = (polDeg * Math.PI) / 180;
        const sinPol = Math.sin(polRad);
        const cosPol = Math.cos(polRad);

        const sample = getSample(dataset, az, pol, bandIndex);
        const normalized = range > 0 ? (sample - minDb) / range : 0;
        const scaled = Math.min(Math.max(normalized, 0), 1) * (scaleFactor - 1) + 1;
        const radius = BASE_RADIUS * scaled;
        const [r, g, b] = sampleColormap(mapSample, sample, minDb, maxDb);

        positions[vertexIndex++] = radius * sinPol * cosAz;
        positions[vertexIndex++] = radius * cosPol;
        positions[vertexIndex++] = radius * sinPol * sinAz;

        colors[colorIndex++] = r;
        colors[colorIndex++] = g;
        colors[colorIndex++] = b;
      }
    }

    const indices: number[] = [];
    const azSpan = azStep * (azCount - 1);
    const wrapAz =
      dataset.sphereMode === "full" && azCount > 2 && azSpan >= 360 - azStep * 0.5;

    const addQuad = (azA: number, azB: number) => {
      for (let pol = 0; pol < polCount - 1; pol++) {
        const a = azA * polCount + pol;
        const b = azB * polCount + pol;
        const c = azB * polCount + (pol + 1);
        const d = azA * polCount + (pol + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    };

    for (let az = 0; az < azCount - 1; az++) {
      addQuad(az, az + 1);
    }

    if (wrapAz) {
      addQuad(azCount - 1, 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [dataset, bandIndex, colormap, heightScale]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.5}
        metalness={0.1}
        wireframe={wireframe}
      />
    </mesh>
  );
}
