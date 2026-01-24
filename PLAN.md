# MonkeySphere Web – Implementation Plan

Re-implementation of the legacy Delphi loudspeaker directivity visualization tool as a modern React + TypeScript web application.

## Scope

### In Scope

- Load and save polar datasets (`.mob` native format + industry formats)
- 3D balloon/sphere visualization with interactive controls
- 2D polar plots (horizontal/vertical slices)
- Coverage view (3/6/9 dB contours)
- ISO view (frequency vs angle heatmap)
- Import pipeline for IR/audio measurements
- PNG and CSV export
- Persistent user settings

### Out of Scope

- Copy protection / registration
- PowerPoint integration
- ActiveX components
- MATLAB/Excel COM automation
- Installer packaging

---

## Milestone 1: Core Data Model & Types

Port the fundamental data structures from `MBFormats.pas` and `MBMain.pas`.

### 1.1 Axis Definitions

- [x] Create `src/domain/types.ts`
- [x] Define `AxisDef` interface
  - [x] `startDeg: number` (start angle in degrees)
  - [x] `stepDeg: number` (step size in degrees)
  - [x] `count: number` (number of values)
- [x] Define `FreqDef` interface
  - [x] `startHz: number` (start frequency)
  - [x] `bandsPerOctave: number` (1, 3, 4, 10, 12, or 24)
  - [x] `bandCount: number` (total bands)
- [x] Add helper: `getFrequencyAtBand(freq: FreqDef, bandIndex: number): number`
- [x] Add helper: `getAngleAtIndex(axis: AxisDef, index: number): number`

### 1.2 Dataset Structure

- [ ] Define `SphereMode` type: `'full' | 'half' | 'quarter' | 'horizontal' | 'vertical'`
- [ ] Define `DatasetMeta` interface
  - [ ] `name?: string`
  - [ ] `manufacturer?: string`
  - [ ] `date?: string`
  - [ ] `notes?: string`
- [ ] Define `Dataset` interface
  - [ ] `azimuth: AxisDef`
  - [ ] `polar: AxisDef`
  - [ ] `freq: FreqDef`
  - [ ] `sphereMode: SphereMode`
  - [ ] `samples: Float32Array` (flattened 3D array)
  - [ ] `meta: DatasetMeta`
  - [ ] `spectrum?: SpectrumData` (optional, from `spec` chunk)

### 1.3 Sample Access Helpers

- [ ] Create `src/domain/dataset.ts`
- [ ] Implement `getSampleIndex(dataset, azIndex, polIndex, bandIndex): number`
- [ ] Implement `getSample(dataset, azIndex, polIndex, bandIndex): number`
- [ ] Implement `setSample(dataset, azIndex, polIndex, bandIndex, value): void`
- [ ] Implement `getHorizontalSlice(dataset, bandIndex): Float32Array`
- [ ] Implement `getVerticalSlice(dataset, bandIndex): Float32Array`
- [ ] Implement `getBandData(dataset, bandIndex): Float32Array` (all angles for one band)

### 1.4 Unit Tests for Data Model

- [ ] Create `src/domain/__tests__/dataset.test.ts`
- [ ] Test index calculation matches legacy formula
- [ ] Test slice extraction for known synthetic data
- [ ] Test edge cases (single-band, single-angle datasets)

---

## Milestone 2: RIFF Container Parser

Implement the RIFF chunk reader/writer needed for `.mob` files.

### 2.1 RIFF Reader

- [ ] Create `src/codecs/riff/riffReader.ts`
- [ ] Define `RiffChunk` interface: `{ id: string; size: number; data: ArrayBuffer }`
- [ ] Implement `readRiffFile(buffer: ArrayBuffer): RiffFile`
  - [ ] Parse RIFF header (4-byte "RIFF", 4-byte size, 4-byte form type)
  - [ ] Validate form type is "MOBA"
  - [ ] Parse chunk list iteratively
  - [ ] Handle chunk padding (RIFF chunks are word-aligned)
- [ ] Implement `getChunk(file: RiffFile, chunkId: string): RiffChunk | undefined`
- [ ] Implement `getAllChunks(file: RiffFile): RiffChunk[]`

### 2.2 RIFF Writer

- [ ] Create `src/codecs/riff/riffWriter.ts`
- [ ] Implement `createRiffFile(formType: string, chunks: RiffChunk[]): ArrayBuffer`
  - [ ] Write RIFF header
  - [ ] Write each chunk with proper padding
  - [ ] Calculate and write total size

### 2.3 Unit Tests for RIFF

- [ ] Create `src/codecs/riff/__tests__/riff.test.ts`
- [ ] Test round-trip: write → read → compare
- [ ] Test with multiple chunks
- [ ] Test chunk padding behavior
- [ ] Test error handling for malformed files

---

## Milestone 3: MOB Format Codec

Implement the native `.mob` file format parser and writer.

### 3.1 MOB Header Parsing

- [ ] Create `src/codecs/mob/mobTypes.ts`
- [ ] Define `MobHeader` interface matching `TMoBHeader` from legacy
  - [ ] Version fields
  - [ ] Azimuth axis (start, step, values)
  - [ ] Polar axis (start, step, values)
  - [ ] Frequency definition (start, step, bands)
  - [ ] Sphere mode
- [ ] Create `src/codecs/mob/mobRead.ts`
- [ ] Implement `parseMobHeader(data: DataView): MobHeader`
  - [ ] Read all header fields with correct byte offsets
  - [ ] Handle endianness (little-endian)

### 3.2 MOB Data Chunks

- [ ] Implement `parsePlevChunk(chunk: ArrayBuffer, header: MobHeader): Float32Array`
  - [ ] Read polar level grid as 32-bit floats
  - [ ] Validate size matches expected sample count
- [ ] Implement `parseClfChunk(chunk: ArrayBuffer): DatasetMeta`
  - [ ] Extract metadata strings (name, manufacturer, notes)
- [ ] Implement `parseSpecChunk(chunk: ArrayBuffer): SpectrumData`
  - [ ] Parse spectrum/impulse data (post-MVP, stub initially)
- [ ] Implement `parseCommChunk(chunk: ArrayBuffer): string` (comment)

### 3.3 MOB File Reader

- [ ] Implement `readMobFile(buffer: ArrayBuffer): Dataset`
  - [ ] Use RIFF reader to extract chunks
  - [ ] Parse header from MOBA chunk
  - [ ] Parse `plev` chunk for sample data
  - [ ] Parse optional chunks (`clf_`, `spec`, `comm`)
  - [ ] Construct and return `Dataset`

### 3.4 MOB File Writer

- [ ] Create `src/codecs/mob/mobWrite.ts`
- [ ] Implement `writeMobHeader(header: MobHeader): ArrayBuffer`
- [ ] Implement `writePlevChunk(samples: Float32Array): ArrayBuffer`
- [ ] Implement `writeClfChunk(meta: DatasetMeta): ArrayBuffer`
- [ ] Implement `writeMobFile(dataset: Dataset): ArrayBuffer`
  - [ ] Construct all chunks
  - [ ] Use RIFF writer to create file

### 3.5 Unit Tests for MOB Codec

- [ ] Create `src/codecs/mob/__tests__/mob.test.ts`
- [ ] Test header parsing with known byte sequences
- [ ] Test round-trip: create dataset → write → read → compare
- [ ] Test with real `.mob` fixture files from legacy app
- [ ] Test optional chunk handling (missing vs present)

---

## Milestone 4: Application State & File Handling

Set up global state management and file open/save workflows.

### 4.1 State Management Setup

- [ ] Install zustand: `bun add zustand`
- [ ] Create `src/store/datasetStore.ts`
- [ ] Define store interface:
  - [ ] `dataset: Dataset | null`
  - [ ] `filePath: string | null`
  - [ ] `isDirty: boolean`
  - [ ] `selectedBandIndex: number`
  - [ ] `viewMode: '3d' | '2d' | 'coverage' | 'iso'`
- [ ] Implement actions:
  - [ ] `loadDataset(dataset: Dataset, path?: string)`
  - [ ] `closeDataset()`
  - [ ] `setSelectedBand(index: number)`
  - [ ] `setViewMode(mode: ViewMode)`
  - [ ] `markDirty()` / `markClean()`

### 4.2 File Open Workflow

- [ ] Create `src/features/fileOpen/fileOpen.ts`
- [ ] Implement `openFile(): Promise<Dataset | null>`
  - [ ] Use File System Access API or `<input type="file">`
  - [ ] Detect format by extension
  - [ ] Call appropriate codec
  - [ ] Return parsed dataset
- [ ] Create `src/features/fileOpen/FileOpenButton.tsx`
  - [ ] Trigger file picker on click
  - [ ] Show loading state during parse
  - [ ] Update store on success
  - [ ] Show error toast on failure

### 4.3 File Save Workflow

- [ ] Create `src/features/fileSave/fileSave.ts`
- [ ] Implement `saveFile(dataset: Dataset, format: string): Promise<void>`
  - [ ] Serialize using appropriate codec
  - [ ] Trigger download or use File System Access API
- [ ] Create `src/features/fileSave/FileSaveButton.tsx`
  - [ ] Save As dialog with format selection
  - [ ] Quick Save if path known

### 4.4 MRU (Most Recently Used) List

- [ ] Create `src/storage/mru.ts`
- [ ] Implement `getMruList(): string[]`
- [ ] Implement `addToMru(filename: string)`
- [ ] Implement `clearMru()`
- [ ] Store in localStorage (names only, not paths)

---

## Milestone 5: App Shell & Navigation

Build the main application layout and view switching.

### 5.1 App Layout

- [ ] Create `src/app/shell/AppShell.tsx`
  - [ ] Header with app title and file info
  - [ ] Toolbar row for primary actions
  - [ ] Main content area (view container)
  - [ ] Optional sidebar for options panel
  - [ ] Status bar (band info, file status)

### 5.2 Toolbar

- [ ] Create `src/app/shell/Toolbar.tsx`
- [ ] Add Open button (connected to file open)
- [ ] Add Save/Save As buttons
- [ ] Add Export PNG button (placeholder)
- [ ] Add view mode toggle buttons: 3D / 2D / Coverage / ISO
- [ ] Add band selector dropdown
  - [ ] List all bands with frequency labels
  - [ ] Show "No data" when no dataset loaded

### 5.3 View Container

- [ ] Create `src/app/shell/ViewContainer.tsx`
- [ ] Render correct view component based on `viewMode`
- [ ] Show placeholder when no dataset loaded
- [ ] Handle view transitions

### 5.4 Band Selector Logic

- [ ] Create `src/domain/terz.ts`
- [ ] Implement `terzFrequency(index: number): number` (third-octave center frequencies)
- [ ] Implement `formatFrequency(hz: number): string` (e.g., "1 kHz", "250 Hz")
- [ ] Implement `getBandLabel(dataset: Dataset, bandIndex: number): string`

---

## Milestone 6: 2D Polar Plot View

Implement the 2D polar plot visualization (simplest view to start).

### 6.1 Polar Plot Canvas

- [ ] Create `src/views/view2d/PolarPlot.tsx`
- [ ] Set up Canvas element with proper sizing
- [ ] Implement resize handling (responsive)

### 6.2 Grid Rendering

- [ ] Implement `drawPolarGrid(ctx, options)`
  - [ ] Draw concentric circles at dB intervals (e.g., every 6 dB)
  - [ ] Draw radial lines at angle intervals (e.g., every 30°)
  - [ ] Draw axis labels (0°, 90°, 180°, 270°)
  - [ ] Draw dB labels on circles

### 6.3 Slice Rendering

- [ ] Implement `drawSlice(ctx, data, color, options)`
  - [ ] Convert polar data to Cartesian coordinates
  - [ ] Draw polyline connecting all points
  - [ ] Close the path for full 360° data
- [ ] Draw horizontal slice (red) from `getHorizontalSlice()`
- [ ] Draw vertical slice (blue) from `getVerticalSlice()`

### 6.4 Normalization

- [ ] Create `src/domain/normalize.ts`
- [ ] Implement `computeMaximum(dataset, bandIndex): number`
- [ ] Implement `computeMinimum(dataset, bandIndex): number`
- [ ] Implement `normalizeValue(value, min, max, range): number`
- [ ] Apply normalization before rendering

### 6.5 2D View Options

- [ ] Create `src/views/view2d/View2dOptions.tsx`
- [ ] Toggle horizontal slice on/off
- [ ] Toggle vertical slice on/off
- [ ] Direction selector (Front/Back/Left/Right)
- [ ] Range controls (max dB, range dB)

### 6.6 Unit Tests for 2D Rendering

- [ ] Test coordinate conversion
- [ ] Test normalization math
- [ ] Snapshot test for known dataset

---

## Milestone 7: Coverage Computation

Implement the 3/6/9 dB coverage calculation used by multiple views.

### 7.1 Coverage Algorithm

- [ ] Create `src/domain/coverage.ts`
- [ ] Define `CoverageResult` type:
  - [ ] `thresholds: number[]` (e.g., [3, 6, 9])
  - [ ] `indices: number[][][]` (threshold × band × azimuth → polar index)
- [ ] Implement `calcCoverage(dataset: Dataset, thresholds: number[]): CoverageResult`
  - [ ] For each band:
    - [ ] For each azimuth:
      - [ ] Find on-axis value (polar = 0)
      - [ ] Walk outward in polar angle
      - [ ] Find index where value drops below threshold
  - [ ] Handle edge cases (never drops, drops immediately)

### 7.2 Coverage Helpers

- [ ] Implement `getCoverageAngle(result, threshold, band, azimuth): number`
- [ ] Implement `getCoverageContour(result, threshold, band): {az: number, pol: number}[]`

### 7.3 Unit Tests for Coverage

- [ ] Create `src/domain/__tests__/coverage.test.ts`
- [ ] Test with synthetic dataset (known falloff pattern)
- [ ] Test edge cases (flat response, steep falloff)
- [ ] Test all three threshold levels

---

## Milestone 8: Coverage View

Implement the 2D coverage contour visualization.

### 8.1 Coverage View Canvas

- [ ] Create `src/views/viewCoverage/CoverageView.tsx`
- [ ] Set up Canvas with square aspect ratio
- [ ] Draw grid from -90° to +90° on both axes

### 8.2 Contour Rendering

- [ ] Implement `drawCoverageContour(ctx, contour, threshold, color)`
  - [ ] Project (azimuth, polar) to (x, y) using trig
  - [ ] Draw closed contour path
  - [ ] Fill with semi-transparent color
- [ ] Draw 3 dB contour (innermost)
- [ ] Draw 6 dB contour (middle)
- [ ] Draw 9 dB contour (outermost)

### 8.3 Coverage View Options

- [ ] Create `src/views/viewCoverage/CoverageOptions.tsx`
- [ ] Toggle individual thresholds on/off
- [ ] Color picker for each threshold
- [ ] Opacity controls

---

## Milestone 9: 3D Balloon View

Implement the interactive 3D sphere visualization.

### 9.1 Three.js Setup

- [ ] Install dependencies: `bun add three @react-three/fiber @react-three/drei`
- [ ] Create `src/views/view3d/View3d.tsx`
- [ ] Set up R3F Canvas with proper sizing
- [ ] Add OrbitControls for camera interaction
- [ ] Add ambient + directional lighting

### 9.2 Sphere Mesh Generation

- [ ] Create `src/views/view3d/BalloonMesh.tsx`
- [ ] Generate sphere geometry from dataset dimensions
  - [ ] Vertices at each (azimuth, polar) grid point
  - [ ] Connect with triangular faces
- [ ] Deform vertex positions based on sample values:
  - [ ] `radius = baseRadius * clamp((value - min) / range, 0, maxScale)`
- [ ] Update geometry when band changes

### 9.3 Vertex Coloring

- [ ] Create `src/domain/colormap.ts`
- [ ] Implement `createColormap(name: 'rainbow' | 'thermal' | 'grayscale'): (t: number) => RGB`
- [ ] Implement `sampleColormap(colormap, value, min, max): RGB`
- [ ] Apply vertex colors to mesh based on sample values

### 9.4 Dots Overlay

- [ ] Create `src/views/view3d/DotsOverlay.tsx`
- [ ] Render point cloud at vertex positions
- [ ] Configurable dot size and color
- [ ] Toggle on/off

### 9.5 Coverage Overlay (3D)

- [ ] Create `src/views/view3d/CoverageOverlay.tsx`
- [ ] Render coverage contours as line loops on sphere surface
- [ ] Use coverage computation from Milestone 7
- [ ] Different colors for 3/6/9 dB

### 9.6 3D View Options

- [ ] Create `src/views/view3d/View3dOptions.tsx`
- [ ] Toggle surface/wireframe
- [ ] Toggle dots overlay
- [ ] Toggle coverage overlays
- [ ] Colormap selector
- [ ] Range controls
- [ ] Camera reset button

### 9.7 Performance Optimization

- [ ] Use BufferGeometry with typed arrays
- [ ] Memoize geometry when only color changes
- [ ] Consider LOD for large datasets

---

## Milestone 10: ISO View (Heatmap)

Implement the frequency vs angle heatmap visualization.

### 10.1 ISO View Canvas

- [ ] Create `src/views/viewIso/IsoView.tsx`
- [ ] Set up Canvas element
- [ ] Define coordinate system:
  - [ ] X axis: frequency band index
  - [ ] Y axis: polar angle (0 at center, mirrored)

### 10.2 Heatmap Rendering

- [ ] Implement `renderHeatmap(ctx, dataset, band, azimuthIndex, options)`
  - [ ] For each (band, angle) cell:
    - [ ] Get sample value
    - [ ] Map to color via colormap
    - [ ] Fill cell rectangle
- [ ] Support configurable band range (lower/upper limits)
- [ ] Support configurable max angle

### 10.3 Axis Labels

- [ ] Draw frequency labels on X axis (at band positions)
- [ ] Draw angle labels on Y axis (0° center, ±max° at edges)
- [ ] Draw colorbar legend

### 10.4 ISO Overlays

- [ ] Implement polar arc overlay (lines at specific angles)
- [ ] Implement coverage curve overlay (from coverage computation)
- [ ] Toggle each overlay on/off

### 10.5 Azimuth Slice Selection

- [ ] Add azimuth angle selector (like legacy `fIsoAngle`)
- [ ] Preset options: 0° (horizontal), 90° (vertical)
- [ ] Update heatmap when azimuth changes

### 10.6 ISO View Options

- [ ] Create `src/views/viewIso/IsoOptions.tsx`
- [ ] Band range slider (lower/upper)
- [ ] Max angle slider
- [ ] Azimuth selector
- [ ] Overlay toggles
- [ ] Colormap selector

---

## Milestone 11: Additional File Formats

Add support for industry-standard polar data formats.

### 11.1 CLF Text Format (`.txt` / `.tab`)

- [ ] Create `src/codecs/clf/clfRead.ts`
- [ ] Parse CLF header lines (metadata)
- [ ] Parse data grid (whitespace-delimited values)
- [ ] Handle sensitivity adjustments
- [ ] Implement on-axis consistency check (warn if >2 dB variation)
- [ ] Create `src/codecs/clf/clfWrite.ts`
- [ ] Write CLF-compatible output

### 11.2 XHN Format (EASE 3.0)

- [ ] Create `src/codecs/xhn/xhnRead.ts`
- [ ] Analyze legacy `LoadXHN` for format details
- [ ] Parse header and data sections
- [ ] Create `src/codecs/xhn/xhnWrite.ts`

### 11.3 UNF Format

- [ ] Create `src/codecs/unf/unfRead.ts`
- [ ] Analyze legacy `LoadUNF` for format details
- [ ] Create `src/codecs/unf/unfWrite.ts`

### 11.4 GDF Format

- [ ] Create `src/codecs/gdf/gdfRead.ts`
- [ ] Analyze legacy `LoadGDF` for format details
- [ ] Create `src/codecs/gdf/gdfWrite.ts`

### 11.5 Format Detection

- [ ] Create `src/codecs/detect.ts`
- [ ] Implement `detectFormat(filename: string, buffer: ArrayBuffer): FormatType`
- [ ] Check magic bytes where applicable
- [ ] Fall back to extension

### 11.6 Golden Test Fixtures

- [ ] Collect sample files for each format from legacy app
- [ ] Add to `fixtures/` directory
- [ ] Write integration tests loading each fixture

---

## Milestone 12: Export Features

Implement data and image export capabilities.

### 12.1 PNG Export

- [ ] Create `src/features/export/exportPng.ts`
- [ ] Implement `exportViewAsPng(canvas: HTMLCanvasElement): Blob`
- [ ] For 2D/Coverage/ISO: use canvas `toBlob()`
- [ ] For 3D: capture from Three.js renderer
- [ ] Add resolution options (1x, 2x, 300 DPI)
- [ ] Trigger download with appropriate filename

### 12.2 CSV Export

- [ ] Create `src/features/export/exportCsv.ts`
- [ ] Implement `exportDatasetAsCsv(dataset: Dataset): string`
  - [ ] Header row with band frequencies
  - [ ] One row per (azimuth, polar) combination
  - [ ] Values in dB
- [ ] Trigger download

### 12.3 POX Export (if needed)

- [ ] Analyze legacy POX format requirements
- [ ] Implement if required for parity

---

## Milestone 13: Settings Persistence

Replace legacy INI file with browser-based persistence.

### 13.1 Settings Schema

- [ ] Install zod: `bun add zod`
- [ ] Create `src/storage/settingsSchema.ts`
- [ ] Define schema for all persistent settings:
  - [ ] View preferences (default view mode, range settings)
  - [ ] 3D options (colormap, overlays, dot size)
  - [ ] 2D options (slice visibility, direction)
  - [ ] ISO options (band range, max angle)
  - [ ] Coverage options (threshold colors, opacity)
  - [ ] Window state (sidebar open/closed)
- [ ] Add schema version for migrations

### 13.2 Settings Store

- [ ] Create `src/storage/settings.ts`
- [ ] Implement `loadSettings(): Settings`
  - [ ] Read from localStorage
  - [ ] Validate with zod
  - [ ] Apply defaults for missing fields
  - [ ] Handle version migrations
- [ ] Implement `saveSettings(settings: Settings)`
- [ ] Implement `resetSettings()`

### 13.3 Settings UI

- [ ] Create `src/features/options/OptionsPanel.tsx`
- [ ] Create `src/features/options/OptionsDialog.tsx`
- [ ] Organize by category (view-specific, global)
- [ ] Auto-save on change

---

## Milestone 14: Import Pipeline (Post-MVP)

Implement the IR/audio measurement import wizard.

### 14.1 File Selection

- [ ] Create `src/features/import/ImportWizard.tsx`
- [ ] Directory selection (File System Access API where supported)
- [ ] Multi-file drag-drop fallback
- [ ] File list display with detected angles

### 14.2 Filename Pattern Detection

- [ ] Create `src/features/import/patternDetect.ts`
- [ ] Detect `IR*` naming patterns
- [ ] Detect `H???V???` / `V???H???` patterns
- [ ] Infer azimuth/polar angles from filenames
- [ ] Infer sphere symmetry (full/half/quarter)
- [ ] Display detected configuration for user confirmation

### 14.3 Audio Decoding

- [ ] Create `src/workers/audioDecoder.ts`
- [ ] Use Web Audio API `decodeAudioData()`
- [ ] Support WAV, AIFF, AU formats
- [ ] Extract sample data as Float32Array
- [ ] Handle stereo (select channel)

### 14.4 FFT Processing

- [ ] Create `src/workers/fftWorker.ts`
- [ ] Evaluate FFT library (e.g., `fft.js`, consider WASM for performance)
- [ ] Compute magnitude spectrum
- [ ] Implement band integration:
  - [ ] 1/3 octave bands
  - [ ] 1/4, 1/10, 1/12, 1/24 octave options
- [ ] Return banded magnitude values

### 14.5 Dataset Assembly

- [ ] Combine processed files into Dataset structure
- [ ] Perform on-axis consistency check
  - [ ] Warn if variation > 2 dB
  - [ ] Offer to normalize to average
- [ ] Populate metadata

### 14.6 Import Worker Orchestration

- [ ] Create main import worker that coordinates:
  - [ ] File reading
  - [ ] Audio decoding
  - [ ] FFT processing
  - [ ] Progress reporting
- [ ] Show progress bar in UI
- [ ] Support cancellation

---

## Milestone 15: Error Handling & Logging

Implement the error log panel (like legacy `MBErrors`).

### 15.1 Error Store

- [ ] Create `src/store/errorStore.ts`
- [ ] Define `LogEntry` type: `{ level: 'info' | 'warn' | 'error', message: string, timestamp: Date }`
- [ ] Implement `addLog(entry: LogEntry)`
- [ ] Implement `clearLog()`
- [ ] Implement `getErrors(): LogEntry[]`

### 15.2 Error Panel UI

- [ ] Create `src/features/errors/ErrorPanel.tsx`
- [ ] Show collapsible panel in app shell
- [ ] List all log entries with icons by level
- [ ] Clear button
- [ ] Show count badge when minimized

### 15.3 Integration

- [ ] Log parsing warnings from codecs
- [ ] Log import issues (on-axis check failures)
- [ ] Log file save errors
- [ ] Log WebGL capability issues

---

## Milestone 16: Speaker Info Panel

Implement the metadata display/edit panel (like legacy `MBInfo`).

### 16.1 Info Panel UI

- [ ] Create `src/features/info/InfoPanel.tsx`
- [ ] Display dataset metadata:
  - [ ] Speaker name
  - [ ] Manufacturer
  - [ ] Date
  - [ ] Notes
- [ ] Display dataset statistics:
  - [ ] Axis dimensions
  - [ ] Frequency range
  - [ ] Sphere mode

### 16.2 Metadata Editing

- [ ] Make metadata fields editable
- [ ] Update dataset in store on edit
- [ ] Mark file as dirty

---

## Milestone 17: Testing & Validation

Comprehensive testing against legacy application.

### 17.1 Visual Regression Tests

- [ ] Set up visual regression testing (e.g., Playwright)
- [ ] Capture screenshots of all view modes
- [ ] Compare against reference images from legacy app

### 17.2 Data Accuracy Tests

- [ ] Load same `.mob` file in legacy and web app
- [ ] Export data from both
- [ ] Compare numerically (values should match exactly)

### 17.3 Performance Benchmarks

- [ ] Measure `.mob` parse time
- [ ] Measure 3D mesh generation time
- [ ] Measure ISO heatmap render time
- [ ] Set performance budgets

### 17.4 Browser Compatibility

- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test on mobile (touch controls for 3D)
- [ ] Document any browser-specific limitations

---

## Milestone 18: Polish & Documentation

Final polish for release.

### 18.1 Keyboard Shortcuts

- [ ] Band navigation (arrow keys)
- [ ] View switching (1-4 keys)
- [ ] File operations (Ctrl+O, Ctrl+S)

### 18.2 Responsive Layout

- [ ] Test on various screen sizes
- [ ] Collapsible sidebar on small screens
- [ ] Touch-friendly controls

### 18.3 Loading States

- [ ] Show skeleton/spinner during file load
- [ ] Show progress for large operations
- [ ] Graceful error states

### 18.4 User Documentation

- [ ] Create help overlay / tour
- [ ] Document file format compatibility
- [ ] Document keyboard shortcuts

---

## Open Questions

Resolve before starting related milestones:

- [ ] Confirm exact normalization behavior ("maximum derived from norm angle")
- [ ] Confirm ISO view preset requirements (90° horiz / 0° vertical)
- [ ] Confirm whether POX export is required for v1
- [ ] Determine if spectrum viewer is required for MVP
