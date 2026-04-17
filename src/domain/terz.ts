import { thirdOctaveFrequency, thirdOctaveIndex } from "../utils/thirdOctave";
import type { Dataset } from "./dataset/types";
import { getFrequencyAtBand } from "./dataset/types";

export function terzFrequency(index: number): number {
  return 1000 * Math.pow(2, (index - 30) / 3);
}

export function formatFrequency(hz: number): string {
  if (!Number.isFinite(hz)) return "-";
  if (hz >= 1000) {
    const khz = hz / 1000;
    const rounded = khz >= 10 ? Math.round(khz * 10) / 10 : Math.round(khz * 100) / 100;
    return `${rounded} kHz`;
  }
  const rounded = hz >= 100 ? Math.round(hz) : Math.round(hz * 10) / 10;
  return `${rounded} Hz`;
}

export function getBandLabel(dataset: Dataset, bandIndex: number): string {
  const frequency = getFrequencyAtBand(dataset.freq, bandIndex);
  const snapped = thirdOctaveFrequency(thirdOctaveIndex(frequency));
  return formatFrequency(snapped);
}
