import { useMemo } from "react";

import { useView2dStore } from "../../store";

const directions = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const;

export function View2dOptions() {
  const showHorizontal = useView2dStore((state) => state.showHorizontal);
  const showVertical = useView2dStore((state) => state.showVertical);
  const direction = useView2dStore((state) => state.direction);
  const maxDb = useView2dStore((state) => state.maxDb);
  const rangeDb = useView2dStore((state) => state.rangeDb);
  const setShowHorizontal = useView2dStore((state) => state.setShowHorizontal);
  const setShowVertical = useView2dStore((state) => state.setShowVertical);
  const setDirection = useView2dStore((state) => state.setDirection);
  const setMaxDb = useView2dStore((state) => state.setMaxDb);
  const setRangeDb = useView2dStore((state) => state.setRangeDb);

  const maxDbLabel = useMemo(() => (maxDb === null ? "Auto" : `${maxDb} dB`), [maxDb]);

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-200">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Slices</div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showHorizontal}
              onChange={(event) => setShowHorizontal(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400"
            />
            Horizontal slice
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showVertical}
              onChange={(event) => setShowVertical(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400"
            />
            Vertical slice
          </label>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Direction</div>
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value as typeof direction)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {directions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Range</div>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-xs text-slate-400">
            <span className="text-slate-300">Max dB ({maxDbLabel})</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxDb ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setMaxDb(value === "" ? null : Number(value));
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={() => setMaxDb(null)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-wide text-slate-300 hover:border-indigo-400 hover:text-indigo-200"
              >
                Auto
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-xs text-slate-400">
            <span className="text-slate-300">Range dB</span>
            <input
              type="number"
              min={1}
              step={1}
              value={rangeDb}
              onChange={(event) => setRangeDb(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
