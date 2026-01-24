import { describe, expect, it } from "vitest";
import { readMobFile, parseMobHeader } from "../mobRead";
import { writeMobFile, writeMobHeader } from "../mobWrite";
import type { Dataset } from "../../../domain/dataset/types";

describe("MOB codec", () => {
  it("round-trips a basic dataset", () => {
    const dataset: Dataset = {
      azimuth: { startDeg: 0, stepDeg: 90, count: 2 },
      polar: { startDeg: 0, stepDeg: 45, count: 3 },
      freq: { startHz: 1000, bandsPerOctave: 3, bandCount: 2 },
      sphereMode: "half",
      samples: new Float32Array([
        1, 2, 3, 4, 5, 6, // az 0
        7, 8, 9, 10, 11, 12, // az 1
      ]),
      meta: { name: "Test Device", manufacturer: "Acme", notes: "note" },
    };

    const buffer = writeMobFile(dataset);
    const parsed = readMobFile(buffer);

    expect(parsed.azimuth.count).toBe(2);
    expect(parsed.polar.count).toBe(3);
    expect(parsed.freq.bandCount).toBe(2);
    expect(parsed.sphereMode).toBe("half");
    expect(parsed.samples.length).toBe(dataset.samples.length);
    expect(parsed.samples[0]).toBe(1);
    expect(parsed.meta.name).toBe("Test Device");
    expect(parsed.meta.manufacturer).toBe("Acme");
    expect(parsed.meta.notes).toBe("note");
  });

  it("parses a MOBA header buffer", () => {
    const header = {
      year: 2024,
      month: 4,
      day: 15,
      hour: 9,
      minute: 30,
      second: 10,
      hundredth: 0,
      device: "Dev",
      manufacturer: "Maker",
      sphere: 3,
      radiation: 1,
      polar: { start: 0, step: 10, values: 19, dir: 0 },
      azimuth: { start: 0, step: 10, values: 36, dir: 0 },
      freqSpacing: 1,
      freqStart: 1000,
      freqStep: 3,
      freqBands: 5,
      dynRange: 90,
      onTopDb: 0,
      norm0dBMax: false,
      allMeasured: true,
    } as const;

    const buffer = writeMobHeader(header);
    const parsed = parseMobHeader(buffer);

    expect(parsed.device).toBe("Dev");
    expect(parsed.manufacturer).toBe("Maker");
    expect(parsed.freqBands).toBe(5);
    expect(parsed.polar.values).toBe(19);
    expect(parsed.azimuth.values).toBe(36);
  });
});
