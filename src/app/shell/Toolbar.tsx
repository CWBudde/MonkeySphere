import { FileOpenButton, FileSaveButton } from "../../features";
import { getBandLabel } from "../../domain/terz";
import { useDatasetStore, type ViewMode } from "../../store";

const viewModes: { id: ViewMode; label: string }[] = [
  { id: "3d", label: "3D" },
  { id: "2d", label: "2D" },
  { id: "coverage", label: "Coverage" },
  { id: "iso", label: "ISO" },
];

export function Toolbar() {
  const dataset = useDatasetStore((state) => state.dataset);
  const viewMode = useDatasetStore((state) => state.viewMode);
  const setViewMode = useDatasetStore((state) => state.setViewMode);
  const selectedBandIndex = useDatasetStore((state) => state.selectedBandIndex);
  const setSelectedBand = useDatasetStore((state) => state.setSelectedBand);

  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/70 px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <FileOpenButton className="rounded-md bg-indigo-500/90 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400" />
        <FileSaveButton className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50" />
        <button
          className="rounded-md border border-slate-800 px-3 py-2 text-sm font-medium text-slate-500"
          type="button"
          disabled
        >
          Export PNG
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                viewMode === mode.id
                  ? "bg-slate-200 text-slate-900"
                  : "border border-slate-700 text-slate-200 hover:border-slate-500"
              }`}
              type="button"
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Band</label>
        <select
          className="min-w-[200px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!dataset}
          value={dataset ? selectedBandIndex : ""}
          onChange={(event) => setSelectedBand(Number(event.target.value))}
        >
          {!dataset && <option value="">No data loaded</option>}
          {dataset &&
            Array.from({ length: dataset.freq.bandCount }, (_, index) => (
              <option key={index} value={index}>
                {getBandLabel(dataset, index)}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
