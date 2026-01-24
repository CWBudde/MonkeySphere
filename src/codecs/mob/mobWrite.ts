import type { Dataset, DatasetMeta } from "../../domain/dataset/types";
import { createRiffFile } from "../riff/riffWriter";
import { MOB_CLFREC_SIZE, MOB_HEADER_SIZE, MobHeader, MobSpherePart } from "./mobTypes";

export class MobWriterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobWriterError";
  }
}

export function writeMob(dataset: Dataset): Uint8Array {
  const buffer = writeMobFile(dataset);
  return new Uint8Array(buffer);
}

export function writeMobFile(dataset: Dataset): ArrayBuffer {
  const expectedSamples =
    dataset.azimuth.count * dataset.polar.count * dataset.freq.bandCount;
  if (dataset.samples.length !== expectedSamples) {
    throw new MobWriterError(
      `Sample count mismatch (${dataset.samples.length}, expected ${expectedSamples})`,
    );
  }

  const header = buildMobHeader(dataset);
  const mobaChunk = writeMobHeader(header);
  const plevChunk = writePlevChunk(dataset.samples);
  const clfChunk = writeClfChunk(dataset.meta);

  const chunks = [
    { id: "MOBA", data: mobaChunk },
    { id: "clf_", data: clfChunk },
    { id: "plev", data: plevChunk },
  ];

  return createRiffFile("MOBA", chunks, { containerType: "legacy" });
}

export function writeMobHeader(header: MobHeader): ArrayBuffer {
  const buffer = new ArrayBuffer(MOB_HEADER_SIZE);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, header.year, true);
  offset += 2;
  view.setUint8(offset++, header.month);
  view.setUint8(offset++, header.day);
  view.setUint8(offset++, header.hour);
  view.setUint8(offset++, header.minute);
  view.setUint8(offset++, header.second);
  view.setUint8(offset++, header.hundredth);

  writePascalString(view, offset, 39, header.device);
  offset += 40;
  writePascalString(view, offset, 39, header.manufacturer);
  offset += 40;

  view.setUint8(offset++, header.sphere);
  view.setUint8(offset++, header.radiation);
  offset += 2;

  writeAngleInfo(view, offset, header.polar);
  offset += 16;
  writeAngleInfo(view, offset, header.azimuth);
  offset += 16;

  view.setUint8(offset++, header.freqSpacing);
  offset += 3;
  view.setFloat32(offset, header.freqStart, true);
  offset += 4;
  view.setFloat32(offset, header.freqStep, true);
  offset += 4;
  view.setInt32(offset, header.freqBands, true);
  offset += 4;

  view.setFloat32(offset, header.dynRange, true);
  offset += 4;
  view.setFloat32(offset, header.onTopDb, true);
  offset += 4;

  view.setUint8(offset++, header.norm0dBMax ? 1 : 0);
  view.setUint8(offset++, header.allMeasured ? 1 : 0);
  offset += 2;

  return buffer;
}

export function writePlevChunk(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 4);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    view.setFloat32(i * 4, samples[i], true);
  }
  return buffer;
}

export function writeClfChunk(meta: DatasetMeta): ArrayBuffer {
  const buffer = new ArrayBuffer(MOB_CLFREC_SIZE);
  const view = new DataView(buffer);
  let offset = 0;

  offset = writeShortString(view, offset, 80, meta.manufacturer ?? "");
  offset = writeShortString(view, offset, 80, meta.name ?? "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, meta.notes ?? "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");
  offset = writeShortString(view, offset, 80, "");

  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setUint8(offset++, 0);
  view.setUint8(offset++, 0);
  offset = writeClfInc(view, offset);
  writeClfInc(view, offset);

  return buffer;
}

function buildMobHeader(dataset: Dataset): MobHeader {
  const date = dataset.meta.date ? new Date(dataset.meta.date) : undefined;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : undefined;

  return {
    year: validDate ? validDate.getFullYear() : 0,
    month: validDate ? validDate.getMonth() + 1 : 0,
    day: validDate ? validDate.getDate() : 0,
    hour: validDate ? validDate.getHours() : 0,
    minute: validDate ? validDate.getMinutes() : 0,
    second: validDate ? validDate.getSeconds() : 0,
    hundredth: 0,
    device: dataset.meta.name ?? "",
    manufacturer: dataset.meta.manufacturer ?? "",
    sphere: mapSphereMode(dataset.sphereMode),
    radiation: 1,
    polar: {
      start: dataset.polar.startDeg,
      step: dataset.polar.stepDeg,
      values: dataset.polar.count,
      dir: 0,
    },
    azimuth: {
      start: dataset.azimuth.startDeg,
      step: dataset.azimuth.stepDeg,
      values: dataset.azimuth.count,
      dir: 0,
    },
    freqSpacing: 1,
    freqStart: dataset.freq.startHz,
    freqStep: dataset.freq.bandsPerOctave,
    freqBands: dataset.freq.bandCount,
    dynRange: 90,
    onTopDb: 0,
    norm0dBMax: false,
    allMeasured: true,
  };
}

function mapSphereMode(mode: Dataset["sphereMode"]): MobSpherePart {
  switch (mode) {
    case "horizontal":
      return 0;
    case "quarter":
      return 1;
    case "half":
      return 2;
    case "full":
      return 3;
    case "vertical":
      return 4;
    default:
      return 3;
  }
}

function writeAngleInfo(view: DataView, offset: number, info: MobHeader["polar"]): void {
  view.setFloat32(offset, info.start, true);
  view.setFloat32(offset + 4, info.step, true);
  view.setInt32(offset + 8, info.values, true);
  view.setUint8(offset + 12, info.dir);
  view.setUint8(offset + 13, 0);
  view.setUint8(offset + 14, 0);
  view.setUint8(offset + 15, 0);
}

function writePascalString(view: DataView, offset: number, maxLen: number, value: string): void {
  const safe = value.slice(0, maxLen);
  view.setUint8(offset, safe.length);
  for (let i = 0; i < maxLen; i++) {
    view.setUint8(offset + 1 + i, i < safe.length ? safe.charCodeAt(i) : 0);
  }
}

function writeShortString(
  view: DataView,
  offset: number,
  maxLen: number,
  value: string,
): number {
  writePascalString(view, offset, maxLen, value);
  return offset + 1 + maxLen;
}

function writeClfInc(view: DataView, offset: number): number {
  view.setUint8(offset++, 0);
  writePascalString(view, offset, 12, "");
  return offset + 13;
}
