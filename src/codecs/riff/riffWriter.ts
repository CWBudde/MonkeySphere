import { RiffChunk, RiffContainerType } from "./types";

export class RiffWriterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiffWriterError";
  }
}

export interface RiffWriteOptions {
  containerType?: RiffContainerType;
}

export type RiffChunkInput = Pick<RiffChunk, "id" | "data"> & {
  data: ArrayBuffer | ArrayBufferView;
};

export function createRiffFile(
  formType: string,
  chunks: RiffChunkInput[],
  options?: RiffWriteOptions,
): ArrayBuffer {
  const containerType = options?.containerType ?? "standard";

  if (containerType === "standard") {
    assertFourCC("formType", formType);
  }

  const normalized = chunks.map((chunk) => {
    assertFourCC("chunk id", chunk.id);
    const data = normalizeData(chunk.data);
    return {
      id: chunk.id,
      data,
      size: data.byteLength,
      pad: data.byteLength % 2,
    };
  });

  const headerSize = containerType === "standard" ? 12 : 8;
  const riffSize =
    (containerType === "standard" ? 4 : 0) +
    normalized.reduce((sum, chunk) => sum + 8 + chunk.size + chunk.pad, 0);

  const buffer = new ArrayBuffer(headerSize + riffSize);
  const view = new DataView(buffer);

  writeFourCC(view, 0, "RIFF");
  view.setUint32(4, riffSize, true);

  let offset = 8;
  if (containerType === "standard") {
    writeFourCC(view, offset, formType);
    offset += 4;
  }

  for (const chunk of normalized) {
    writeFourCC(view, offset, chunk.id);
    view.setUint32(offset + 4, chunk.size, true);
    offset += 8;

    new Uint8Array(buffer, offset, chunk.size).set(new Uint8Array(chunk.data));
    offset += chunk.size;

    if (chunk.pad) {
      view.setUint8(offset, 0);
      offset += 1;
    }
  }

  return buffer;
}

function normalizeData(data: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

function writeFourCC(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < 4; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function assertFourCC(label: string, value: string): void {
  if (value.length !== 4) {
    throw new RiffWriterError(`Invalid ${label}: '${value}' must be 4 characters`);
  }

  for (let i = 0; i < 4; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      throw new RiffWriterError(
        `Invalid ${label}: '${value}' must contain printable ASCII characters`,
      );
    }
  }
}
