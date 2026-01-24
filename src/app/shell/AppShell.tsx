import { Toolbar } from "./Toolbar";
import { ViewContainer } from "./ViewContainer";
import { useDatasetStore } from "../../store";

export function AppShell() {
  const dataset = useDatasetStore((state) => state.dataset);
  const filePath = useDatasetStore((state) => state.filePath);
  const isDirty = useDatasetStore((state) => state.isDirty);
  const selectedBandIndex = useDatasetStore((state) => state.selectedBandIndex);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-5">
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">MonkeySphere</h1>
            <p className="text-sm text-slate-400">
              Loudspeaker directivity analysis built for the web
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
            {dataset ? "Dataset loaded" : "No dataset"}
          </div>
        </div>
      </header>

      <Toolbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <ViewContainer />
          <aside className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Options</div>
            <p className="text-sm text-slate-300">View-specific controls will live here.</p>
            <div className="mt-auto text-xs text-slate-500">
              {dataset ? "Dataset active" : "Load a dataset to unlock options."}
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-slate-400">
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
