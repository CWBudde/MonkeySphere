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
  const showSurface = useView3dStore((state) => state.showSurface);
  const wireframe = useView3dStore((state) => state.wireframe);
  const heightScale = useView3dStore((state) => state.heightScale);
  const showCoverage = useView3dStore((state) => state.showCoverage);
  const showCoverage3db = useView3dStore((state) => state.showCoverage3db);
  const showCoverage6db = useView3dStore((state) => state.showCoverage6db);
  const showCoverage9db = useView3dStore((state) => state.showCoverage9db);
  const coverageOpacity = useView3dStore((state) => state.coverageOpacity);
  const coverageColor3db = useView3dStore((state) => state.coverageColor3db);
  const coverageColor6db = useView3dStore((state) => state.coverageColor6db);
  const coverageColor9db = useView3dStore((state) => state.coverageColor9db);
  const setShowSurface = useView3dStore((state) => state.setShowSurface);
  const setWireframe = useView3dStore((state) => state.setWireframe);
  const setHeightScale = useView3dStore((state) => state.setHeightScale);
  const setShowCoverage = useView3dStore((state) => state.setShowCoverage);
  const setShowCoverage3db = useView3dStore((state) => state.setShowCoverage3db);
  const setShowCoverage6db = useView3dStore((state) => state.setShowCoverage6db);
  const setShowCoverage9db = useView3dStore((state) => state.setShowCoverage9db);
  const setCoverageOpacity = useView3dStore((state) => state.setCoverageOpacity);
  const setCoverageColor3db = useView3dStore((state) => state.setCoverageColor3db);
  const setCoverageColor6db = useView3dStore((state) => state.setCoverageColor6db);
  const setCoverageColor9db = useView3dStore((state) => state.setCoverageColor9db);
  const requestCameraReset = useView3dStore((state) => state.requestCameraReset);

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-200">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Surface</div>
      <label className="flex items-center justify-between gap-3">
        <span>Show surface</span>
        <input
          type="checkbox"
          checked={showSurface}
          onChange={(event) => setShowSurface(event.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Wireframe</span>
        <input
          type="checkbox"
          checked={wireframe}
          onChange={(event) => setWireframe(event.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Height scale</span>
        <input
          type="range"
          min={0.6}
          max={1.8}
          step={0.05}
          value={heightScale}
          onChange={(event) => setHeightScale(Number(event.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-right text-xs text-slate-400">{heightScale.toFixed(2)}</span>
      </label>

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

      <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Coverage</div>
      <label className="flex items-center justify-between gap-3">
        <span>Show coverage</span>
        <input
          type="checkbox"
          checked={showCoverage}
          onChange={(event) => setShowCoverage(event.target.checked)}
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>3 dB</span>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCoverage3db}
            onChange={(event) => setShowCoverage3db(event.target.checked)}
          />
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-800"
            value={coverageColor3db}
            onChange={(event) => setCoverageColor3db(event.target.value)}
          />
        </div>
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>6 dB</span>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCoverage6db}
            onChange={(event) => setShowCoverage6db(event.target.checked)}
          />
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-800"
            value={coverageColor6db}
            onChange={(event) => setCoverageColor6db(event.target.value)}
          />
        </div>
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>9 dB</span>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCoverage9db}
            onChange={(event) => setShowCoverage9db(event.target.checked)}
          />
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-800"
            value={coverageColor9db}
            onChange={(event) => setCoverageColor9db(event.target.value)}
          />
        </div>
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Opacity</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={coverageOpacity}
          onChange={(event) => setCoverageOpacity(Number(event.target.value))}
          className="flex-1"
        />
        <span className="w-10 text-right text-xs text-slate-400">
          {Math.round(coverageOpacity * 100)}%
        </span>
      </label>

      <button
        type="button"
        onClick={requestCameraReset}
        className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      >
        Reset camera
      </button>
    </div>
  );
}
