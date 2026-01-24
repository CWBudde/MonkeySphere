import { create } from "zustand";

import type { Dataset } from "../domain/dataset/types";

export type ViewMode = "3d" | "2d" | "coverage" | "iso";

type DatasetState = {
  dataset: Dataset | null;
  filePath: string | null;
  isDirty: boolean;
  selectedBandIndex: number;
  viewMode: ViewMode;
  loadDataset: (dataset: Dataset, path?: string) => void;
  closeDataset: () => void;
  setSelectedBand: (index: number) => void;
  setViewMode: (mode: ViewMode) => void;
  markDirty: () => void;
  markClean: () => void;
};

export const useDatasetStore = create<DatasetState>((set) => ({
  dataset: null,
  filePath: null,
  isDirty: false,
  selectedBandIndex: 0,
  viewMode: "3d",
  loadDataset: (dataset, path) =>
    set(() => ({
      dataset,
      filePath: path ?? null,
      isDirty: false,
      selectedBandIndex: 0,
    })),
  closeDataset: () =>
    set(() => ({
      dataset: null,
      filePath: null,
      isDirty: false,
      selectedBandIndex: 0,
    })),
  setSelectedBand: (index) =>
    set((state) => ({
      selectedBandIndex:
        state.dataset && state.dataset.freq.bandCount > 0
          ? Math.max(0, Math.min(index, state.dataset.freq.bandCount - 1))
          : 0,
    })),
  setViewMode: (mode) => set(() => ({ viewMode: mode })),
  markDirty: () => set(() => ({ isDirty: true })),
  markClean: () => set(() => ({ isDirty: false })),
}));
