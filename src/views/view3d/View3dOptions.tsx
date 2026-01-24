import { availableColormaps } from "../../domain/colormap";
import { useView3dStore } from "../../store/view3dStore";

export function View3dOptions() {
  const colormap = useView3dStore((state) => state.colormap);
  const setColormap = useView3dStore((state) => state.setColormap);
  const showDots = useView3dStore((state) => state.showDots);
  const dotColor = useView3dStore((state) => state.dotColor);
  const dotSize = useView3dStore((state) => state.dotSize);
  const setShowDots = useView3dStore((state) => state.setShowDots);
  const setDotColor = useView3dStore((state) => state.setDotColor);
  const setDotSize = useView3dStore((state) => state.setDotSize);

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-200">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Colormap</div>
      <label className="flex items-center justify-between gap-3">
        <span>Palette</span>
        <select
          value={colormap}
          onChange={(event) => setColormap(event.target.value as typeof colormap)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {availableColormaps.map((map) => (
            <option key={map} value={map}>
              {map}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Dots</div>
      <label className="flex items-center justify-between gap-3">
        <span>Show dots</span>
        <input
          type="checkbox"
          checked={showDots}
          onChange={(event) => setShowDots(event.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Color</span>
        <input
          type="color"
          className="h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-800"
          value={dotColor}
          onChange={(event) => setDotColor(event.target.value)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Size</span>
        <input
          type="range"
          min={0.005}
          max={0.05}
          step={0.002}
          value={dotSize}
          onChange={(event) => setDotSize(Number(event.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-right text-xs text-slate-400">{dotSize.toFixed(3)}</span>
      </label>
    </div>
  );
}
