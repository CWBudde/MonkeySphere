import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Dataset } from "../../domain/dataset/types";
import { getHorizontalSlice, getVerticalSlice } from "../../domain/dataset/dataset";
import { computeMaximum, computeMinimum, normalizeValue } from "../../domain/normalize";
import { useView2dStore } from "../../store";
import {
  buildSlicePoints,
  resolveDirectionOffset,
  shouldClosePath,
  type SlicePoint,
} from "./polarMath";

const GRID_DB_STEP = 6;
const GRID_ANGLE_STEP = 30;

const SLICE_COLORS = {
  horizontal: "#f87171",
  vertical: "#60a5fa",
};

type PolarPlotProps = {
  dataset: Dataset;
  bandIndex: number;
};

type PlotLayout = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  radius: number;
};

export function PolarPlot({ dataset, bandIndex }: PolarPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<PlotLayout | null>(null);

  const showHorizontal = useView2dStore((state) => state.showHorizontal);
  const showVertical = useView2dStore((state) => state.showVertical);
  const direction = useView2dStore((state) => state.direction);
  const maxDbOverride = useView2dStore((state) => state.maxDb);
  const rangeDb = useView2dStore((state) => state.rangeDb);

  const directionOffset = useMemo(() => resolveDirectionOffset(direction), [direction]);

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
      const padding = 32;
      const radius = Math.max(0, Math.min(safeWidth, safeHeight) / 2 - padding);
      setLayout({
        width: safeWidth,
        height: safeHeight,
        centerX: safeWidth / 2,
        centerY: safeHeight / 2,
        radius,
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

    const maxDb = maxDbOverride ?? computeMaximum(dataset, bandIndex);
    const minDb = computeMinimum(dataset, bandIndex);

    drawPolarGrid(ctx, layout, {
      maxDb,
      rangeDb,
      axisLabelOffset: 18,
    });

    if (showHorizontal) {
      const slice = getHorizontalSlice(dataset, bandIndex);
      drawSlice(ctx, layout, slice, dataset.polar, {
        color: SLICE_COLORS.horizontal,
        directionOffset,
        maxDb,
        minDb,
        rangeDb,
      });
    }

    if (showVertical) {
      const slice = getVerticalSlice(dataset, bandIndex);
      if (slice.length > 0) {
        drawSlice(ctx, layout, slice, dataset.polar, {
          color: SLICE_COLORS.vertical,
          directionOffset,
          maxDb,
          minDb,
          rangeDb,
        });
      }
    }
  }, [
    dataset,
    bandIndex,
    layout,
    showHorizontal,
    showVertical,
    directionOffset,
    maxDbOverride,
    rangeDb,
  ]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

type GridOptions = {
  maxDb: number;
  rangeDb: number;
  axisLabelOffset: number;
};

type SliceOptions = {
  color: string;
  directionOffset: number;
  minDb: number;
  maxDb: number;
  rangeDb: number;
};

function drawPolarGrid(
  ctx: CanvasRenderingContext2D,
  layout: PlotLayout,
  options: GridOptions,
) {
  const { maxDb, rangeDb, axisLabelOffset } = options;
  const minDb = maxDb - rangeDb;

  ctx.save();
  ctx.translate(layout.centerX, layout.centerY);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;

  const ringCount = Math.max(1, Math.floor(rangeDb / GRID_DB_STEP));
  for (let ringIndex = 0; ringIndex <= ringCount; ringIndex++) {
    const dbValue = maxDb - ringIndex * GRID_DB_STEP;
    const normalized = normalizeValue(dbValue, minDb, maxDb, rangeDb);
    const ringRadius = normalized * layout.radius;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${dbValue} dB`, ringRadius + 6, 0);
  }

  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  for (let angle = 0; angle < 360; angle += GRID_ANGLE_STEP) {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * layout.radius;
    const y = -Math.sin(radians) * layout.radius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const axisAngles = [0, 90, 180, 270];
  axisAngles.forEach((angle) => {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * (layout.radius + axisLabelOffset);
    const y = -Math.sin(radians) * (layout.radius + axisLabelOffset);
    ctx.fillText(`${angle}°`, x, y);
  });

  ctx.restore();
}

function drawSlice(
  ctx: CanvasRenderingContext2D,
  layout: PlotLayout,
  values: Float32Array,
  axis: Dataset["polar"],
  options: SliceOptions,
) {
  const { color, directionOffset, minDb, maxDb, rangeDb } = options;
  const points = buildSlicePoints(values, {
    axis,
    radius: layout.radius,
    directionOffsetDeg: directionOffset,
    minDb,
    maxDb,
    rangeDb,
  });

  if (points.length === 0) return;

  ctx.save();
  ctx.translate(layout.centerX, layout.centerY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  drawSlicePath(ctx, points, shouldClosePath(axis));

  ctx.stroke();
  ctx.restore();
}

function drawSlicePath(
  ctx: CanvasRenderingContext2D,
  points: SlicePoint[],
  closePath: boolean,
) {
  const [first, ...rest] = points;
  ctx.moveTo(first.x, first.y);
  rest.forEach((point) => ctx.lineTo(point.x, point.y));
  if (closePath) ctx.closePath();
}
