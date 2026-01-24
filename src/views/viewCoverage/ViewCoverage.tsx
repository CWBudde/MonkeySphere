import { useDatasetStore } from "../../store";
import { CoverageView } from "./CoverageView";

export function ViewCoverage() {
  const dataset = useDatasetStore((state) => state.dataset);
  const bandIndex = useDatasetStore((state) => state.selectedBandIndex);

  if (!dataset) return null;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Coverage</div>
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
        <CoverageView dataset={dataset} bandIndex={bandIndex} />
      </div>
    </div>
  );
}
