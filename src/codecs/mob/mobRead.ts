import type { Dataset } from "../../domain/dataset/types";

export function readMob(_bytes: Uint8Array): Dataset {
  // TODO: Implement MOBA header + plev parsing.
  // For now, return an empty dataset skeleton.
  return {
    azimuth: { startDeg: 0, stepDeg: 10, count: 0 },
    polar: { startDeg: 0, stepDeg: 10, count: 0 },
    freq: { startHz: 1000, bandsPerOctave: 3, bandCount: 0 },
    sphereMode: "full",
    samples: new Float32Array(0),
    meta: {},
  };
}
