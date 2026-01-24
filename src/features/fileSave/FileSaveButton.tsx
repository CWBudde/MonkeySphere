import { useState } from "react";

import { saveFile } from "./fileSave";
import { useDatasetStore } from "../../store";

type FileSaveButtonProps = {
  className?: string;
  label?: string;
};

export function FileSaveButton({ className, label = "Save .mob" }: FileSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const dataset = useDatasetStore((state) => state.dataset);
  const filePath = useDatasetStore((state) => state.filePath);
  const markClean = useDatasetStore((state) => state.markClean);

  const handleSave = async () => {
    if (!dataset || isSaving) return;
    setIsSaving(true);
    try {
      await saveFile(dataset, "mob", filePath ?? "dataset.mob");
      markClean();
    } catch (error) {
      console.error("Failed to save file", error);
      window.alert("Failed to save file. See console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      className={className}
      type="button"
      onClick={handleSave}
      disabled={!dataset || isSaving}
    >
      {isSaving ? "Saving..." : label}
    </button>
  );
}
