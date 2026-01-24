# MonkeySphere Web – Implementation Plan (React + TS + Vite + Bun + Tailwind)

This plan converts the `legacy/Source` Delphi application into a modern web app while keeping the same core capabilities: load/visualize/export loudspeaker polar datasets, with 3D/2D/ISO/Coverage views.

## 0) Scope & principles

### In scope (MVP → parity)
- Load, display, and export speaker polar datasets.
- Support the same primary view modes:
  - 3D balloon/sphere
  - 2D polar plots (horizontal/vertical)
  - Coverage view (3/6/9 dB)
  - ISO view (frequency vs angle heatmap)
- Support at least the native `.mob` format first, then add other formats.
- Persist settings (view options, last file, MRU) locally.

### Out of scope (explicit)
- Any copy protection / registration logic.
- PowerPoint integration and installer.
- ActiveX-related code paths.
- MATLAB/Excel COM automation.

### Guiding principles
- Separate concerns:
  - **Codecs** (parse/write) are pure and unit-tested.
  - **Derived computations** (coverage, normalizations) are deterministic and unit-tested.
  - **Rendering** uses explicit, reusable view-models and does not own business logic.
- Keep the core data model compatible with legacy semantics:
  - angular axes + banded frequency axis
  - flattened array storage (fast, easy to interop)
- Keep the UI responsive:
  - parsing + heavy computations in Web Workers where beneficial.

## 1) Project setup (Vite + Bun + Tailwind)

### Tooling
- Runtime/dev server: Vite
- Package manager: Bun
- Language: TypeScript
- UI: React
- Styling: Tailwind

### Commands
- Create app: `bun create vite` (React + TS)
- Install deps: `bun install`
- Dev: `bun run dev`
- Build: `bun run build`
- Test: `bun run test`

### Recommended libraries
Minimal, high-ROI set:
- State: `zustand` (small, ergonomic)
- Validation: `zod` (for settings schemas)
- 3D: `three` + `@react-three/fiber` (+ optional `@react-three/drei`)
- Charts (2D polar/ISO): start with Canvas/SVG (custom) to avoid heavy dependencies; optionally evaluate `d3` later.
- Tests: `vitest` + `@testing-library/react`


## 2) Target architecture

### Folder layout (proposed)
```
src/
  app/
    App.tsx
    routes.tsx
    shell/
  domain/
    dataset/
      types.ts
      axes.ts
      dataset.ts
      derive.ts
      coverage.ts
      normalize.ts
  codecs/
    riff/
      riffReader.ts
      riffWriter.ts
    mob/
      mobTypes.ts
      mobRead.ts
      mobWrite.ts
    text/
      clf.ts
      unf.ts
      xhn.ts
      gdf.ts
  workers/
    parseWorker.ts
    computeWorker.ts
  features/
    fileOpen/
    export/
    views/
      view3d/
      view2d/
      viewIso/
      viewCoverage/
    options/
  ui/
    components/
    layout/
    primitives/
  storage/
    settings.ts
    mru.ts
  utils/
    math.ts
    terz.ts
    colorMap.ts
```

### Core boundaries
- `domain/`: platform-agnostic logic (no DOM, no Three.js).
- `codecs/`: parse/write modules; return/accept `domain/dataset` structures.
- `features/`: UI workflows (open file, change view, export).
- `views/`: rendering surfaces for each view mode.
- `workers/`: off-main-thread parsing and heavy compute.


## 3) Data model (mirror legacy semantics)

### Canonical dataset shape
Represent the dataset similarly to Delphi:
- Axes:
  - azimuth: start, step, values
  - polar: start, step, values
  - frequency bands: `freqStart`, `freqStep`, `freqBands`
- Samples:
  - `Float32Array` length = `azimuth.values * polar.values * freqBands`
  - index = `az * polar.values * freqBands + pol * freqBands + band`

### Types (initial)
- `AxisDef { startDeg: number; stepDeg: number; values: number }`
- `FreqDef { startHz: number; stepPerOctave: number; bands: number }`
- `SphereMode = 'quarter' | 'half' | 'full' | 'horizontal' | 'vertical'`
- `Dataset { header: MobHeaderLike; axes: { azimuth; polar; freq }; samples: Float32Array; meta: { name?; manufacturer?; notes? }; spectrum?: SpectrumChunk }`

### Derived data
Computed on demand (memoized):
- `coverageIndices[thresholdIndex][band][az]` (like legacy `fStdCoverage`)
- view-dependent normalization (legacy has “maximum/norm” behavior)


## 4) File formats implementation order

### Phase 1 (must-have): `.mob` (native)
Goal: full-fidelity round trip for the web app.
- Implement a RIFF reader/writer.
- Implement `MOBA` header read/write.
- Implement required `plev` chunk parse/write.
- Parse optional chunks if present:
  - `clf_` metadata
  - `spec` spectrum
  - `comm`, `fico`

Acceptance criteria:
- Can open existing `.mob` files and render all views.
- Can re-save `.mob` without data loss (for supported chunks).
- Unit tests: read/write symmetry for synthetic fixtures.

### Phase 2: CLF-like text (`.txt/.tab`)
- Parse the subset needed to match legacy load behavior.
- Support sensitivity adjustments and on-axis checks as optional warnings.

### Phase 3: XHN / UNF / GDF
- Add one-by-one with golden test fixtures.
- Keep parsers tolerant (legacy code has many leniencies).


## 5) Rendering plan (feature parity)

### View switching
Implement a single view state:
- `viewMode: '3d' | '2d' | 'coverage' | 'iso'`
- `selectedBandIndex` OR `isoAzimuthAngle` when ISO mode uses angle selection.

### 5.1 3D balloon/sphere
Approach: Three.js via React Three Fiber.
- Create a sphere mesh parameterized by polar/azimuth grid.
- For each vertex, set radius from normalized value:
  - `r = clamp((value - minimum) / range, 0, rMax)`
- Apply vertex colors from a colormap (legacy gradient modes).
- Optional overlays:
  - dots (point cloud)
  - coverage loops (3/6/9 dB) as line geometries
- Camera controls: orbit controls + reset.

Acceptance criteria:
- Displays geometry consistent with legacy shape changes as band changes.
- Dots/coverage toggles work.

### 5.2 2D polar plots
Approach: Canvas (fast) or SVG (simple). Start with Canvas.
- Draw grid circles and axes labels.
- Draw up to two polylines:
  - horizontal slice (red)
  - vertical slice (blue)
- Support direction/view options (legacy “Front/Back/Left/Right/Up/Down”).
- Support normalization behavior used in the 2D rendering.

Acceptance criteria:
- Correctly updates with band selection.
- Matches the app’s basic orientation options.

### 5.3 Coverage view
Approach: Canvas.
- Draw square grid (-90..+90 deg labels).
- For each threshold (3/6/9 dB):
  - compute coverage contour per azimuth
  - project to 2D and draw contour

Acceptance criteria:
- Contours change with band and match the intuition of narrowing/widening.

### 5.4 ISO view (frequency vs angle)
Approach: Canvas first (image-based heatmap), upgrade to WebGL if needed.
- X axis = band index range (lower..upper)
- Y axis = angle from 0..maxAngle, mirrored
- Z/value = normalized value mapped to colormap
- Optional overlays:
  - polar arcs
  - coverage lines
- Allow selection of azimuth slice (`isoAngle`) similar to legacy.

Acceptance criteria:
- Heatmap renders quickly for typical dataset sizes.
- Labels align with band frequency labeling.


## 6) Derived computations (domain layer)

### Normalization modes
The legacy UI has behavior where “maximum” can be derived from averages around a norm angle range. Implement as explicit functions:
- `computeMinimum(dataset, band, rangeSettings): number`
- `normalizeValue(value, minimum, range): number`

### Coverage computation
Port `CalcCoverage` into pure TS:
- Inputs: `dataset`, `band`, thresholds `[3,6,9]`, sphere mode
- Output: indices or angles for coverage boundary per azimuth

Testing:
- Deterministic tests with small synthetic datasets.

### Terz/third-octave utilities
Implement:
- `terzIndex(fHz)`
- `terzFrequency(index)`
- helper to compute band center frequency and label.


## 7) Import pipeline (post-MVP, but planned)

Goal: bring over the “value add” import wizard (IR/audio → banded polar dataset).

### Implementation approach
- UI: drag-drop / directory selection (where supported) or multi-file import.
- Parsing/FFT/banding in a worker.
- Audio decode: Web Audio API (`AudioContext.decodeAudioData`) where possible.
- FFT: a fast JS FFT library (evaluate performance; switch to WASM later if required).

### Output
- Build a dataset matching the canonical model.
- Export to `.mob`.

Acceptance criteria:
- For a known measurement set, produces a plausible balloon and correct band labels.


## 8) Export features

### Images
- Export current view as PNG:
  - Canvas: `toDataURL` or `toBlob`
  - Three.js: renderer capture

### Data exports
- `.mob` save (Phase 1)
- CSV export as a replacement for legacy Excel automation.
- POX: implement if needed (specify exact expected output from legacy before porting).


## 9) Settings persistence

Replace INI with JSON:
- `localStorage` for:
  - last opened file metadata
  - MRU list (file names only; browser sandbox applies)
  - view settings and style options

Use `zod` to version settings schemas.


## 10) UX plan (screens)

### App shell
- Top toolbar:
  - Open
  - Save / Save As
  - Export PNG
  - View mode buttons (3D / 2D / ISO / Coverage)
  - Band selector

### Left/right panels
- Options panel (collapsible):
  - range settings (max/range/norm)
  - color/gradient settings
  - toggles for dots/coverage/legend
  - ISO-specific controls (angle, band range, max angle)

### Error/Warnings panel
- Show parse/import warnings (on-axis checks, malformed files).


## 11) Testing & validation strategy

### Unit tests (domain + codecs)
- `mobRead` and `mobWrite` round-trip for fixtures.
- Coverage computation tests with small datasets.
- Normalization tests.

### UI tests
- Smoke tests:
  - open file
  - change band
  - switch view

### Performance checks
- Measure time-to-first-render for:
  - parsing `.mob`
  - generating 3D mesh
  - rendering ISO heatmap


## 12) Milestones & deliverables

### Milestone A — Skeleton app (1–2 days)
- Vite/Bun/Tailwind scaffolding
- App shell + routing (if needed)
- Basic state store
- Placeholder views

Deliverable: runnable web app shell.

### Milestone B — Core dataset + `.mob` read (3–6 days)
- Implement RIFF reader
- Parse `MOBA` header + `plev`
- Load a `.mob` and show metadata + band list

Deliverable: open `.mob` and inspect data.

### Milestone C — 2D view + band switching (2–4 days)
- Implement 2D canvas polar plot
- Range/max/norm handling

Deliverable: 2D view parity for typical datasets.

### Milestone D — 3D balloon view (4–8 days)
- Sphere mesh from dataset
- Colormap mapping
- Orbit controls + reset
- Optional dots overlay

Deliverable: interactive 3D visualization.

### Milestone E — Coverage computation + overlays (2–5 days)
- Port `CalcCoverage`
- Coverage view + 3D overlay

Deliverable: 3/6/9 dB coverage features.

### Milestone F — ISO view (4–7 days)
- Heatmap generation
- Band range + max angle controls
- Optional overlays

Deliverable: ISO view parity.

### Milestone G — Save/export (3–6 days)
- `.mob` write (header + plev + selected optional chunks)
- Export PNG
- CSV export

Deliverable: practical read/modify/save workflow.

### Milestone H — Additional formats (ongoing)
- CLF text first, then XHN/UNF/GDF
- Add fixtures per format

Deliverable: broader interoperability.

### Milestone I — Import wizard (later)
- Worker-based FFT/banding
- UI workflow

Deliverable: IR/audio import pipeline.


## 13) Open questions / decisions to lock down early

These affect implementation details; answer them before Milestone C/D:
- Confirm whether datasets are always stored as absolute dB or relative values per format.
- Confirm exact normalization behavior expected when “maximum is derived from norm angle”.
- Confirm whether ISO view should support both “90° horiz / 0° vertical” presets exactly.
- Decide whether POX export is required for v1; if yes, define expected output precisely.


## 14) Risks & mitigations

- **Web file access limitations**: browsers can’t freely access MRU paths.
  - Mitigation: MRU becomes “recently opened names”, plus user-driven re-open.
- **Performance on large datasets**:
  - Mitigation: typed arrays, memoized derived results, offload to workers.
- **Legacy formats are messy/variable**:
  - Mitigation: tolerant parsing + good error messages + fixture corpus.
- **3D parity differences** (GLScene immediate-mode vs modern WebGL):
  - Mitigation: validate against visual snapshots and known datasets.
