// ========================================
// Competitor Normalizer
// ========================================
// Normalizes raw price entries into a standard format with confidence scoring.

import type { RawPriceEntry, NormalizedPrice, SourceType } from '../../types/competitor';
import { SOURCE_CONFIDENCE_WEIGHTS } from '../../types/competitor';
import { detectPriceUnit } from './competitorParserService';
import { textMentionsCity } from '../../utils/geoMapper';
import { removeOutliersIQR } from '../../utils/outlierDetection';

/**
 * Normalizes raw price entries into standardized NormalizedPrice objects.
 */
export function normalizePrices(
  rawEntries: RawPriceEntry[],
  targetCity: string
): NormalizedPrice[] {
  const normalized: NormalizedPrice[] = [];

  for (const entry of rawEntries) {
    const unit = detectPriceUnit(entry.context);
    const cityMatch = textMentionsCity(entry.context, targetCity) ||
                      textMentionsCity(entry.url, targetCity);

    // Calculate confidence based on source type and geo match
    let confidence = SOURCE_CONFIDENCE_WEIGHTS[entry.sourceType] ?? 50;
    if (cityMatch) confidence = Math.min(confidence + 10, 100);
    if (!cityMatch) confidence = Math.max(confidence - 15, 10);
    if (unit) confidence = Math.min(confidence + 5, 100);

    normalized.push({
      value: Math.round(entry.value * 100) / 100,
      currency: 'BRL',
      unit,
      source: entry.url,
      sourceType: entry.sourceType,
      city: cityMatch ? targetCity : undefined,
      confidence,
      extractedAt: new Date().toISOString(),
    });
  }

  return normalized;
}

/**
 * Deduplicates prices based on value and source.
 */
export function deduplicatePrices(prices: NormalizedPrice[]): NormalizedPrice[] {
  const seen = new Map<string, NormalizedPrice>();

  for (const price of prices) {
    const key = `${price.value}-${price.source}`;
    const existing = seen.get(key);
    if (!existing || price.confidence > existing.confidence) {
      seen.set(key, price);
    }
  }

  return Array.from(seen.values());
}

/**
 * Filters out extreme outliers from normalized prices.
 */
export function filterOutliers(prices: NormalizedPrice[]): NormalizedPrice[] {
  if (prices.length < 4) return prices;

  const values = prices.map((p) => p.value);
  const cleanValues = removeOutliersIQR(values);
  const cleanSet = new Set(cleanValues);

  return prices.filter((p) => cleanSet.has(p.value));
}

/**
 * Full normalization pipeline: normalize → deduplicate → filter outliers.
 */
export function runNormalizationPipeline(
  rawEntries: RawPriceEntry[],
  targetCity: string
): NormalizedPrice[] {
  let prices = normalizePrices(rawEntries, targetCity);
  prices = deduplicatePrices(prices);
  prices = filterOutliers(prices);
  return prices;
}

/**
 * Calculates a weighted confidence score for a set of normalized prices.
 */
export function calculateOverallConfidence(prices: NormalizedPrice[]): number {
  if (prices.length === 0) return 0;

  // Factor 1: Sample size (more sources = higher confidence)
  const sampleScore = Math.min(prices.length * 10, 40);

  // Factor 2: Average source confidence
  const avgSourceConf = prices.reduce((sum, p) => sum + p.confidence, 0) / prices.length;
  const sourceScore = (avgSourceConf / 100) * 30;

  // Factor 3: Geo match ratio
  const geoMatched = prices.filter((p) => p.city != null).length;
  const geoScore = (geoMatched / prices.length) * 15;

  // Factor 4: Source diversity
  const uniqueSources = new Set(prices.map((p) => p.sourceType));
  const diversityScore = Math.min(uniqueSources.size * 5, 15);

  return Math.round(Math.min(sampleScore + sourceScore + geoScore + diversityScore, 100));
}

/**
 * Maps a numeric confidence score to a confidence level label.
 */
export function getConfidenceLevel(score: number): 'baixa' | 'media' | 'alta' {
  if (score >= 70) return 'alta';
  if (score >= 30) return 'media';
  return 'baixa';
}
