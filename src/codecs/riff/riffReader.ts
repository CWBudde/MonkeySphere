import { RiffChunk, RiffFile } from "./types";

export class RiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiffError";
  }
}

export interface RiffReadOptions {
  expectedFormType?: string;
}

export function readRiffFile(buffer: ArrayBuffer, options?: RiffReadOptions): RiffFile {
  const view = new DataView(buffer);

  if (buffer.byteLength < 12) {
    throw new RiffError("File too short to be a RIFF file");
  }

  // 1. Parse RIFF header
  const chunkId = readFourCC(view, 0);
  if (chunkId !== "RIFF") {
    throw new RiffError(`Invalid RIFF header: expected 'RIFF', found '${chunkId}'`);
  }

  const fileSize = view.getUint32(4, true); // Little-endian
  const formType = readFourCC(view, 8);

  if (options?.expectedFormType && formType !== options.expectedFormType) {
    throw new RiffError(
      `Invalid form type: expected '${options.expectedFormType}', found '${formType}'`,
    );
  }

  const chunks: RiffChunk[] = [];
  let offset = 12;

  // The fileSize in header is size of file *after* the 8-byte header (ID + Size).
  // So total expected size is fileSize + 8.
  const declaredEnd = fileSize + 8;
  // We trust the buffer length but respect the declared size if it's smaller.
  const end = Math.min(buffer.byteLength, declaredEnd);

  while (offset < end) {
    // We need at least 8 bytes for a chunk header
    if (offset + 8 > end) {
      break;
    }

    const subChunkId = readFourCC(view, offset);
    const subChunkSize = view.getUint32(offset + 4, true);
    offset += 8;

    if (offset + subChunkSize > buffer.byteLength) {
      throw new RiffError(`Chunk '${subChunkId}' data exceeds buffer boundaries`);
    }

    // Copy the data to a new ArrayBuffer to ensure clean chunks
    const chunkData = buffer.slice(offset, offset + subChunkSize);

    chunks.push({
      id: subChunkId,
      size: subChunkSize,
      data: chunkData,
    });

    offset += subChunkSize;

    // RIFF chunks are word-aligned; if size is odd, there is a pad byte
    if (subChunkSize % 2 !== 0) {
      offset += 1;
    }
  }

  return {
    fileSize,
    formType,
    chunks,
  };
}

export function getChunk(file: RiffFile, chunkId: string): RiffChunk | undefined {
  return file.chunks.find((c) => c.id === chunkId);
}

export function getAllChunks(file: RiffFile): RiffChunk[] {
  return file.chunks;
}

function readFourCC(view: DataView, offset: number): string {
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }
  return s;
}
