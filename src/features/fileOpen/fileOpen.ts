import { readMob } from "../../codecs";
import type { Dataset } from "../../domain/dataset/types";

type OpenFileResult = {
  dataset: Dataset;
  fileName: string;
};

type FilePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type OpenFilePickerOptions = {
  multiple?: boolean;
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
};

type FileSystemFileHandle = {
  getFile(): Promise<File>;
};

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot + 1).toLowerCase();
}

function parseByExtension(fileName: string, buffer: ArrayBuffer): Dataset {
  const ext = getExtension(fileName);
  if (ext === "mob") {
    return readMob(new Uint8Array(buffer));
  }
  throw new Error(`Unsupported file format: .${ext || "unknown"}`);
}

export async function openFileFromFile(file: File): Promise<OpenFileResult> {
  const buffer = await file.arrayBuffer();
  return {
    dataset: parseByExtension(file.name, buffer),
    fileName: file.name,
  };
}

async function openWithPicker(): Promise<OpenFileResult | null> {
  const filePicker = window as Window & {
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  };
  if (!filePicker.showOpenFilePicker) return null;

  try {
    const [handle] = await filePicker.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "MonkeySphere datasets",
          accept: {
            "application/octet-stream": [".mob"],
            "text/plain": [".txt", ".tab"],
          },
        },
      ],
    });
    if (!handle) return null;
    const file = await handle.getFile();
    return openFileFromFile(file);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

async function openWithInput(): Promise<OpenFileResult | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: OpenFileResult | null) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mob,.txt,.tab,.xhn,.unf,.gdf";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      finish(await openFileFromFile(file));
    });
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      if (!resolved) finish(null);
    };
    window.addEventListener("focus", onFocus);
    input.click();
  });
}

export async function openFile(): Promise<OpenFileResult | null> {
  if (typeof window === "undefined") return null;
  const pickerResult = await openWithPicker();
  if (pickerResult) return pickerResult;
  return openWithInput();
}
