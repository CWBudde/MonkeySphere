export type RiffContainerType = "standard" | "legacy";

export interface RiffChunk {
  id: string;
  size: number;
  data: ArrayBuffer;
  offset: number;
  dataOffset: number;
}

export interface RiffFile {
  fileSize: number;
  formType?: string;
  chunks: RiffChunk[];
  containerType: RiffContainerType;
}
