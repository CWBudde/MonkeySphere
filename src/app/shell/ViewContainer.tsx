import { useCallback, useMemo, useState } from "react";

import { openFileFromFile } from "../../features";
import { addToMru } from "../../storage/mru";
import { useDatasetStore } from "../../store";
import { View2d, View3d, ViewCoverage, ViewIso } from "../../views";

const viewLabels: Record<string, string> = {
  "3d": "3D Balloon",
  "2d": "2D Polar",
  coverage: "Coverage",
  iso: "ISO Heatmap",
};

export function ViewContainer() {
  const dataset = useDatasetStore((state) => state.dataset);
  const viewMode = useDatasetStore((state) => state.viewMode);
  const loadDataset = useDatasetStore((state) => state.loadDataset);
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      try {
        const result = await openFileFromFile(file);
        loadDataset(result.dataset, result.fileName);
        addToMru(result.fileName);
      } catch (error) {
        console.error("Failed to open dropped file", error);
        window.alert("Failed to open dropped file. See console for details.");
      }
    },
    [loadDataset],
  );

  const placeholder = useMemo(() => viewLabels[viewMode] ?? "View", [viewMode]);

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
      {!dataset && (
        <div
          className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? "border-indigo-400/80 bg-indigo-500/10 text-indigo-100"
              : "border-slate-700/80 text-slate-300"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="text-sm uppercase tracking-[0.4em] text-slate-400">Drop File</div>
          <p className="mt-3 text-lg font-semibold">Drag & drop a .mob file</p>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            We will parse native MonkeySphere datasets first. More formats will follow.
          </p>
        </div>
      )}

      {dataset && viewMode === "2d" && <View2d />}
      {dataset && viewMode === "3d" && <View3d />}
      {dataset && viewMode === "coverage" && <ViewCoverage />}
      {dataset && viewMode === "iso" && <ViewIso />}

      {dataset &&
        viewMode !== "2d" &&
        viewMode !== "3d" &&
        viewMode !== "coverage" &&
        viewMode !== "iso" && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 px-6 py-12 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Active View</div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">{placeholder}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Rendering for this view will land in upcoming milestones.
          </p>
        </div>
      )}
    </div>
  );
}
