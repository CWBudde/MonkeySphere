import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useDatasetStore } from "../../store";
import { useView3dStore } from "../../store/view3dStore";
import { BalloonMesh } from "./BalloonMesh";
import { CoverageOverlay } from "./CoverageOverlay";
import { DotsOverlay } from "./DotsOverlay";

export function View3d() {
  const dataset = useDatasetStore((state) => state.dataset);
  const bandIndex = useDatasetStore((state) => state.selectedBandIndex);
  const colormap = useView3dStore((state) => state.colormap);
  const showDots = useView3dStore((state) => state.showDots);
  const dotColor = useView3dStore((state) => state.dotColor);
  const dotSize = useView3dStore((state) => state.dotSize);
  const showSurface = useView3dStore((state) => state.showSurface);
  const wireframe = useView3dStore((state) => state.wireframe);
  const heightScale = useView3dStore((state) => state.heightScale);
  const showCoverage = useView3dStore((state) => state.showCoverage);
  const showCoverage3db = useView3dStore((state) => state.showCoverage3db);
  const showCoverage6db = useView3dStore((state) => state.showCoverage6db);
  const showCoverage9db = useView3dStore((state) => state.showCoverage9db);
  const coverageOpacity = useView3dStore((state) => state.coverageOpacity);
  const coverageColor3db = useView3dStore((state) => state.coverageColor3db);
  const coverageColor6db = useView3dStore((state) => state.coverageColor6db);
  const coverageColor9db = useView3dStore((state) => state.coverageColor9db);
  const resetToken = useView3dStore((state) => state.resetToken);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.reset();
  }, [resetToken]);

  if (!dataset) return null;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">3D Balloon</div>
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/30">
        <Canvas camera={{ position: [0, 0.6, 1.6], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={0.9} />
          {showSurface && (
            <BalloonMesh
              dataset={dataset}
              bandIndex={bandIndex}
              colormap={colormap}
              wireframe={wireframe}
              heightScale={heightScale}
            />
          )}
          {showDots && (
            <DotsOverlay
              dataset={dataset}
              bandIndex={bandIndex}
              color={dotColor}
              size={dotSize}
              heightScale={heightScale}
            />
          )}
          {showCoverage && (
            <CoverageOverlay
              dataset={dataset}
              bandIndex={bandIndex}
              thresholds={[
                ...(showCoverage3db ? [3] : []),
                ...(showCoverage6db ? [6] : []),
                ...(showCoverage9db ? [9] : []),
              ]}
              colors={{
                3: coverageColor3db,
                6: coverageColor6db,
                9: coverageColor9db,
              }}
              opacity={coverageOpacity}
              heightScale={heightScale}
            />
          )}
          <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate />
        </Canvas>
      </div>
    </div>
  );
}
