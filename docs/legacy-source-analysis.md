# MonkeySphere (legacy/Source) – Feature & Architecture Research

## Scope (what this document covers)

This document describes the Delphi/VCL application code under `legacy/Source` only.

Explicitly out of scope (per project constraints):

- Copy protection / registration mechanics
- PowerPoint integration
- Installer packaging
- The ActiveX variants under `legacy/Source/ActiveX (...)` (not required for a React port)

## What MonkeySphere is (product-level summary)

MonkeySphere is a loudspeaker directivity / polar-data visualization tool.

At its core it:

- Loads loudspeaker polar datasets in several formats (native `.mob` plus a set of text/industry formats).
- Stores them internally as a 3D grid (azimuth × polar/elevation × frequency-band).
- Provides multiple visualizations:
  - 3D “balloon/sphere” plot (colored surface, optional dots)
  - 2D polar plots (horizontal and/or vertical slices)
  - “Coverage” view: 3/6/9 dB coverage contour around the on-axis response
  - “ISO” view: an orthographic heatmap-like plot over frequency bands and angle
- Imports impulse responses / audio or SPK-like data and converts them into banded magnitude responses.
- Exports screenshots and data (including conversion between supported polar file formats).
- Persists UI/layout/view configuration in an INI file.

The application is primarily organized around a large main form that owns both the data model and most rendering and file I/O.

## Key screens/forms and responsibilities

Entry point: `MonkeySphere.dpr` creates these forms:

- **Main window**: `TFmMonkeySphere` (`MBMain.pas`)
  - Owns the data arrays, active frequency selection, view state.
  - Implements load/save across file formats.
  - Implements 3D/2D/ISO/Coverage rendering.
  - Implements export to PNG/XLS/POX.

- **Import wizard**: `TFmImport` (`MBImport.pas`)
  - Directory-based import pipeline (FFT/banding from IR/audio), plus SPK support.
  - Auto-detection of angle steps / symmetry from filenames.
  - Writes results back into the main form’s data structures.

- **Options and view settings**
  - `MBViewOptions.pas` (main options dialog)
  - Frames: `MB2DOptions.*`, `MB3DOptions.*`, `MBISOBarOptionspas.*`, `MBRangeOptions.*`
  - Large set of rendering/style controls (gradient, dot size, coverage colors/opacities, legend, etc.).

- **Info panel**: `MBInfo.pas`
  - Speaker metadata: manufacturer/name/date/contact notes etc.

- **Spectrum viewer**: `MBSpectrum.pas`
  - Displays spectrum/impulse/phase views (used with imported `spec` chunks).

- **Error log**: `MBErrors.pas`
  - Accumulates warnings during parsing/import (e.g., on-axis inconsistencies).

- **Build/generate**: `MBBuild.pas`
  - Creates synthetic datasets using either:
    - MATLAB OLE automation (`matlab.application`)
    - or an internal expression evaluator (`DCalcul`)

- **OpenGL capability viewer**: `MBOpenGLInfo.pas`
  - Queries OpenGL vendor/renderer/version/extensions.

Notes:

- `MBMeasurement.*` exists but measurement UI creation is commented out in the program startup.
- `MBSettings.pas` appears inconsistent (references `FmMonkeyBall`/`GLBall`), suggesting it is either stale/renamed or partially broken.

## Core data model (how the application represents a dataset)

The central structure is a native “MOBA” header (`TMoBHeader` in `MBFormats.pas`) plus several arrays owned by `TFmMonkeySphere`.

### Angular and frequency axes

A dataset is defined by:

- **Azimuth axis**
  - `StaticHeader.Azimuth.Start` (degrees)
  - `StaticHeader.Azimuth.Step` (degrees)
  - `StaticHeader.Azimuth.Values` (count)
- **Polar axis** (elevation / theta)
  - `StaticHeader.Polar.Start` (degrees)
  - `StaticHeader.Polar.Step` (degrees)
  - `StaticHeader.Polar.Values` (count)
- **Frequency axis** (banded)
  - `StaticHeader.FreqStart` (Hz)
  - `StaticHeader.FreqStep` (bands-per-octave like 1 or 3)
  - `StaticHeader.FreqBands` (count)

Frequencies are treated as logarithmic bands:

- $f_i = f_0 \cdot 2^{i/\text{FreqStep}}$
- Many views snap to third-octave “Terz” frequencies using a lookup table.

### Main grid values

`MBMain.pas` stores the main polar grid as a **flattened 3D array** of `Single`:

- `fDataArray: array of Single`
- Indexed as:
  - `AzimuthValue * Polar.Values * FreqBands + PolarValue * FreqBands + FrequencyValue`

This represents gain/level in dB-like units (depending on source format and normalization mode).

### Additional derived/aux data

Common additional arrays include:

- `fStdCoverage[c, freq, az]` coverage indices for 3/6/9 dB thresholds.
- `fSensitivityArray[freq]` used in some imports (e.g., CLF-based sensitivity adjustment).
- Spectrum-related structures (`spec` chunk): per-band spectrum arrays stored in `SPKs` and `SPKData`.

## Supported file formats (load/save)

The main Open dialog filter in `MBMain.pas` includes:

- Native MonkeySphere: `*.mob`
- Text: `*.txt;*.tab` (CLF-like)
- EASE 3.0: `*.xhn`
- UNF: `*.unf`
- GDF: `*.gdf`

Loading paths in `MBMain.pas`:

- `LoadMOB`
- `LoadText` → chooses between `LoadCLF` and `LoadBOSE`
- `LoadXHN`
- `LoadUNF`
- `LoadGDF`

Saving paths in `MBMain.pas`:

- `SaveMOB`
- `SaveCLF`
- `SaveXHN`
- `SaveUNF`
- `SaveGDF`

### Native `.mob` format (high-level)

`MBFormats.pas` defines the native container as a RIFF-like file with:

- A `RIFF` header and `MOBA` chunk identifier
- Core header (`TMoBHeader`)
- A primary data chunk (`plev`) holding the polar level grid
- Optional chunks:
  - `clf_` (metadata / CLF record)
  - `spec` (spectrum/impulse data)
  - `comm`, `fico` (comment / “file info” style payloads)

This is the best “full fidelity” format for round-tripping MonkeySphere-specific features.

## Import pipeline (audio/IR → polar band grid)

The import wizard (`MBImport.pas`) is a major feature and one of the main “value adds” beyond format conversion.

### What it does

- Scans a directory for measurement files by mask/extension.
- Loads either:
  - SPK-like files (header + spectrum), or
  - general audio/IR formats (WAV/AIFF/AU/… via `Audio_*` units / `FileFormats.FindFromFileName`).
- Computes FFT magnitude.
- Integrates FFT bins into log-spaced frequency bands (1, 3, 4, 10, 12, 24 per octave options).
- Generates a polar dataset by mapping each file to an (azimuth, polar) position.

### Auto-detection heuristics

The import logic tries to infer:

- Sphere symmetry (full/half/quarter)
- Angle step sizes
- Which angle is “horizontal” vs “vertical”

From filename patterns such as:

- `IR*`
- `H???V???` or `V???H???`

It also performs “on-axis checks”:

- If the on-axis values vary more than ~2 dB across azimuth for a band, it prompts to correct to average and logs this via `MBErrors`.

### Output of import

The import wizard writes:

- `StaticHeader` axis definitions (steps/counts)
- `fDataArray` banded magnitude values
- Optionally populates `spec` chunk data (`SPKs`/`SPKData`) for later spectrum viewing.

## Visualizations (what the app can show)

MonkeySphere has four main view modes, toggled by actions/buttons in `MBMain.pas`.

### 1) 3D view (balloon/sphere)

Backed by OpenGL/GLScene render callbacks.

Key elements:

- A surface drawn from the polar grid, scaled by (value − minimum)/range.
- Optional “dots” overlay (point cloud) with configurable size/color/shading.
- Optional coverage contours (3/6/9 dB) drawn as line loops on the sphere.
- A reference grid (point-sampled sphere grid) rendered separately.

### 2) 2D view (polar plots)

Renders one or two 2D polar plots in screen space:

- Horizontal slice (red)
- Vertical slice (blue)

The labeling/orientation is configurable:

- “direction” (which axis is ‘front/up/left/right’)
- “view” (swapping left/right orientation)

It also draws range rings with dB labels based on the active range/max/normalization settings.

### 3) Coverage view (3/6/9 dB)

This view draws a square grid labeled -90..+90 degrees on both axes and then draws coverage contours.

Mechanically:

- Uses the on-axis response for each azimuth and finds the polar angle where the response drops by 3/6/9 dB.
- Projects that angle to X/Y using trig and plots a contour around the listener axis.

This is effectively a “coverage map” at the currently selected frequency band.

### 4) ISO view (frequency vs angle heatmap)

This view renders an orthographic plot where:

- X axis is frequency band index (with labels at the correct band step)
- Y axis is angle away from on-axis (0..configured max, mirrored)
- Z/value is mapped to a color gradient (using a 1D OpenGL texture)

It supports:

- Configurable max angle
- Configurable frequency range (lower/upper band limits)
- Overlay of polar arcs and/or coverage curves on the plot
- Displaying the chosen azimuth slice (`fIsoAngle`, chosen via a special combo box state)

## Coverage computation (data-derived feature)

`MBMain.pas` contains `CalcCoverage`, which precomputes coverage angle indices for each:

- threshold (3/6/9 dB)
- frequency band
- azimuth

This is then reused by:

- 3D coverage overlay
- ISO view coverage overlay
- Coverage view contour plotting

## Export features

Export options observed in `MBMain.pas`:

- **PNG output**
  - Screenshot-like export, plus a “300 DPI” variant.

- **Excel `.xls` export**
  - Implemented via `MBNativeExcel` (likely COM automation on Windows).

- **POX `.pox` export**
  - Text table export around a selected azimuth slice, normalized relative to on-axis.

- **Save as data formats**
  - The same list as load formats (native + conversions).

## Settings and persistence

The application persists configuration to an INI file (typically `Monkey Sphere.INI`) including:

- Window positions (main/errors/options, etc.)
- MRU file list
- Directories and import settings
- Visualization styling (colors, gradients, opacities, dot size, legend)
- View toggles (3D/2D/ISO/Coverage), axis display, etc.

## Dependencies and platform assumptions

Based on units and APIs used:

- **Windows desktop app**: Delphi/VCL, ShellExecute, COM automation.
- **OpenGL / GLScene**: heavy reliance on immediate-mode OpenGL rendering.
- **Optional MATLAB dependency**: via OLE automation in `MBBuild.pas`.
- **Excel automation**: `.xls` export appears Windows/COM dependent.
- **Audio/FFT stack**: `Audio_*` units and FFT routines (`DFFTR*`) used by the import wizard.

## Notable technical debt / porting risks (within legacy/Source)

- **Monolithic main form** (`MBMain.pas`) combines:
  - data model
  - rendering
  - parsing/writing multiple formats
  - UI state and actions
    This is functional but makes a direct port harder; a React rewrite should separate data/model, IO codecs, and rendering.

- **Loader thread is mostly synchronous**: `TLoadFile` exists but performs work via `Synchronize`, so parsing still happens on the UI thread.

- **Some units look stale/inconsistent**: `MBSettings.pas` references `FmMonkeyBall`/`GLBall` and may not match the current app naming.

- **Immediate-mode OpenGL**: Web ports should plan for WebGL/Three.js or a modern rendering pipeline.

## Suggested mapping for a React + TypeScript rewrite (high-level)

This is not an implementation plan, just a feature-to-module mapping.

- **Data model (shared)**
  - TS types for `MoBHeader`, axes, and `data[az][pol][freq]` (prefer a typed `Float32Array`).

- **Codecs (pure functions)**
  - `mob` codec (RIFF chunk reader/writer)
  - `clf/xhn/unf/gdf` parsers/writers
  - Unit-test these independently of UI.

- **Import pipeline**
  - WebWorker-based FFT/banding (keep UI responsive).
  - Use the File System Access API (or drag-drop) for batch import.

- **Rendering**
  - 3D balloon: Three.js (sphere mesh deformation + vertex colors)
  - 2D polar: Canvas/SVG/Plotly (two polylines + grid rings)
  - ISO heatmap: WebGL quad with 1D colormap texture or Canvas image rendering
  - Coverage overlay: derived polyline computed from the same coverage function.

- **Persistence**
  - Replace INI with JSON in localStorage (and “export settings” feature for portability).

## Appendix: Most important files to read first

If you want to understand behavior quickly, these are the highest ROI:

- `legacy/Source/MBMain.pas` – orchestration, data, rendering, load/save/export.
- `legacy/Source/MBFormats.pas` – `.mob` structures + tokens for text/industry formats.
- `legacy/Source/MBImport.pas` – import/FFT/banding pipeline.
- `legacy/Source/MBViewOptions.pas` and option frames – visualization configuration.
- `legacy/Source/MBUtils.pas` – gradients + third-octave helpers.
