import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { createColormap, sampleColormap, type RGB } from "../../domain/colormap";
import { getSample } from "../../domain/dataset/dataset";
import type { Dataset } from "../../domain/dataset/types";
import { calcCoverage, getCoverageAngle } from "../../domain/coverage";
import { getBandLabel } from "../../domain/terz";
import { useViewIsoStore } from "../../store";

type IsoViewProps = {
  dataset: Dataset;
};

type IsoLayout = {
  width: number;
  height: number;
  heatmapLeft: number;
  heatmapTop: number;
  heatmapWidth: number;
  heatmapHeight: number;
  colorbarLeft: number;
  colorbarWidth: number;
};

const PADDING = {
  top: 20,
  right: 80,
  bottom: 38,
  left: 56,
};

const COLORBAR_WIDTH = 12;

export function IsoView({ dataset }: IsoViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<IsoLayout | null>(null);

  const colormapName = useViewIsoStore((state) => state.colormap);
  const bandStart = useViewIsoStore((state) => state.bandStart);
  const bandEnd = useViewIsoStore((state) => state.bandEnd);
  const maxAngle = useViewIsoStore((state) => state.maxAngle);
  const azimuthIndex = useViewIsoStore((state) => state.azimuthIndex);
  const showPolarGrid = useViewIsoStore((state) => state.showPolarGrid);
  const showCoverage = useViewIsoStore((state) => state.showCoverage);
  const showCoverage3db = useViewIsoStore((state) => state.showCoverage3db);
  const showCoverage6db = useViewIsoStore((state) => state.showCoverage6db);
  const showCoverage9db = useViewIsoStore((state) => state.showCoverage9db);
  const coverageColor3db = useViewIsoStore((state) => state.coverageColor3db);
  const coverageColor6db = useViewIsoStore((state) => state.coverageColor6db);
  const coverageColor9db = useViewIsoStore((state) => state.coverageColor9db);

  const colormap = useMemo(() => createColormap(colormapName), [colormapName]);

  const thresholds = useMemo(() => {
    const list: number[] = [];
    if (showCoverage3db) list.push(3);
    if (showCoverage6db) list.push(6);
    if (showCoverage9db) list.push(9);
    return list;
  }, [showCoverage3db, showCoverage6db, showCoverage9db]);

  const coverage = useMemo(() => {
    if (!showCoverage || thresholds.length === 0) return null;
    return calcCoverage(dataset, thresholds);
  }, [dataset, showCoverage, thresholds]);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const safeWidth = Math.max(0, Math.floor(width));
      const safeHeight = Math.max(0, Math.floor(height));
      if (safeWidth === 0 || safeHeight === 0) return;

      const heatmapWidth = Math.max(0, safeWidth - PADDING.left - PADDING.right);
      const heatmapHeight = Math.max(0, safeHeight - PADDING.top - PADDING.bottom);
      const colorbarLeft = PADDING.left + heatmapWidth + 18;

      setLayout({
        width: safeWidth,
        height: safeHeight,
        heatmapLeft: PADDING.left,
        heatmapTop: PADDING.top,
        heatmapWidth,
        heatmapHeight,
        colorbarLeft,
        colorbarWidth: COLORBAR_WIDTH,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(layout.width * ratio));
    canvas.height = Math.max(1, Math.floor(layout.height * ratio));
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.clearRect(0, 0, layout.width, layout.height);

    renderHeatmap(ctx, dataset, layout, {
      bandStart,
      bandEnd,
      maxAngle,
      azimuthIndex,
      colormap,
      showPolarGrid,
      coverage,
      coverageColors: {
        3: coverageColor3db,
        6: coverageColor6db,
        9: coverageColor9db,
      },
    });
  }, [
    dataset,
    layout,
    bandStart,
    bandEnd,
    maxAngle,
    azimuthIndex,
    colormap,
    showPolarGrid,
    coverage,
    coverageColor3db,
    coverageColor6db,
    coverageColor9db,
  ]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

type HeatmapOptions = {
  bandStart: number;
  bandEnd: number;
  maxAngle: number;
  azimuthIndex: number;
  colormap: (t: number) => RGB;
  showPolarGrid: boolean;
  coverage: ReturnType<typeof calcCoverage> | null;
  coverageColors: Record<number, string>;
};

function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  dataset: Dataset,
  layout: IsoLayout,
  options: HeatmapOptions,
) {
  const bandCount = dataset.freq.bandCount;
  const azimuthCount = dataset.azimuth.count;
  const polarAxis = dataset.polar;
  if (bandCount === 0 || azimuthCount === 0 || polarAxis.count === 0) return;

  const bandStart = clamp(options.bandStart, 0, bandCount - 1);
  const bandEnd = clamp(options.bandEnd, bandStart, bandCount - 1);
  const bandSpan = bandEnd - bandStart + 1;

  const azimuthIndex = clamp(options.azimuthIndex, 0, azimuthCount - 1);
  const azimuthAngle = axisAngle(dataset.azimuth, azimuthIndex);

  const axisMaxAngle = maxAxisMagnitude(polarAxis);
  const effectiveMaxAngle = Math.max(1, Math.min(Math.abs(options.maxAngle), axisMaxAngle));
  const rowStep = Math.max(0.1, Math.abs(polarAxis.stepDeg));
  const rowCount = Math.max(1, Math.floor((effectiveMaxAngle * 2) / rowStep) + 1);

  const cellWidth = layout.heatmapWidth / bandSpan;
  const cellHeight = layout.heatmapHeight / rowCount;

  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (let band = bandStart; band <= bandEnd; band++) {
    for (let row = 0; row < rowCount; row++) {
      const angle = effectiveMaxAngle - row * rowStep;
      const polIndex = resolvePolarIndex(polarAxis, angle);
      const value = getSample(dataset, azimuthIndex, polIndex, band);
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }
  }

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    minValue = 0;
    maxValue = 1;
  }

  for (let band = bandStart; band <= bandEnd; band++) {
    const col = band - bandStart;
    const x = layout.heatmapLeft + col * cellWidth;
    for (let row = 0; row < rowCount; row++) {
      const angle = effectiveMaxAngle - row * rowStep;
      const polIndex = resolvePolarIndex(polarAxis, angle);
      const value = getSample(dataset, azimuthIndex, polIndex, band);
      const [r, g, b] = sampleColormap(options.colormap, value, minValue, maxValue);
      ctx.fillStyle = rgbToCss(r, g, b);
      ctx.fillRect(x, layout.heatmapTop + row * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
    }
  }

  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(layout.heatmapLeft, layout.heatmapTop, layout.heatmapWidth, layout.heatmapHeight);
  ctx.restore();

  if (options.showPolarGrid) {
    drawAngleGrid(ctx, layout, effectiveMaxAngle);
  }

  if (options.coverage) {
    drawCoverageOverlay(ctx, dataset, layout, {
      coverage: options.coverage,
      thresholds: options.coverage.thresholds,
      bandStart,
      bandEnd,
      maxAngle: effectiveMaxAngle,
      azimuthIndex,
      colors: options.coverageColors,
    });
  }

  drawAxisLabels(ctx, dataset, layout, {
    bandStart,
    bandEnd,
    maxAngle: effectiveMaxAngle,
    azimuthAngle,
    minValue,
    maxValue,
    colormap: options.colormap,
  });
}

type AxisLabelOptions = {
  bandStart: number;
  bandEnd: number;
  maxAngle: number;
  azimuthAngle: number;
  minValue: number;
  maxValue: number;
  colormap: (t: number) => RGB;
};

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  dataset: Dataset,
  layout: IsoLayout,
  options: AxisLabelOptions,
) {
  ctx.save();
  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const bandSpan = options.bandEnd - options.bandStart + 1;
  const cellWidth = layout.heatmapWidth / bandSpan;
  const labelStep = Math.max(1, Math.floor(bandSpan / 6));

  for (let band = options.bandStart; band <= options.bandEnd; band += labelStep) {
    const x = layout.heatmapLeft + (band - options.bandStart + 0.5) * cellWidth;
    ctx.fillText(getBandLabel(dataset, band), x, layout.heatmapTop + layout.heatmapHeight + 8);
  }

  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const angleStep = options.maxAngle >= 60 ? 30 : 15;
  for (let angle = -options.maxAngle; angle <= options.maxAngle + 0.001; angle += angleStep) {
    const y = angleToY(layout, options.maxAngle, angle);
    ctx.fillText(`${Math.round(angle)}°`, layout.heatmapLeft - 8, y);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `Azimuth ${formatAngle(options.azimuthAngle)}`,
    layout.heatmapLeft,
    Math.max(6, layout.heatmapTop - 16),
  );
  ctx.restore();

  drawColorbar(ctx, layout, options.minValue, options.maxValue, options.colormap);

  ctx.restore();
}

function drawColorbar(
  ctx: CanvasRenderingContext2D,
  layout: IsoLayout,
  minValue: number,
  maxValue: number,
  colormap: (t: number) => RGB,
) {
  const barLeft = layout.colorbarLeft;
  const barTop = layout.heatmapTop;
  const barHeight = layout.heatmapHeight;

  for (let i = 0; i <= barHeight; i += 1) {
    const t = 1 - i / Math.max(1, barHeight);
    const [r, g, b] = colormap(t);
    ctx.fillStyle = rgbToCss(r, g, b);
    ctx.fillRect(barLeft, barTop + i, layout.colorbarWidth, 1);
  }

  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barLeft, barTop, layout.colorbarWidth, barHeight);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.font = "11px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${formatValue(maxValue)} dB`, barLeft + layout.colorbarWidth + 6, barTop + 6);
  ctx.fillText(
    `${formatValue(minValue)} dB`,
    barLeft + layout.colorbarWidth + 6,
    barTop + barHeight - 6,
  );
  ctx.restore();
}

type CoverageOverlayOptions = {
  coverage: ReturnType<typeof calcCoverage>;
  thresholds: number[];
  bandStart: number;
  bandEnd: number;
  maxAngle: number;
  azimuthIndex: number;
  colors: Record<number, string>;
};

function drawCoverageOverlay(
  ctx: CanvasRenderingContext2D,
  dataset: Dataset,
  layout: IsoLayout,
  options: CoverageOverlayOptions,
) {
  const bandSpan = options.bandEnd - options.bandStart + 1;
  const cellWidth = layout.heatmapWidth / bandSpan;

  options.thresholds.forEach((threshold) => {
    ctx.save();
    ctx.strokeStyle = options.colors[threshold] ?? "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let started = false;
    for (let band = options.bandStart; band <= options.bandEnd; band++) {
      const angle = getCoverageAngle(dataset, options.coverage, threshold, band, options.azimuthIndex);
      const clamped = clamp(angle, -options.maxAngle, options.maxAngle);
      const x = layout.heatmapLeft + (band - options.bandStart + 0.5) * cellWidth;
      const y = angleToY(layout, options.maxAngle, clamped);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  });
}

function drawAngleGrid(
  ctx: CanvasRenderingContext2D,
  layout: IsoLayout,
  maxAngle: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.lineWidth = 1;

  const step = maxAngle >= 60 ? 30 : 15;
  for (let angle = -maxAngle; angle <= maxAngle + 0.001; angle += step) {
    const y = angleToY(layout, maxAngle, angle);
    ctx.beginPath();
    ctx.moveTo(layout.heatmapLeft, y);
    ctx.lineTo(layout.heatmapLeft + layout.heatmapWidth, y);
    ctx.stroke();
  }

  ctx.restore();
}

function axisAngle(axis: Dataset["azimuth"], index: number): number {
  return axis.startDeg + index * axis.stepDeg;
}

function resolvePolarIndex(axis: Dataset["polar"], angle: number): number {
  if (axis.count <= 1) return 0;
  const target = axis.startDeg < 0 ? angle : Math.abs(angle);
  const step = axis.stepDeg === 0 ? 1 : axis.stepDeg;
  const index = Math.round((target - axis.startDeg) / step);
  return clamp(index, 0, axis.count - 1);
}

function maxAxisMagnitude(axis: Dataset["polar"]): number {
  if (axis.count <= 0) return 0;
  const axisEnd = axis.startDeg + axis.stepDeg * (axis.count - 1);
  return Math.max(Math.abs(axis.startDeg), Math.abs(axisEnd));
}

function angleToY(layout: IsoLayout, maxAngle: number, angle: number): number {
  return (
    layout.heatmapTop +
    ((maxAngle - angle) / (maxAngle * 2)) * layout.heatmapHeight
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(value, max));
}

function rgbToCss(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}`;
}

function formatAngle(angle: number): string {
  if (!Number.isFinite(angle)) return "-";
  const rounded = Math.round(angle * 10) / 10;
  return `${rounded}°`;
}
