# MonkeySphere Web

MonkeySphere Web is a browser-based loudspeaker directivity and polar-data analysis tool. It uses a modern
React + TypeScript stack and offers loading polar datasets, visualizing them in 3D/2D/ISO/Coverage views,
and exporting results.

## Highlights

- Full support for MonkeySphere `.mob` files (RIFF/MOBA container with optional metadata and spectrum chunks).
- View modes: 3D balloon/sphere, 2D polar plots, coverage contours (3/6/9 dB), and ISO heatmap.
- Import pipeline for IR/audio measurement sets with FFT banding.
- Export to PNG and CSV, plus full `.mob` round-trip.
- Persistent user settings (view options, colors, ranges, MRU).

## Tech stack

- React + TypeScript
- Vite
- Bun
- Tailwind CSS

## Getting started

From the repository root:

- Install dependencies: bun install
- Start dev server: bun run dev
- Build: bun run build
- Preview build: bun run preview
- Run tests: bun run test

## Supported formats

- `.mob` (native MonkeySphere container; full fidelity)
- `.txt` / `.tab` (CLF-like text)
- `.xhn` (EASE 3.0)
- `.unf`
- `.gdf`

## Import workflow

Use Import Measurements to select a directory of IR/audio measurements. The app:

1. Parses filenames to infer angle steps and symmetry.
2. Computes FFT magnitude responses.
3. Integrates bins into logarithmic bands (1, 3, 4, 10, 12, 24 per octave).
4. Builds a polar dataset you can immediately visualize or save as `.mob`.

## Visualization controls

- Range normalization and max/limit controls.
- Colormap and gradient editor.
- Dot overlays, shading, and coverage overlays.
- ISO view controls (angle range, band range, overlays).

## Project structure

src/
domain/ Data model and derived computations
codecs/ File parsers and writers
features/ UI workflows
views/ 3D/2D/ISO/Coverage renderers
workers/ Parsing and compute off the main thread
storage/ Settings and MRU persistence
ui/ Shared UI components

## License

See the repository license for details.
