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
      <label htmlFor="theme-toggle" className="text-xs text-slate-500 dark:text-slate-400">
        Theme
      </label>
      <select
        id="theme-toggle"
        value={mode}
        onChange={handleChange}
        className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-600 dark:focus:ring-slate-600"
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
