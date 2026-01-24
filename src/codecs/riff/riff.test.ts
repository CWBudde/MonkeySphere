import { describe, it, expect } from "bun:test";
import { readRiffFile, getChunk, RiffError } from "../riffReader";

describe("RIFF Reader", () => {
  // Helper to create a RIFF buffer manually
  const createRiffBuffer = (
    formType: string,
    chunks: { id: string; data: number[] }[],
  ): ArrayBuffer => {
    // Calculate size
    let contentSize = 4; // formType
    for (const chunk of chunks) {
      contentSize += 8 + chunk.data.length;
      if (chunk.data.length % 2 !== 0) contentSize++; // padding
    }

    const buffer = new ArrayBuffer(8 + contentSize);
    const view = new DataView(buffer);

    // RIFF Header
    writeString(view, 0, "RIFF");
    view.setUint32(4, contentSize, true);
    writeString(view, 8, formType);

    let offset = 12;
    for (const chunk of chunks) {
      writeString(view, offset, chunk.id);
      view.setUint32(offset + 4, chunk.data.length, true);
      offset += 8;

      for (let i = 0; i < chunk.data.length; i++) {
        view.setUint8(offset + i, chunk.data[i]);
      }
      offset += chunk.data.length;

      if (chunk.data.length % 2 !== 0) {
        view.setUint8(offset, 0); // pad
        offset++;
      }
    }

    return buffer;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  it("reads a valid RIFF file", () => {
    const buffer = createRiffBuffer("MOBA", [{ id: "test", data: [1, 2, 3, 4] }]);

    const file = readRiffFile(buffer);
    expect(file.formType).toBe("MOBA");
    expect(file.chunks.length).toBe(1);
    expect(file.chunks[0].id).toBe("test");
    expect(file.chunks[0].size).toBe(4);

    const data = new Uint8Array(file.chunks[0].data);
    expect(data[0]).toBe(1);
    expect(data[3]).toBe(4);
  });

  it("handles chunk padding correctly", () => {
    const buffer = createRiffBuffer("TEST", [
      { id: "odd ", data: [1, 2, 3] }, // 3 bytes, needs 1 byte pad
      { id: "even", data: [4, 5] },
    ]);

    const file = readRiffFile(buffer);
    expect(file.chunks.length).toBe(2);

    const chunk1 = getChunk(file, "odd ");
    expect(chunk1).toBeDefined();
    expect(chunk1?.size).toBe(3);

    const chunk2 = getChunk(file, "even");
    expect(chunk2).toBeDefined();
    expect(chunk2?.size).toBe(2);
    const data2 = new Uint8Array(chunk2!.data);
    expect(data2[0]).toBe(4);
  });

  it("throws on invalid header", () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    writeString(view, 0, "JUNK");

    expect(() => readRiffFile(buffer)).toThrow(RiffError);
  });

  it("validates form type if requested", () => {
    const buffer = createRiffBuffer("WAVE", []);
    expect(() => readRiffFile(buffer, { expectedFormType: "MOBA" })).toThrow(RiffError);
    expect(() => readRiffFile(buffer, { expectedFormType: "WAVE" })).not.toThrow();
  });
});
