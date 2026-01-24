import type { Dataset, DatasetMeta, SpectrumData } from "../../domain/dataset/types";
import { getChunk, readRiffFile } from "../riff/riffReader";
import { MOB_CLFREC_SIZE, MOB_HEADER_SIZE, MobHeader, MobSpherePart } from "./mobTypes";

export class MobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobError";
  }
}

export function readMob(bytes: Uint8Array): Dataset {
  return readMobFile(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

export function readMobFile(buffer: ArrayBuffer): Dataset {
  const riff = readRiffFile(buffer, { expectedFormType: "MOBA", containerType: "auto" });
  const mobaChunk = getChunk(riff, "MOBA");
  if (!mobaChunk) {
    throw new MobError("MOBA chunk not found");
  }

  const header = parseMobHeader(mobaChunk.data);
  const plevChunk = getChunk(riff, "plev");
  if (!plevChunk) {
    throw new MobError("plev chunk not found");
  }

  const samples = parsePlevChunk(plevChunk.data, header);
  const meta: DatasetMeta = {
    name: header.device || undefined,
    manufacturer: header.manufacturer || undefined,
  };

  const clfChunk = getChunk(riff, "clf_");
  if (clfChunk) {
    Object.assign(meta, parseClfChunk(clfChunk.data, meta));
  }

  const commChunk = getChunk(riff, "comm");
  if (commChunk) {
    const comment = parseCommChunk(commChunk.data);
    if (comment) {
      meta.notes = meta.notes ? `${meta.notes}\n${comment}` : comment;
    }
  }

  const specChunk = getChunk(riff, "spec");
  const spectrum = specChunk ? parseSpecChunk(specChunk.data) : undefined;

  const dateStr = formatDate(header);
  if (dateStr) {
    meta.date = dateStr;
  }

  return {
    azimuth: {
      startDeg: header.azimuth.start,
      stepDeg: header.azimuth.step,
      count: header.azimuth.values,
    },
    polar: {
      startDeg: header.polar.start,
      stepDeg: header.polar.step,
      count: header.polar.values,
    },
    freq: {
      startHz: header.freqStart,
      bandsPerOctave: header.freqSpacing === 1 ? header.freqStep : 1,
      bandCount: header.freqBands,
    },
    sphereMode: mapSpherePart(header.sphere),
    samples,
    meta,
    spectrum,
  };
}

export function parseMobHeader(data: ArrayBuffer): MobHeader {
  if (data.byteLength < MOB_HEADER_SIZE) {
    throw new MobError(`MOBA header too short (${data.byteLength} bytes)`);
  }

  const view = new DataView(data);
  let offset = 0;

  const year = view.getUint16(offset, true);
  offset += 2;
  const month = view.getUint8(offset++);
  const day = view.getUint8(offset++);
  const hour = view.getUint8(offset++);
  const minute = view.getUint8(offset++);
  const second = view.getUint8(offset++);
  const hundredth = view.getUint8(offset++);

  const device = readPascalString(view, offset, 39);
  offset += 40;
  const manufacturer = readPascalString(view, offset, 39);
  offset += 40;

  const sphere = view.getUint8(offset++) as MobSpherePart;
  const radiation = view.getUint8(offset++) as 0 | 1;
  offset += 2; // reserved

  const polar = readAngleInfo(view, offset);
  offset += 16;
  const azimuth = readAngleInfo(view, offset);
  offset += 16;

  const freqSpacing = view.getUint8(offset++) as 0 | 1;
  offset += 3; // reserved

  const freqStart = view.getFloat32(offset, true);
  offset += 4;
  const freqStep = view.getFloat32(offset, true);
  offset += 4;
  const freqBands = view.getInt32(offset, true);
  offset += 4;

  const dynRange = view.getFloat32(offset, true);
  offset += 4;
  const onTopDb = view.getFloat32(offset, true);
  offset += 4;

  const norm0dBMax = view.getUint8(offset++) !== 0;
  const allMeasured = view.getUint8(offset++) !== 0;
  offset += 2; // reserved

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    hundredth,
    device,
    manufacturer,
    sphere,
    radiation,
    polar,
    azimuth,
    freqSpacing,
    freqStart,
    freqStep,
    freqBands,
    dynRange,
    onTopDb,
    norm0dBMax,
    allMeasured,
  };
}

export function parsePlevChunk(chunk: ArrayBuffer, header: MobHeader): Float32Array {
  const expectedCount = header.azimuth.values * header.polar.values * header.freqBands;
  const expectedSize = expectedCount * 4;

  if (chunk.byteLength < expectedSize) {
    throw new MobError(
      `plev chunk too short (${chunk.byteLength} bytes, expected ${expectedSize})`,
    );
  }

  return readFloat32ArrayLE(chunk, expectedCount);
}

export function parseClfChunk(chunk: ArrayBuffer, existing: DatasetMeta): DatasetMeta {
  if (chunk.byteLength < MOB_CLFREC_SIZE) {
    return {};
  }

  const view = new DataView(chunk);
  let offset = 0;

  const site = readShortString(view, offset, 80);
  offset += 81;
  const descript = readShortString(view, offset, 80);
  offset += 81;
  offset += 81 * 2; // col, mount
  const contact = readShortString(view, offset, 80);
  offset += 81;
  const email = readShortString(view, offset, 80);
  offset += 81;
  const note = readShortString(view, offset, 80);

  return {
    name: existing.name ?? (descript || undefined),
    manufacturer: existing.manufacturer,
    notes: note || undefined,
    date: existing.date,
  };
}

export function parseSpecChunk(_chunk: ArrayBuffer): SpectrumData | undefined {
  return undefined;
}

export function parseCommChunk(chunk: ArrayBuffer): string {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(chunk).replace(/\0+$/, "").trim();
}

function readAngleInfo(view: DataView, offset: number) {
  const start = view.getFloat32(offset, true);
  const step = view.getFloat32(offset + 4, true);
  const values = view.getInt32(offset + 8, true);
  const dir = view.getUint8(offset + 12) as 0 | 1;
  return { start, step, values, dir };
}

function readPascalString(view: DataView, offset: number, maxLen: number): string {
  const length = Math.min(view.getUint8(offset), maxLen);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(view.getUint8(offset + 1 + i));
  }
  return out.trim();
}

function readShortString(view: DataView, offset: number, maxLen: number): string {
  const length = Math.min(view.getUint8(offset), maxLen);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(view.getUint8(offset + 1 + i));
  }
  return out.trim();
}

function readFloat32ArrayLE(buffer: ArrayBuffer, count: number): Float32Array {
  const view = new DataView(buffer);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = view.getFloat32(i * 4, true);
  }
  return out;
}

function mapSpherePart(sphere: MobSpherePart): Dataset["sphereMode"] {
  switch (sphere) {
    case 0:
      return "horizontal";
    case 1:
      return "quarter";
    case 2:
      return "half";
    case 3:
      return "full";
    case 4:
      return "vertical";
    default:
      return "full";
  }
}

function formatDate(header: MobHeader): string | undefined {
  if (!header.year || !header.month || !header.day) {
    return undefined;
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${header.year}-${pad(header.month)}-${pad(header.day)}`;
}
