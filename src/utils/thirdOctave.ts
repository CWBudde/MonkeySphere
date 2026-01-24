const INV_LN_10 = 0.4342944819032518;
const LN_10 = 2.302585092994046;

// Port of MBUtils.TerzIndex
export function thirdOctaveIndex(frequencyHz: number) {
  return Math.round(Math.log(frequencyHz * 0.1) * 10 * INV_LN_10);
}

// Port of MBUtils.TerzFrequency
export function thirdOctaveFrequency(index: number) {
  return 10 * Math.exp((index * LN_10) / 10);
}
