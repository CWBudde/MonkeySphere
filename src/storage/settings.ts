export type ThemeMode = "auto" | "light" | "dark";

export type AppSettings = {
  version: 1;
  theme?: ThemeMode;
};

const STORAGE_KEY = "monkeysphere.settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, theme: "auto" };
    const parsed = JSON.parse(raw) as AppSettings;
    return { ...parsed, theme: parsed.theme ?? "auto" };
  } catch {
    return { version: 1, theme: "auto" };
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
