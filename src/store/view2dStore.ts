import { create } from "zustand";

export type View2dDirection = "front" | "back" | "left" | "right";

type View2dState = {
  showHorizontal: boolean;
  showVertical: boolean;
  direction: View2dDirection;
  maxDb: number | null;
  rangeDb: number;
  setShowHorizontal: (value: boolean) => void;
  setShowVertical: (value: boolean) => void;
  setDirection: (value: View2dDirection) => void;
  setMaxDb: (value: number | null) => void;
  setRangeDb: (value: number) => void;
};

export const useView2dStore = create<View2dState>((set) => ({
  showHorizontal: true,
  showVertical: true,
  direction: "front",
  maxDb: null,
  rangeDb: 36,
  setShowHorizontal: (value) => set(() => ({ showHorizontal: value })),
  setShowVertical: (value) => set(() => ({ showVertical: value })),
  setDirection: (value) => set(() => ({ direction: value })),
  setMaxDb: (value) => set(() => ({ maxDb: value })),
  setRangeDb: (value) =>
    set(() => ({
      rangeDb: Number.isFinite(value) && value > 0 ? value : 36,
    })),
}));
