export type MobSpherePart = 0 | 1 | 2 | 3 | 4 | 255;
export type MobRadiationPart = 0 | 1;
export type MobPolDir = 0 | 1;

export interface MobAngleInfo {
  start: number;
  step: number;
  values: number;
  dir: MobPolDir;
}

export interface MobHeader {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  hundredth: number;
  device: string;
  manufacturer: string;
  sphere: MobSpherePart;
  radiation: MobRadiationPart;
  polar: MobAngleInfo;
  azimuth: MobAngleInfo;
  freqSpacing: 0 | 1;
  freqStart: number;
  freqStep: number;
  freqBands: number;
  dynRange: number;
  onTopDb: number;
  norm0dBMax: boolean;
  allMeasured: boolean;
}

export const MOB_HEADER_SIZE = 152;
export const MOB_CLFREC_SIZE = 1006;
