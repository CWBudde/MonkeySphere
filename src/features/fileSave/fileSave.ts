import { writeMob } from "../../codecs";
import type { Dataset } from "../../domain/dataset/types";

type FilePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
};

type FileSystemFileHandle = {
  createWritable?: () => Promise<{
    write: (data: BufferSource | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

export type SaveFormat = "mob";

async function saveWithPicker(bytes: Uint8Array, suggestedName: string): Promise<boolean> {
  const filePicker = window as Window & {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  };
  if (!filePicker.showSaveFilePicker) return false;
  try {
    const handle = await filePicker.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "MonkeySphere datasets",
          accept: {
            "application/octet-stream": [".mob"],
          },
        },
      ],
    });
    if (!handle?.createWritable) return false;
    const writable = await handle.createWritable();
    await writable.write(bytes);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    throw error;
  }
}

function saveWithDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function saveFile(
  dataset: Dataset,
  format: SaveFormat = "mob",
  suggestedName: string = "dataset.mob",
): Promise<void> {
  if (typeof window === "undefined") return;
  if (format !== "mob") {
    throw new Error(`Unsupported save format: ${format}`);
  }
  const bytes = writeMob(dataset);
  const suggested = suggestedName.endsWith(".mob") ? suggestedName : `${suggestedName}.mob`;
  const saved = await saveWithPicker(bytes, suggested);
  if (!saved) {
    saveWithDownload(bytes, suggested);
  }
}
