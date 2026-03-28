// ========================================
// Pricing Analysis Mappers
// ========================================
// Funções de normalização e transformação de dados.

import type { PricingAnalysisDecisionContext, HistoricalPriceData, PlazaDispersionData } from '../types/pricingAnalysis';

/**
 * Calcula dados de histórico interno a partir do app (mock / dados reais).
 */
export function buildHistoricalContext(
  currentPrice: number,
  historical: HistoricalPriceData | null,
  dispersion: PlazaDispersionData | null
): PricingAnalysisDecisionContext['historicalContext'] {
  if (!historical && !dispersion) {
    return {
      localAverage: null,
      localTrend: 'estavel',
      pricePosition: 'dentro',
    };
  }

  const avg = historical?.average ?? dispersion?.globalAverage ?? null;
  const trend = historical?.trend ?? 'estavel';

  let position: 'abaixo' | 'dentro' | 'acima' = 'dentro';
  if (avg != null) {
    const deviation = ((currentPrice - avg) / avg) * 100;
    if (deviation > 10) position = 'acima';
    else if (deviation < -10) position = 'abaixo';
  }

  return { localAverage: avg, localTrend: trend, pricePosition: position };
}

/**
 * Gera dados de histórico mock para demonstração.
 */
export function getMockHistoricalData(pracaName: string, currentPrice: number): HistoricalPriceData {
  const hash = simpleHash(pracaName);
  const variation = ((hash % 20) - 10) / 100;
  const avg = currentPrice * (1 + variation);

  return {
    prices: Array.from({ length: 12 }, (_, i) => avg * (0.95 + (i * 0.01))),
    average: Math.round(avg * 100) / 100,
    min: Math.round(avg * 0.9 * 100) / 100,
    max: Math.round(avg * 1.1 * 100) / 100,
    trend: variation > 0.03 ? 'subindo' : variation < -0.03 ? 'caindo' : 'estavel',
  };
}

/**
 * Gera dados de dispersão mock.
 */
export function getMockDispersionData(currentPrice: number): PlazaDispersionData {
  const avg = currentPrice * 1.02;
  const deviation = ((currentPrice - avg) / avg) * 100;

  return {
    globalAverage: Math.round(avg * 100) / 100,
    globalMin: Math.round(avg * 0.8 * 100) / 100,
    globalMax: Math.round(avg * 1.2 * 100) / 100,
    standardDeviation: Math.round(avg * 0.1 * 100) / 100,
    position: deviation > 10 ? 'acima' : deviation < -10 ? 'abaixo' : 'dentro',
  };
}

/**
 * Formata número em R$.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/D';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata número como porcentagem.
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return 'N/D';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formata número com separador de milhar.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return 'N/D';
  return value.toLocaleString('pt-BR');
}

/**
 * Generates a deterministic numeric hash from a string.
 * Used for producing consistent mock data based on plaza/service names.
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}
