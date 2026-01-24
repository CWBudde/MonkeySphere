import { create } from "zustand";
import { loadSettings, saveSettings, type ThemeMode } from "../storage/settings";

type ThemeStore = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  initialize: () => void;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "auto",

  setMode: (mode: ThemeMode) => {
    set({ mode });
    const settings = loadSettings();
    saveSettings({ ...settings, theme: mode });
    applyTheme(mode);
  },

  initialize: () => {
    const settings = loadSettings();
    const mode = settings.theme ?? "auto";
    set({ mode });
    applyTheme(mode);
  },
}));

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // auto: check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

// Listen for system theme changes when in auto mode
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const store = useThemeStore.getState();
    if (store.mode === "auto") {
      applyTheme("auto");
    }
  });
}
