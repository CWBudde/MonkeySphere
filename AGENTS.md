# CLAUDE.md

This file provides guidance to AI Agents such as Claude Code and Codex when working with code in this repository.

## Project Overview

MonkeySphere is a browser-based loudspeaker directivity and polar-data analysis tool. It replaces a legacy Delphi application with a modern React + TypeScript stack while preserving the original workflows: loading polar datasets, visualizing them in 3D/2D/ISO/Coverage views, and exporting results.

## Development Commands

**Package manager:** Bun (not npm/yarn/pnpm)

```bash
# Install dependencies
bun install

# Development server (port 5173)
bun run dev

# Type-check and build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test
```

## Architecture & Core Concepts

### Data Model

Datasets are represented as a 3D grid: **azimuth × polar/elevation × frequency-band**

- **Angular axes**: Start degree, step degree, and value count for azimuth and polar
- **Frequency axis**: Logarithmic bands (e.g., 1, 3, 4, 10, 12, 24 per octave)
- **Storage**: Flattened `Float32Array` with index formula:
  ```
  index = az * polar.values * freqBands + pol * freqBands + band
  ```
- Frequencies treated as: `f_i = f_0 * 2^(i/FreqStep)`

### Planned Module Structure

The codebase follows strict separation of concerns:

- **`domain/`**: Platform-agnostic data model and derived computations (no DOM, no Three.js)
  - Dataset types, axes definitions
  - Coverage computation (3/6/9 dB thresholds)
  - Normalization modes
  - Pure functions, deterministic, unit-tested

- **`codecs/`**: File format parsers and writers (pure functions)
  - `riff/`: RIFF container reader/writer
  - `mob/`: Native MonkeySphere format (`.mob` files)
  - `text/`: CLF-like, UNF, XHN, GDF formats
  - Must be unit-tested with round-trip guarantees

- **`features/`**: UI workflows and user interactions
  - File open/save dialogs
  - Export functionality
  - View mode switching

- **`views/`**: Rendering surfaces (one per view mode)
  - `view3d/`: 3D balloon/sphere (Three.js)
  - `view2d/`: 2D polar plots (Canvas/SVG)
  - `viewIso/`: ISO heatmap (frequency vs angle)
  - `viewCoverage/`: Coverage contours (3/6/9 dB)

- **`workers/`**: Web Workers for off-main-thread processing
  - Parsing heavy files
  - FFT and banding computations
  - Import pipeline processing

- **`storage/`**: Client-side persistence
  - Settings (replaces legacy INI with JSON in localStorage)
  - MRU (Most Recently Used) file list

- **`ui/`**: Shared UI components and primitives

## File Formats

### Native Format: `.mob` (Priority #1)

- RIFF-like container with `MOBA` chunk identifier
- Core header + `plev` (polar level grid) chunk
- Optional chunks: `clf_` (metadata), `spec` (spectrum/impulse), `comm`, `fico`
- **This is the full-fidelity format** for round-tripping

### Other Formats (implement after `.mob`)

- `.txt` / `.tab`: CLF-like text format
- `.xhn`: EASE 3.0
- `.unf`, `.gdf`: Additional industry formats

## View Modes

1. **3D Balloon/Sphere**: WebGL/Three.js surface with vertex colors, optional dots overlay, coverage contours
2. **2D Polar Plots**: Canvas-based horizontal/vertical slices with configurable orientation
3. **Coverage View**: 3/6/9 dB contour map on square grid (-90° to +90°)
4. **ISO View**: Heatmap with frequency bands (X-axis) vs angle (Y-axis), colormap-based

## Import Pipeline (Post-MVP Feature)

Converts impulse response/audio measurements into banded polar datasets:

1. Directory scan for IR/audio files
2. FFT magnitude computation
3. Logarithmic band integration
4. Angle inference from filenames (patterns like `H???V???`)
5. On-axis validation and correction
6. Output as `.mob` format

## Legacy Context

The `legacy/` directory contains the original Delphi/VCL source code for reference:

- **Key file**: `legacy/Source/MBMain.pas` - main orchestration, data model, rendering
- **Formats**: `legacy/Source/MBFormats.pas` - `.mob` structures and format tokens
- **Import**: `legacy/Source/MBImport.pas` - FFT/banding pipeline

**Out of scope for web port**:

- Copy protection/registration
- PowerPoint integration
- ActiveX components
- MATLAB/Excel COM automation

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with Bundler resolution
- Strict mode enabled
- Base URL: project root (allows clean imports)

## Testing Strategy

- **Unit tests**: All codecs and domain logic (pure functions)
- **Round-trip tests**: Parse → serialize → parse must be lossless
- **Deterministic tests**: Coverage computation, normalization
- **Performance checks**: Time-to-first-render for parsing, 3D mesh generation, ISO heatmaps

## Key Principles

1. **Separation of concerns**: Codecs are pure, rendering is separate from business logic
2. **Keep UI responsive**: Heavy computation in Web Workers
3. **Compatibility**: Core data model matches legacy semantics (flat array storage, same axis definitions)
4. **Test-driven**: Unit test all codecs and derived computations
5. **Progressive enhancement**: Start with `.mob` format, add others incrementally
