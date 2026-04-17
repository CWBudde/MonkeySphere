import { useEffect } from "react";
import { AppShell } from "./shell/AppShell";
import { useThemeStore } from "../store";

export function App() {
  const initialize = useThemeStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <AppShell />;
}
