import { useViewCoverageStore } from "../../store/viewCoverageStore";

const COLOR_SWATCH_CLASS =
  "h-8 w-10 cursor-pointer rounded-md border border-slate-700 bg-slate-800";

export function CoverageOptions() {
  const show3db = useViewCoverageStore((state) => state.show3db);
  const show6db = useViewCoverageStore((state) => state.show6db);
  const show9db = useViewCoverageStore((state) => state.show9db);
  const color3db = useViewCoverageStore((state) => state.color3db);
  const color6db = useViewCoverageStore((state) => state.color6db);
  const color9db = useViewCoverageStore((state) => state.color9db);
  const opacity = useViewCoverageStore((state) => state.opacity);
  const setShow3db = useViewCoverageStore((state) => state.setShow3db);
  const setShow6db = useViewCoverageStore((state) => state.setShow6db);
  const setShow9db = useViewCoverageStore((state) => state.setShow9db);
  const setColor3db = useViewCoverageStore((state) => state.setColor3db);
  const setColor6db = useViewCoverageStore((state) => state.setColor6db);
  const setColor9db = useViewCoverageStore((state) => state.setColor9db);
  const setOpacity = useViewCoverageStore((state) => state.setOpacity);

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-200">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Thresholds</div>
      <div className="grid gap-3">
        <label className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={show3db}
              onChange={(event) => setShow3db(event.target.checked)}
            />
            <span>3 dB</span>
          </div>
          <input
            type="color"
            className={COLOR_SWATCH_CLASS}
            value={color3db}
            onChange={(event) => setColor3db(event.target.value)}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={show6db}
              onChange={(event) => setShow6db(event.target.checked)}
            />
            <span>6 dB</span>
          </div>
          <input
            type="color"
            className={COLOR_SWATCH_CLASS}
            value={color6db}
            onChange={(event) => setColor6db(event.target.value)}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={show9db}
              onChange={(event) => setShow9db(event.target.checked)}
            />
            <span>9 dB</span>
          </div>
          <input
            type="color"
            className={COLOR_SWATCH_CLASS}
            value={color9db}
            onChange={(event) => setColor9db(event.target.value)}
          />
        </label>
      </div>

      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">Opacity</div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right text-xs text-slate-400">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
