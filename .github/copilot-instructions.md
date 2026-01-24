# Copilot instructions (MonkeySphere)

## Dev workflow (use Bun)
- Install: `bun install`
- Dev server: `bun run dev` (Vite, port 5173, strict)
- Typecheck + build: `bun run build` (runs `tsc -b` then `vite build`)
- Tests: `bun run test` (Vitest)
- Format: `bun run format` / `bun run format:check` (Prettier + Tailwind plugin)

## Architecture: keep the boundaries
- `src/domain/`: pure, deterministic functions + types (no DOM/Three.js). Example: dataset indexing helpers in [src/domain/dataset/dataset.ts](src/domain/dataset/dataset.ts).
- `src/codecs/`: pure parse/serialize of file formats (bytes in/out). Current stubs: [src/codecs/mob/mobRead.ts](src/codecs/mob/mobRead.ts), [src/codecs/riff/riffReader.ts](src/codecs/riff/riffReader.ts).
- `src/views/`: rendering surfaces (currently placeholders) in [src/views](src/views).
- `src/workers/`: heavy work off the main thread (currently placeholders) in [src/workers](src/workers).
- `src/storage/`: browser persistence via `localStorage` (see keys in [src/storage/settings.ts](src/storage/settings.ts) and [src/storage/mru.ts](src/storage/mru.ts)).

## Data model conventions (match legacy semantics)
- Samples are a flattened `Float32Array` representing `azimuth × polar × band`.
- Flat index formula is:
  - `index = az * polar.count * bandCount + pol * bandCount + band`
  - Implemented by `getSampleIndex()` in [src/domain/dataset/dataset.ts](src/domain/dataset/dataset.ts).
- Frequency band center formula:
  - `f_i = startHz * 2^(i / bandsPerOctave)`
  - Implemented by `getFrequencyAtBand()` in [src/domain/dataset/types.ts](src/domain/dataset/types.ts).
- Third-octave helpers are ports of legacy `MBUtils` in [src/utils/thirdOctave.ts](src/utils/thirdOctave.ts).

## Tests: co-located Vitest
- Tests live next to code under `__tests__` and use `vitest` imports.
- Good examples: [src/domain/dataset/__tests__/dataset.test.ts](src/domain/dataset/__tests__/dataset.test.ts), [src/utils/__tests__/thirdOctave.test.ts](src/utils/__tests__/thirdOctave.test.ts).

## Legacy reference (authoritative for file formats)
- When implementing `.mob`/RIFF parsing, cross-check the Delphi sources:
  - `legacy/Source/MBFormats.pas` (format structs/tokens)
  - `legacy/Source/MBMain.pas` (data model + coverage semantics)
  - `legacy/Source/MBImport.pas` (FFT/banding pipeline)

## Local conventions
- Prefer barrel exports (`index.ts`) per folder (see [src/codecs/index.ts](src/codecs/index.ts), [src/domain/dataset/index.ts](src/domain/dataset/index.ts), [src/views/index.ts](src/views/index.ts)).
- TS is `strict` and uses bundler module resolution (see [tsconfig.json](tsconfig.json)); keep types explicit at module boundaries (e.g., `Dataset`, `AxisDef`, `FreqDef`).
