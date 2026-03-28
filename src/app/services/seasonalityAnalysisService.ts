// ========================================
// Seasonality Analysis Service
// ========================================
// Adapter de sazonalidade para o motor de análise de pricing.

import type { WeatherSummary } from '../types/weather';
import type { ServiceClimateSensitivity, SeasonalityAnalysis } from '../types/pricingClimate';
import type { PricingAnalysisDecisionContext } from '../types/pricingAnalysis';
import { analyzeSeasonality } from './seasonalityService';

export type SeasonalityContextResult = PricingAnalysisDecisionContext['seasonalityContext'];

/**
 * Analisa a sazonalidade para o contexto de pricing analysis.
 */
export function analyzeSeasonalityForPricing(
  weather: WeatherSummary | null,
  sensitivity?: ServiceClimateSensitivity | null
): SeasonalityContextResult {
  if (!weather || !sensitivity) {
    return getDefaultSeasonality();
  }

  try {
    const result = analyzeSeasonality(weather, sensitivity);
    return {
      level: result.level,
      score: result.score,
      explanation: result.explanation,
      currentPeriodLabel: result.currentPeriodLabel,
    };
  } catch {
    return getDefaultSeasonality();
  }
}

/**
 * Gera sinais de sazonalidade textuais.
 */
export function generateSeasonalitySignals(
  seasonality: SeasonalityContextResult,
  priceDirection: 'aumento' | 'reducao' | 'manutencao'
): { positive: string[]; negative: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];

  if (seasonality.level === 'alta') {
    if (priceDirection === 'aumento') {
      positive.push('Período de alta sazonalidade sustenta aumento de preço.');
    } else if (priceDirection === 'reducao') {
      negative.push('Você está reduzindo o preço em um período historicamente aquecido para este serviço.');
    }
  } else if (seasonality.level === 'baixa') {
    if (priceDirection === 'aumento') {
      negative.push('Você está aumentando o preço em uma praça com sinais de baixa sazonalidade.');
    } else if (priceDirection === 'reducao') {
      positive.push('A redução está alinhada com o cenário de baixa sazonalidade.');
    }
  }

  return { positive, negative };
}

function getDefaultSeasonality(): SeasonalityContextResult {
  const month = new Date().getMonth();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  return {
    level: 'neutra',
    score: 50,
    explanation: 'Dados de sazonalidade não disponíveis. Análise baseada em estimativas.',
    currentPeriodLabel: monthNames[month],
  };
}
