export function Shell() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">MonkeySphere Web</h1>
            <p className="text-sm text-slate-400">React + TypeScript + Vite + Bun + Tailwind</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
              type="button"
            >
              Open .mob (next)
            </button>
            <button
              className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-900"
              type="button"
            >
              Export PNG (next)
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-base font-semibold">Scaffold complete</h2>
          <p className="mt-2 text-sm text-slate-300">
            Next step is implementing the core dataset model and the{" "}
            <span className="font-mono text-slate-200">.mob</span> codec.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-800 p-4">
              <div className="text-sm font-medium">Views</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li>3D balloon/sphere</li>
                <li>2D polar</li>
                <li>Coverage (3/6/9 dB)</li>
                <li>ISO heatmap</li>
              </ul>
            </div>
            <div className="rounded-md border border-slate-800 p-4">
              <div className="text-sm font-medium">Formats</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li>.mob (first)</li>
                <li>.txt/.tab (CLF-like)</li>
                <li>.xhn / .unf / .gdf</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
