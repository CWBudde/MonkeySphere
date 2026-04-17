import { afterEach, describe, expect, it } from "vitest";

import { useView3dStore } from "../view3dStore";

const initialState = useView3dStore.getState();

afterEach(() => {
  useView3dStore.setState(initialState, true);
});

describe("view3dStore", () => {
  it("clamps dot size", () => {
    useView3dStore.getState().setDotSize(0.5);
    expect(useView3dStore.getState().dotSize).toBe(0.08);

    useView3dStore.getState().setDotSize(0);
    expect(useView3dStore.getState().dotSize).toBe(0.001);
  });

  it("clamps height scale", () => {
    useView3dStore.getState().setHeightScale(3);
    expect(useView3dStore.getState().heightScale).toBe(2);

    useView3dStore.getState().setHeightScale(0.1);
    expect(useView3dStore.getState().heightScale).toBe(0.4);
  });

  it("clamps coverage opacity", () => {
    useView3dStore.getState().setCoverageOpacity(2);
    expect(useView3dStore.getState().coverageOpacity).toBe(1);

    useView3dStore.getState().setCoverageOpacity(0);
    expect(useView3dStore.getState().coverageOpacity).toBe(0.1);
  });

  it("increments reset token", () => {
    const before = useView3dStore.getState().resetToken;
    useView3dStore.getState().requestCameraReset();
    expect(useView3dStore.getState().resetToken).toBe(before + 1);
  });
});
