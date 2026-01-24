import { useState } from "react";

import { openFile } from "./fileOpen";
import { addToMru } from "../../storage/mru";
import { useDatasetStore } from "../../store";

type FileOpenButtonProps = {
  className?: string;
  label?: string;
};

export function FileOpenButton({ className, label = "Open .mob" }: FileOpenButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const loadDataset = useDatasetStore((state) => state.loadDataset);

  const handleOpen = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await openFile();
      if (!result) return;
      loadDataset(result.dataset, result.fileName);
      addToMru(result.fileName);
    } catch (error) {
      console.error("Failed to open file", error);
      window.alert("Failed to open file. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button className={className} type="button" onClick={handleOpen} disabled={isLoading}>
      {isLoading ? "Opening..." : label}
    </button>
  );
}
