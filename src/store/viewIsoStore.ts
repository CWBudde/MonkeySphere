import { create } from "zustand";

import type { ColormapName } from "../domain/colormap";

type IsoState = {
  colormap: ColormapName;
  bandStart: number;
  bandEnd: number;
  maxAngle: number;
  azimuthIndex: number;
  showPolarGrid: boolean;
  showCoverage: boolean;
  showCoverage3db: boolean;
  showCoverage6db: boolean;
  showCoverage9db: boolean;
  coverageColor3db: string;
  coverageColor6db: string;
  coverageColor9db: string;
  setColormap: (value: ColormapName) => void;
  setBandRange: (start: number, end: number) => void;
  setMaxAngle: (value: number) => void;
  setAzimuthIndex: (value: number) => void;
  setShowPolarGrid: (value: boolean) => void;
  setShowCoverage: (value: boolean) => void;
  setShowCoverage3db: (value: boolean) => void;
  setShowCoverage6db: (value: boolean) => void;
  setShowCoverage9db: (value: boolean) => void;
  setCoverageColor3db: (value: string) => void;
  setCoverageColor6db: (value: string) => void;
  setCoverageColor9db: (value: string) => void;
};

export const useViewIsoStore = create<IsoState>((set) => ({
  colormap: "thermal",
  bandStart: 0,
  bandEnd: 0,
  maxAngle: 90,
  azimuthIndex: 0,
  showPolarGrid: true,
  showCoverage: true,
  showCoverage3db: true,
  showCoverage6db: true,
  showCoverage9db: true,
  coverageColor3db: "#38bdf8",
  coverageColor6db: "#22c55e",
  coverageColor9db: "#f97316",
  setColormap: (value) => set(() => ({ colormap: value })),
  setBandRange: (start, end) =>
    set(() => {
      const safeStart = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;
      const safeEnd = Number.isFinite(end) ? Math.max(0, Math.floor(end)) : safeStart;
      if (safeEnd < safeStart) {
        return { bandStart: safeEnd, bandEnd: safeStart };
      }
      return { bandStart: safeStart, bandEnd: safeEnd };
    }),
  setMaxAngle: (value) =>
    set(() => ({
      maxAngle: Number.isFinite(value) ? Math.max(1, Math.min(value, 180)) : 90,
    })),
  setAzimuthIndex: (value) =>
    set(() => ({
      azimuthIndex: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
    })),
  setShowPolarGrid: (value) => set(() => ({ showPolarGrid: value })),
  setShowCoverage: (value) => set(() => ({ showCoverage: value })),
  setShowCoverage3db: (value) => set(() => ({ showCoverage3db: value })),
  setShowCoverage6db: (value) => set(() => ({ showCoverage6db: value })),
  setShowCoverage9db: (value) => set(() => ({ showCoverage9db: value })),
  setCoverageColor3db: (value) => set(() => ({ coverageColor3db: value })),
  setCoverageColor6db: (value) => set(() => ({ coverageColor6db: value })),
  setCoverageColor9db: (value) => set(() => ({ coverageColor9db: value })),
}));
