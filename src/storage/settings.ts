export type AppSettings = {
  version: 1;
};

const STORAGE_KEY = "monkeysphere.settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1 };
    return JSON.parse(raw) as AppSettings;
  } catch {
    return { version: 1 };
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
