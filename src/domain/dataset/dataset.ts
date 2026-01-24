import type { Dataset } from "./types";

/**
 * Calculate the flat array index for a sample at (azimuth, polar, band).
 * Index formula: az * polar.values * freq.bands + pol * freq.bands + band
 */
export function getSampleIndex(
  dataset: Dataset,
  azIndex: number,
  polIndex: number,
  bandIndex: number,
): number {
  const polarCount = dataset.polar.count;
  const bandCount = dataset.freq.bandCount;
  return azIndex * polarCount * bandCount + polIndex * bandCount + bandIndex;
}

/**
 * Get the sample value at (azimuth, polar, band).
 */
export function getSample(
  dataset: Dataset,
  azIndex: number,
  polIndex: number,
  bandIndex: number,
): number {
  return dataset.samples[getSampleIndex(dataset, azIndex, polIndex, bandIndex)];
}

/**
 * Set the sample value at (azimuth, polar, band).
 */
export function setSample(
  dataset: Dataset,
  azIndex: number,
  polIndex: number,
  bandIndex: number,
  value: number,
): void {
  dataset.samples[getSampleIndex(dataset, azIndex, polIndex, bandIndex)] = value;
}

/**
 * Get horizontal slice data for a specific band (azimuth=0, all polar angles).
 */
export function getHorizontalSlice(
  dataset: Dataset,
  bandIndex: number,
): Float32Array {
  const polarCount = dataset.polar.count;
  const slice = new Float32Array(polarCount);
  for (let pol = 0; pol < polarCount; pol++) {
    slice[pol] = getSample(dataset, 0, pol, bandIndex);
  }
  return slice;
}

/**
 * Get vertical slice data for a specific band (azimuth=90° index, all polar angles).
 * Returns empty array if azimuth=90° doesn't exist in the dataset.
 */
export function getVerticalSlice(
  dataset: Dataset,
  bandIndex: number,
): Float32Array {
  const polarCount = dataset.polar.count;
  const azimuthCount = dataset.azimuth.count;

  // Find the azimuth index for 90 degrees
  const az90Index = Math.round(
    (90 - dataset.azimuth.startDeg) / dataset.azimuth.stepDeg,
  );

  if (az90Index < 0 || az90Index >= azimuthCount) {
    return new Float32Array(0);
  }

  const slice = new Float32Array(polarCount);
  for (let pol = 0; pol < polarCount; pol++) {
    slice[pol] = getSample(dataset, az90Index, pol, bandIndex);
  }
  return slice;
}

/**
 * Get all samples for a specific band (all azimuth × polar combinations).
 */
export function getBandData(dataset: Dataset, bandIndex: number): Float32Array {
  const azCount = dataset.azimuth.count;
  const polCount = dataset.polar.count;
  const data = new Float32Array(azCount * polCount);

  let idx = 0;
  for (let az = 0; az < azCount; az++) {
    for (let pol = 0; pol < polCount; pol++) {
      data[idx++] = getSample(dataset, az, pol, bandIndex);
    }
  }
  return data;
}
