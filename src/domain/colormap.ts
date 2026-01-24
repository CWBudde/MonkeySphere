export type RGB = [number, number, number];

export type ColormapName = "rainbow" | "thermal" | "grayscale";

export type Colormap = {
  name: ColormapName;
  sample: (t: number) => RGB;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function sampleGradient(stops: Array<[number, RGB]>, t: number): RGB {
  const clamped = clamp01(t);
  if (stops.length === 0) return [1, 1, 1];
  if (clamped <= stops[0][0]) return stops[0][1];

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (clamped >= t0 && clamped <= t1) {
      const localT = (clamped - t0) / (t1 - t0 || 1);
      return [
        lerp(c0[0], c1[0], localT),
        lerp(c0[1], c1[1], localT),
        lerp(c0[2], c1[2], localT),
      ];
    }
  }

  return stops[stops.length - 1][1];
}

const colormaps: Record<ColormapName, Colormap> = {
  rainbow: {
    name: "rainbow",
    sample: (t) =>
      sampleGradient(
        [
          [0, [0.16, 0.0, 0.43]],
          [0.2, [0.0, 0.35, 0.85]],
          [0.4, [0.0, 0.75, 0.65]],
          [0.6, [0.95, 0.9, 0.25]],
          [0.8, [0.95, 0.45, 0.1]],
          [1, [0.7, 0.0, 0.0]],
        ],
        t,
      ),
  },
  thermal: {
    name: "thermal",
    sample: (t) =>
      sampleGradient(
        [
          [0, [0.07, 0.07, 0.2]],
          [0.25, [0.2, 0.1, 0.45]],
          [0.5, [0.8, 0.2, 0.3]],
          [0.75, [0.95, 0.55, 0.1]],
          [1, [1, 0.9, 0.25]],
        ],
        t,
      ),
  },
  grayscale: {
    name: "grayscale",
    sample: (t) => {
      const clamped = clamp01(t);
      return [clamped, clamped, clamped];
    },
  },
};

export function createColormap(name: ColormapName): (t: number) => RGB {
  return colormaps[name]?.sample ?? colormaps.rainbow.sample;
}

export function sampleColormap(
  sample: (t: number) => RGB,
  value: number,
  min: number,
  max: number,
): RGB {
  const range = max - min;
  const t = range > 0 ? (value - min) / range : 0;
  return sample(clamp01(t));
}

export const availableColormaps: ColormapName[] = ["rainbow", "thermal", "grayscale"];
