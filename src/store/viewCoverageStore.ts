import { create } from "zustand";

type CoverageState = {
  show3db: boolean;
  show6db: boolean;
  show9db: boolean;
  color3db: string;
  color6db: string;
  color9db: string;
  opacity: number;
  setShow3db: (value: boolean) => void;
  setShow6db: (value: boolean) => void;
  setShow9db: (value: boolean) => void;
  setColor3db: (value: string) => void;
  setColor6db: (value: string) => void;
  setColor9db: (value: string) => void;
  setOpacity: (value: number) => void;
};

export const useViewCoverageStore = create<CoverageState>((set) => ({
  show3db: true,
  show6db: true,
  show9db: true,
  color3db: "#38bdf8",
  color6db: "#22c55e",
  color9db: "#f97316",
  opacity: 0.4,
  setShow3db: (value) => set(() => ({ show3db: value })),
  setShow6db: (value) => set(() => ({ show6db: value })),
  setShow9db: (value) => set(() => ({ show9db: value })),
  setColor3db: (value) => set(() => ({ color3db: value })),
  setColor6db: (value) => set(() => ({ color6db: value })),
  setColor9db: (value) => set(() => ({ color9db: value })),
  setOpacity: (value) =>
    set(() => ({
      opacity: Number.isFinite(value) ? Math.max(0, Math.min(value, 1)) : 0.4,
    })),
}));
