import { RiffChunk, RiffContainerType, RiffFile } from "./types";

export class RiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiffError";
  }
}

export interface RiffReadOptions {
  expectedFormType?: string;
  containerType?: "auto" | "standard" | "legacy";
  // Determines how to treat the RIFF size field: clamp to buffer, require exact, or ignore.
  sizeMode?: "clamp" | "strict" | "ignore";
  // Safety valve against malformed files declaring huge chunk counts.
  maxChunks?: number;
}

export function readRiffFile(buffer: ArrayBuffer, options?: RiffReadOptions): RiffFile {
  const view = new DataView(buffer);

  if (buffer.byteLength < 8) {
    throw new RiffError("File too short to be a RIFF file");
  }

  // 1. Parse RIFF header
  const chunkId = readFourCC(view, 0);
  if (chunkId !== "RIFF") {
    throw new RiffError(`Invalid RIFF header: expected 'RIFF', found '${chunkId}'`);
  }

  // RIFF size is "file length minus 8 bytes".
  const fileSize = view.getUint32(4, true); // Little-endian
  const declaredEnd = fileSize + 8;
  const sizeMode = options?.sizeMode ?? "clamp";
  const end = resolveDeclaredEnd(buffer.byteLength, declaredEnd, sizeMode);
  const maxChunks = options?.maxChunks ?? 10000;

  // Some legacy MonkeySphere files store the form type as the first chunk id.
  const containerType = resolveContainerType(view, end, options);

  let formType: string | undefined;
  let offset = 0;

  if (containerType === "standard") {
    if (buffer.byteLength < 12) {
      throw new RiffError("File too short to contain a RIFF form type");
    }

    // Standard RIFF: form type sits immediately after the size field.
    formType = readFourCC(view, 8);

    if (fileSize < 4 && sizeMode === "strict") {
      throw new RiffError("RIFF size too small to contain a form type");
    }

    if (options?.expectedFormType && formType !== options.expectedFormType) {
      throw new RiffError(
        `Invalid form type: expected '${options.expectedFormType}', found '${formType}'`,
      );
    }

    offset = 12;
  } else {
    if (buffer.byteLength < 16) {
      throw new RiffError("File too short to contain legacy RIFF chunks");
    }

    formType = undefined;

    // Legacy RIFF: first chunk id acts like a form type.
    if (options?.expectedFormType) {
      const firstChunkId = readFourCC(view, 8);
      if (firstChunkId !== options.expectedFormType) {
        throw new RiffError(
          `Invalid legacy chunk: expected '${options.expectedFormType}', found '${firstChunkId}'`,
        );
      }
    }

    offset = 8;
  }

  const chunks: RiffChunk[] = [];

  while (offset < end) {
    // We need at least 8 bytes for a chunk header
    if (offset + 8 > end) {
      break;
    }

    if (chunks.length >= maxChunks) {
      throw new RiffError(`Chunk limit exceeded (${maxChunks})`);
    }

    const subChunkId = readFourCC(view, offset);
    const subChunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;

    if (dataOffset + subChunkSize > buffer.byteLength) {
      throw new RiffError(`Chunk '${subChunkId}' data exceeds buffer boundaries`);
    }

    if (sizeMode !== "ignore" && dataOffset + subChunkSize > end) {
      throw new RiffError(`Chunk '${subChunkId}' data exceeds declared RIFF size`);
    }

    // Copy the data to a new ArrayBuffer to ensure clean chunks
    const chunkData = buffer.slice(dataOffset, dataOffset + subChunkSize);

    chunks.push({
      id: subChunkId,
      size: subChunkSize,
      data: chunkData,
      offset,
      dataOffset,
    });

    offset = dataOffset + subChunkSize;

    // RIFF chunks are word-aligned; if size is odd, there is a pad byte
    if (subChunkSize % 2 !== 0) {
      offset += 1;
    }
  }

  return {
    fileSize,
    formType,
    chunks,
    containerType,
  };
}

export function getChunk(file: RiffFile, chunkId: string): RiffChunk | undefined {
  return file.chunks.find((c) => c.id === chunkId);
}

export function getAllChunks(file: RiffFile): RiffChunk[] {
  return file.chunks;
}

export type { RiffChunk, RiffFile, RiffContainerType } from "./types";

function readFourCC(view: DataView, offset: number): string {
  ensureRange(view, offset, 4, "FourCC");
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }
  return s;
}

function isFourCC(value: string): boolean {
  if (value.length !== 4) {
    return false;
  }

  for (let i = 0; i < 4; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      return false;
    }
  }

  return true;
}

function isValidChunkSize(size: number, dataOffset: number, end: number): boolean {
  return size >= 0 && dataOffset + size <= end;
}

function resolveContainerType(
  view: DataView,
  end: number,
  options?: RiffReadOptions,
): RiffContainerType {
  const mode = options?.containerType ?? "auto";

  if (mode === "standard") {
    return "standard";
  }

  if (mode === "legacy") {
    return "legacy";
  }

  const hasStandardHeader = view.byteLength >= 20;
  const hasLegacyHeader = view.byteLength >= 16;

  const standardFormType = view.byteLength >= 12 ? readFourCC(view, 8) : "";
  const standardChunkId = hasStandardHeader ? readFourCC(view, 12) : "";
  const standardChunkSize = hasStandardHeader ? view.getUint32(16, true) : 0;
  const legacyChunkId = hasLegacyHeader ? readFourCC(view, 8) : "";
  const legacyChunkSize = hasLegacyHeader ? view.getUint32(12, true) : 0;

  const standardCandidate =
    hasStandardHeader && isFourCC(standardChunkId) && isValidChunkSize(standardChunkSize, 20, end);
  const legacyCandidate =
    hasLegacyHeader && isFourCC(legacyChunkId) && isValidChunkSize(legacyChunkSize, 16, end);

  if (options?.expectedFormType) {
    if (standardCandidate && standardFormType === options.expectedFormType) {
      return "standard";
    }

    if (legacyCandidate && legacyChunkId === options.expectedFormType) {
      return "legacy";
    }
  }

  if (standardCandidate && !legacyCandidate) {
    return "standard";
  }

  if (!standardCandidate && legacyCandidate) {
    return "legacy";
  }

  if (standardCandidate && legacyCandidate) {
    return "standard";
  }

  if (hasLegacyHeader && !hasStandardHeader) {
    return "legacy";
  }

  return "standard";
}

function resolveDeclaredEnd(
  bufferLength: number,
  declaredEnd: number,
  sizeMode: "clamp" | "strict" | "ignore",
): number {
  if (sizeMode === "ignore") {
    return bufferLength;
  }

  if (sizeMode === "strict") {
    if (declaredEnd > bufferLength) {
      throw new RiffError("RIFF size exceeds buffer length");
    }
    return declaredEnd;
  }

  return Math.min(bufferLength, declaredEnd);
}

function ensureRange(view: DataView, offset: number, size: number, label: string): void {
  if (offset < 0 || offset + size > view.byteLength) {
    throw new RiffError(`${label} exceeds buffer boundaries`);
  }
}
