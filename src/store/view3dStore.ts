import { create } from "zustand";

import type { ColormapName } from "../domain/colormap";

type View3dState = {
  colormap: ColormapName;
  showDots: boolean;
  dotColor: string;
  dotSize: number;
  showSurface: boolean;
  wireframe: boolean;
  heightScale: number;
  showCoverage: boolean;
  showCoverage3db: boolean;
  showCoverage6db: boolean;
  showCoverage9db: boolean;
  coverageOpacity: number;
  coverageColor3db: string;
  coverageColor6db: string;
  coverageColor9db: string;
  resetToken: number;
  setColormap: (value: ColormapName) => void;
  setShowDots: (value: boolean) => void;
  setDotColor: (value: string) => void;
  setDotSize: (value: number) => void;
  setShowSurface: (value: boolean) => void;
  setWireframe: (value: boolean) => void;
  setHeightScale: (value: number) => void;
  setShowCoverage: (value: boolean) => void;
  setShowCoverage3db: (value: boolean) => void;
  setShowCoverage6db: (value: boolean) => void;
  setShowCoverage9db: (value: boolean) => void;
  setCoverageOpacity: (value: number) => void;
  setCoverageColor3db: (value: string) => void;
  setCoverageColor6db: (value: string) => void;
  setCoverageColor9db: (value: string) => void;
  requestCameraReset: () => void;
};

export const useView3dStore = create<View3dState>((set) => ({
  colormap: "thermal",
  showDots: false,
  dotColor: "#e2e8f0",
  dotSize: 0.02,
  showSurface: true,
  wireframe: false,
  heightScale: 1,
  showCoverage: false,
  showCoverage3db: true,
  showCoverage6db: true,
  showCoverage9db: true,
  coverageOpacity: 0.9,
  coverageColor3db: "#38bdf8",
  coverageColor6db: "#22c55e",
  coverageColor9db: "#f97316",
  resetToken: 0,
  setColormap: (value) => set(() => ({ colormap: value })),
  setShowDots: (value) => set(() => ({ showDots: value })),
  setDotColor: (value) => set(() => ({ dotColor: value })),
  setDotSize: (value) =>
    set(() => ({
      dotSize: Number.isFinite(value) ? Math.max(0.001, Math.min(value, 0.08)) : 0.02,
    })),
  setShowSurface: (value) => set(() => ({ showSurface: value })),
  setWireframe: (value) => set(() => ({ wireframe: value })),
  setHeightScale: (value) =>
    set(() => ({
      heightScale: Number.isFinite(value) ? Math.max(0.4, Math.min(value, 2)) : 1,
    })),
  setShowCoverage: (value) => set(() => ({ showCoverage: value })),
  setShowCoverage3db: (value) => set(() => ({ showCoverage3db: value })),
  setShowCoverage6db: (value) => set(() => ({ showCoverage6db: value })),
  setShowCoverage9db: (value) => set(() => ({ showCoverage9db: value })),
  setCoverageOpacity: (value) =>
    set(() => ({
      coverageOpacity: Number.isFinite(value) ? Math.max(0.1, Math.min(value, 1)) : 0.9,
    })),
  setCoverageColor3db: (value) => set(() => ({ coverageColor3db: value })),
  setCoverageColor6db: (value) => set(() => ({ coverageColor6db: value })),
  setCoverageColor9db: (value) => set(() => ({ coverageColor9db: value })),
  requestCameraReset: () => set((state) => ({ resetToken: state.resetToken + 1 })),
}));
