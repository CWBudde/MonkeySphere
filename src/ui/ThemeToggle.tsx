import { useThemeStore } from "../store";
import type { ThemeMode } from "../storage/settings";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value as ThemeMode);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-toggle" className="text-xs text-slate-400 dark:text-slate-500">
        Theme
      </label>
      <select
        id="theme-toggle"
        value={mode}
        onChange={handleChange}
        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
