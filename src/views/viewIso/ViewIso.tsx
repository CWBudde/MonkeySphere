import { useEffect } from "react";

import { useDatasetStore, useViewIsoStore } from "../../store";
import { IsoView } from "./IsoView";

export function ViewIso() {
  const dataset = useDatasetStore((state) => state.dataset);
  const bandCount = dataset?.freq.bandCount ?? 0;
  const setBandRange = useViewIsoStore((state) => state.setBandRange);
  const setAzimuthIndex = useViewIsoStore((state) => state.setAzimuthIndex);
  const setMaxAngle = useViewIsoStore((state) => state.setMaxAngle);

  useEffect(() => {
    if (!dataset) return;
    if (bandCount > 0) {
      setBandRange(0, bandCount - 1);
    }
    const defaultAzimuth = closestAxisIndex(dataset.azimuth.startDeg, dataset.azimuth.stepDeg, dataset.azimuth.count, 0);
    setAzimuthIndex(defaultAzimuth);
    const maxAxisAngle = axisMaxMagnitude(dataset.polar.startDeg, dataset.polar.stepDeg, dataset.polar.count);
    const defaultMaxAngle = Math.min(90, maxAxisAngle || 90);
    setMaxAngle(defaultMaxAngle);
  }, [dataset, bandCount, setBandRange, setAzimuthIndex, setMaxAngle]);

  if (!dataset) return null;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">ISO Heatmap</div>
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
        <IsoView dataset={dataset} />
      </div>
    </div>
  );
}

function closestAxisIndex(start: number, step: number, count: number, target: number): number {
  if (count <= 1 || step === 0) return 0;
  const index = Math.round((target - start) / step);
  return Math.max(0, Math.min(index, count - 1));
}

function axisMaxMagnitude(start: number, step: number, count: number): number {
  if (count <= 0) return 0;
  const end = start + step * (count - 1);
  return Math.max(Math.abs(start), Math.abs(end));
}
