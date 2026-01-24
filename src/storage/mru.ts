export type MruEntry = {
  name: string;
  lastOpenedAt: number;
};

const STORAGE_KEY = "monkeysphere.mru";

export function loadMru(): MruEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MruEntry[];
  } catch {
    return [];
  }
}

export function saveMru(entries: MruEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
