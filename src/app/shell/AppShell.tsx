import { Toolbar } from "./Toolbar";
import { ViewContainer } from "./ViewContainer";
import { useDatasetStore } from "../../store";
import { CoverageOptions, IsoOptions, View2dOptions, View3dOptions } from "../../views";
import { ThemeToggle } from "../../ui/ThemeToggle";

export function AppShell() {
  const dataset = useDatasetStore((state) => state.dataset);
  const filePath = useDatasetStore((state) => state.filePath);
  const isDirty = useDatasetStore((state) => state.isDirty);
  const selectedBandIndex = useDatasetStore((state) => state.selectedBandIndex);
  const viewMode = useDatasetStore((state) => state.viewMode);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-5">
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">MonkeySphere</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loudspeaker directivity analysis built for the web
            </p>
          </div>
          <ThemeToggle />
          <div className="rounded-full border border-slate-300 bg-slate-100/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
            {dataset ? "Dataset loaded" : "No dataset"}
          </div>
        </div>
      </header>

      <Toolbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <ViewContainer />
          <aside className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-100/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Options</div>
            {dataset && viewMode === "2d" ? (
              <View2dOptions />
            ) : dataset && viewMode === "coverage" ? (
              <CoverageOptions />
            ) : dataset && viewMode === "3d" ? (
              <View3dOptions />
            ) : dataset && viewMode === "iso" ? (
              <IsoOptions />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">View-specific controls will live here.</p>
            )}
            <div className="mt-auto text-xs text-slate-400 dark:text-slate-500">
              {dataset ? "Dataset active" : "Load a dataset to unlock options."}
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {dataset
              ? `${filePath ?? "Untitled"}${isDirty ? " • unsaved changes" : ""}`
              : "Ready for import"}
          </div>
          <div>{dataset ? `Band ${selectedBandIndex + 1}` : "Band --"}</div>
        </div>
      </footer>
    </div>
  );
}
