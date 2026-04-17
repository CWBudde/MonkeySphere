import { useMemo } from "react";

import { availableColormaps } from "../../domain/colormap";
import { getBandLabel } from "../../domain/terz";
import { useDatasetStore, useViewIsoStore } from "../../store";

export function IsoOptions() {
  const dataset = useDatasetStore((state) => state.dataset);
  const bandStart = useViewIsoStore((state) => state.bandStart);
  const bandEnd = useViewIsoStore((state) => state.bandEnd);
  const maxAngle = useViewIsoStore((state) => state.maxAngle);
  const azimuthIndex = useViewIsoStore((state) => state.azimuthIndex);
  const colormap = useViewIsoStore((state) => state.colormap);
  const showPolarGrid = useViewIsoStore((state) => state.showPolarGrid);
  const showCoverage = useViewIsoStore((state) => state.showCoverage);
  const showCoverage3db = useViewIsoStore((state) => state.showCoverage3db);
  const showCoverage6db = useViewIsoStore((state) => state.showCoverage6db);
  const showCoverage9db = useViewIsoStore((state) => state.showCoverage9db);
  const coverageColor3db = useViewIsoStore((state) => state.coverageColor3db);
  const coverageColor6db = useViewIsoStore((state) => state.coverageColor6db);
  const coverageColor9db = useViewIsoStore((state) => state.coverageColor9db);
  const setBandRange = useViewIsoStore((state) => state.setBandRange);
  const setMaxAngle = useViewIsoStore((state) => state.setMaxAngle);
  const setAzimuthIndex = useViewIsoStore((state) => state.setAzimuthIndex);
  const setColormap = useViewIsoStore((state) => state.setColormap);
  const setShowPolarGrid = useViewIsoStore((state) => state.setShowPolarGrid);
  const setShowCoverage = useViewIsoStore((state) => state.setShowCoverage);
  const setShowCoverage3db = useViewIsoStore((state) => state.setShowCoverage3db);
  const setShowCoverage6db = useViewIsoStore((state) => state.setShowCoverage6db);
  const setShowCoverage9db = useViewIsoStore((state) => state.setShowCoverage9db);
  const setCoverageColor3db = useViewIsoStore((state) => state.setCoverageColor3db);
  const setCoverageColor6db = useViewIsoStore((state) => state.setCoverageColor6db);
  const setCoverageColor9db = useViewIsoStore((state) => state.setCoverageColor9db);

  const bandCount = dataset?.freq.bandCount ?? 0;
  const azimuthCount = dataset?.azimuth.count ?? 0;
  const safeBandMax = Math.max(0, bandCount - 1);

  const clampedBandStart = clamp(bandStart, 0, safeBandMax);
  const clampedBandEnd = clamp(bandEnd, clampedBandStart, safeBandMax);

  const azimuthOptions = useMemo(() => {
    if (!dataset || azimuthCount === 0) return [] as Array<{ value: number; label: string }>;
    return Array.from({ length: azimuthCount }, (_, index) => ({
      value: index,
      label: formatAngle(dataset.azimuth.startDeg + dataset.azimuth.stepDeg * index),
    }));
  }, [dataset, azimuthCount]);

  if (!dataset) {
    return <p className="text-sm text-slate-300">Load a dataset to configure ISO.</p>;
  }

  const applyBandStart = (value: number) => {
    const safeStart = clamp(value, 0, safeBandMax);
    const safeEnd = Math.max(safeStart, clampedBandEnd);
    setBandRange(safeStart, safeEnd);
  };

  const applyBandEnd = (value: number) => {
    const safeEnd = clamp(value, clampedBandStart, safeBandMax);
    setBandRange(clampedBandStart, safeEnd);
  };

  const presetAzimuth = (target: number) => {
    const index = closestAxisIndex(dataset.azimuth.startDeg, dataset.azimuth.stepDeg, azimuthCount, target);
    setAzimuthIndex(index);
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-200">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Band Range</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400">
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Start</span>
            <input
              type="number"
              min={0}
              max={safeBandMax}
              value={clampedBandStart}
              onChange={(event) => applyBandStart(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
            <span className="text-[11px] text-slate-500">
              {getBandLabel(dataset, clampedBandStart)}
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">End</span>
            <input
              type="number"
              min={0}
              max={safeBandMax}
              value={clampedBandEnd}
              onChange={(event) => applyBandEnd(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
            <span className="text-[11px] text-slate-500">{getBandLabel(dataset, clampedBandEnd)}</span>
          </label>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Angle</div>
        <label className="mt-3 flex flex-col gap-2 text-xs text-slate-400">
          <span className="text-slate-300">Max angle ({Math.round(maxAngle)}°)</span>
          <input
            type="range"
            min={5}
            max={Math.max(
              10,
              Math.round(
                axisMaxMagnitude(dataset.polar.startDeg, dataset.polar.stepDeg, dataset.polar.count),
              ) || 180,
            )}
            step={1}
            value={maxAngle}
            onChange={(event) => setMaxAngle(Number(event.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Azimuth</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => presetAzimuth(0)}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            0°
          </button>
          <button
            type="button"
            onClick={() => presetAzimuth(90)}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            90°
          </button>
        </div>
        <select
          value={azimuthIndex}
          onChange={(event) => setAzimuthIndex(Number(event.target.value))}
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {azimuthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Colormap</div>
        <select
          value={colormap}
          onChange={(event) => setColormap(event.target.value as typeof colormap)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {availableColormaps.map((map) => (
            <option key={map} value={map}>
              {map}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Overlays</div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPolarGrid}
              onChange={(event) => setShowPolarGrid(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400"
            />
            Angle grid
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCoverage}
              onChange={(event) => setShowCoverage(event.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400"
            />
            Coverage curves
          </label>
        </div>
      </div>

      {showCoverage && (
        <div className="flex flex-col gap-2">
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
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(value, max));
}

function closestAxisIndex(start: number, step: number, count: number, target: number): number {
  if (count <= 1 || step === 0) return 0;
  const index = Math.round((target - start) / step);
  return clamp(index, 0, count - 1);
}

function axisMaxMagnitude(start: number, step: number, count: number): number {
  if (count <= 0) return 0;
  const end = start + step * (count - 1);
  return Math.max(Math.abs(start), Math.abs(end));
}

function formatAngle(angle: number): string {
  const rounded = Math.round(angle * 10) / 10;
  return `${rounded}°`;
}
