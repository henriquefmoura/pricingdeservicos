// ========================================
// Competitor Aggregator
// ========================================
// Aggregates normalized prices into summary statistics.

import type { NormalizedPrice, CompetitorPriceSummary } from '../../types/competitor';
import { median, average, coefficientOfVariation } from '../../utils/outlierDetection';
import { calculateOverallConfidence, getConfidenceLevel } from './competitorNormalizer';
import { formatBRLCompact } from '../../utils/currencyParser';

/**
 * Aggregates normalized prices into a CompetitorPriceSummary.
 */
export function aggregatePrices(
  prices: NormalizedPrice[],
  service: string,
  city: string
): CompetitorPriceSummary | null {
  if (prices.length === 0) return null;

  const values = prices.map((p) => p.value);
  const sorted = [...values].sort((a, b) => a - b);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const med = median(values);
  const avg = Math.round(average(values) * 100) / 100;
  const dispersion = Math.round(coefficientOfVariation(values) * 100) / 100;
  const confidenceScore = calculateOverallConfidence(prices);

  const uniqueSources = [...new Set(prices.map((p) => p.source))];

  return {
    service,
    city,
    min,
    max,
    median: med,
    average: avg,
    sampleSize: prices.length,
    confidenceScore,
    confidenceLevel: getConfidenceLevel(confidenceScore),
    sources: uniqueSources,
    priceRange: `${formatBRLCompact(min)} – ${formatBRLCompact(max)}`,
    dispersion,
    lastUpdated: new Date().toISOString(),
  };
}
