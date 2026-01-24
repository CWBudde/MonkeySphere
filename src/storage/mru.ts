const STORAGE_KEY = "monkeysphere.mru";
const MAX_ENTRIES = 10;

function normalizeEntries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") return raw as string[];
  return raw
    .map((entry) => {
      if (entry && typeof entry === "object" && "name" in entry) {
        const name = (entry as { name?: unknown }).name;
        return typeof name === "string" ? name : null;
      }
      return null;
    })
    .filter((value): value is string => typeof value === "string");
}

export function getMruList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function addToMru(filename: string, maxEntries: number = MAX_ENTRIES) {
  const trimmed = filename.trim();
  if (!trimmed) return;
  const entries = getMruList().filter((entry) => entry !== trimmed);
  entries.unshift(trimmed);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, maxEntries)));
}

export function clearMru() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadMru(): string[] {
  return getMruList();
}

export function saveMru(entries: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
