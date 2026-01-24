import { useDatasetStore } from "../../store";
import { PolarPlot } from "./PolarPlot";

export function View2d() {
  const dataset = useDatasetStore((state) => state.dataset);
  const bandIndex = useDatasetStore((state) => state.selectedBandIndex);

  if (!dataset) return null;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">2D Polar Plot</div>
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
        <PolarPlot dataset={dataset} bandIndex={bandIndex} />
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: "#f87171" }} />
          Horizontal
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: "#60a5fa" }} />
          Vertical
        </div>
      </div>
    </div>
  );
}
