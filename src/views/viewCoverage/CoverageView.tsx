import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { calcCoverage, getCoverageContour } from "../../domain/coverage";
import type { Dataset } from "../../domain/dataset/types";
import { useViewCoverageStore } from "../../store/viewCoverageStore";

const GRID_STEPS = 18;
const GRID_RANGE = 90;

const THRESHOLDS = [3, 6, 9];

type CoverageViewProps = {
  dataset: Dataset;
  bandIndex: number;
};

type CoverageLayout = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  radius: number;
  left: number;
  top: number;
  size: number;
};

type ThresholdStyle = {
  enabled: boolean;
  color: string;
};

export function CoverageView({ dataset, bandIndex }: CoverageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<CoverageLayout | null>(null);

  const show3db = useViewCoverageStore((state) => state.show3db);
  const show6db = useViewCoverageStore((state) => state.show6db);
  const show9db = useViewCoverageStore((state) => state.show9db);
  const color3db = useViewCoverageStore((state) => state.color3db);
  const color6db = useViewCoverageStore((state) => state.color6db);
  const color9db = useViewCoverageStore((state) => state.color9db);
  const opacity = useViewCoverageStore((state) => state.opacity);

  const thresholdStyles: Record<number, ThresholdStyle> = useMemo(
    () => ({
      3: { enabled: show3db, color: color3db },
      6: { enabled: show6db, color: color6db },
      9: { enabled: show9db, color: color9db },
    }),
    [show3db, show6db, show9db, color3db, color6db, color9db],
  );

  const coverage = useMemo(() => calcCoverage(dataset, THRESHOLDS), [dataset]);

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
      const size = Math.max(0, Math.min(safeWidth, safeHeight));
      const padding = 32;
      const radius = Math.max(0, size / 2 - padding);
      const centerX = safeWidth / 2;
      const centerY = safeHeight / 2;
      setLayout({
        width: safeWidth,
        height: safeHeight,
        centerX,
        centerY,
        radius,
        left: centerX - size / 2,
        top: centerY - size / 2,
        size,
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

    drawGrid(ctx, layout);

    const maxAngle = Math.max(
      1,
      dataset.polar.stepDeg * Math.max(1, dataset.polar.count - 1),
    );

    THRESHOLDS.forEach((threshold) => {
      const style = thresholdStyles[threshold];
      if (!style?.enabled) return;
      const contour = getCoverageContour(dataset, coverage, threshold, bandIndex);
      drawCoverageContour(ctx, layout, contour, {
        color: style.color,
        opacity,
        maxAngle,
      });
    });
  }, [coverage, dataset, bandIndex, layout, thresholdStyles, opacity]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

type ContourPoint = { az: number; pol: number };

type ContourOptions = {
  color: string;
  opacity: number;
  maxAngle: number;
};

function drawGrid(ctx: CanvasRenderingContext2D, layout: CoverageLayout) {
  const { left, top, size } = layout;
  const step = size / GRID_STEPS;

  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);

  for (let i = 0; i <= GRID_STEPS; i++) {
    const offset = step * i;
    const x = left + offset;
    const y = top + offset;

    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + size, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
  ctx.strokeRect(left, top, size, size);

  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= GRID_STEPS; i++) {
    const value = (i - GRID_STEPS / 2) * 10;
    const x = left + i * step;
    const y = top + i * step;
    if (i % 2 === 0) {
      ctx.fillText(`${value}`, x, layout.centerY + 14);
      ctx.fillText(`${-value}`, layout.centerX - 18, y);
    }
  }

  ctx.restore();
}

function drawCoverageContour(
  ctx: CanvasRenderingContext2D,
  layout: CoverageLayout,
  contour: ContourPoint[],
  options: ContourOptions,
) {
  if (contour.length === 0) return;

  const { centerX, centerY, radius } = layout;
  const { color, opacity, maxAngle } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;

  const points = contour.map((point) => {
    const azRad = (point.az * Math.PI) / 180;
    const clampedPol = Math.max(0, Math.min(point.pol, maxAngle));
    const normalized = clampedPol / maxAngle;
    const r = normalized * radius;
    return {
      x: centerX + r * Math.sin(azRad),
      y: centerY - r * Math.cos(azRad),
    };
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();

  ctx.stroke();
  ctx.restore();
}
