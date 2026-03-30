// ========================================
// Outlier Detection Utility
// ========================================
// Statistical methods for detecting and removing price outliers.

/**
 * Calculates the median of a numeric array.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates the average of a numeric array.
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculates the standard deviation.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Calculates the coefficient of variation (dispersion).
 * Returns a value between 0 and 1 (normalized).
 */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  if (avg === 0) return 0;
  const sd = standardDeviation(values);
  return Math.min(sd / avg, 1);
}

/**
 * Removes outliers using the IQR method.
 * Returns only values within [Q1 - factor*IQR, Q3 + factor*IQR].
 */
export function removeOutliersIQR(values: number[], factor: number = 1.5): number[] {
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lower = q1 - factor * iqr;
  const upper = q3 + factor * iqr;

  return sorted.filter((v) => v >= lower && v <= upper);
}

/**
 * Removes outliers using Z-score method.
 * Removes values more than `threshold` standard deviations from mean.
 */
export function removeOutliersZScore(values: number[], threshold: number = 2): number[] {
  if (values.length < 3) return values;

  const avg = average(values);
  const sd = standardDeviation(values);
  if (sd === 0) return values;

  return values.filter((v) => Math.abs((v - avg) / sd) <= threshold);
}

/**
 * Calculates percentile value.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}
