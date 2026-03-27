// ========================================
// Price Delta — Cálculos de variação
// ========================================

import type { PriceDeltaResult, PriceDirection, PriceChangeIntensity } from '../types/pricingClimate';

// Thresholds configuráveis para intensidade da variação
const SMALL_CHANGE_THRESHOLD = 5; // até 5%
const LARGE_CHANGE_THRESHOLD = 15; // acima de 15%

/**
 * Calcula a variação entre preço atual e proposto.
 */
export function calculatePriceDelta(currentPrice: number, proposedPrice: number): PriceDeltaResult {
  const absolute = proposedPrice - currentPrice;
  const percent = currentPrice > 0 ? (absolute / currentPrice) * 100 : 0;

  const direction = getDirection(absolute);
  const intensity = getIntensity(Math.abs(percent));

  return { absolute, percent, direction, intensity };
}

function getDirection(delta: number): PriceDirection {
  if (delta > 0.01) return 'aumento';
  if (delta < -0.01) return 'reducao';
  return 'manutencao';
}

function getIntensity(absPercent: number): PriceChangeIntensity {
  if (absPercent <= SMALL_CHANGE_THRESHOLD) return 'pequena';
  if (absPercent <= LARGE_CHANGE_THRESHOLD) return 'moderada';
  return 'grande';
}

/**
 * Formata a variação para exibição.
 */
export function formatPriceDelta(delta: PriceDeltaResult): string {
  const sign = delta.absolute > 0 ? '+' : '';
  return `${sign}R$ ${delta.absolute.toFixed(2)} (${sign}${delta.percent.toFixed(1)}%)`;
}
