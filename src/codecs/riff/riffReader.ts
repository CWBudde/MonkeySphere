export type RiffChunk = {
  id: string;
  data: Uint8Array;
};

export function readRiffChunks(_bytes: Uint8Array): RiffChunk[] {
  // TODO: Implement RIFF parser (little-endian, padded chunk sizes).
  return [];
}
