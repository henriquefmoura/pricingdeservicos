// ========================================
// Competitor Insights Engine
// ========================================
// Generates actionable pricing insights from aggregated competitor data.

import type {
  CompetitorPriceSummary,
  CompetitorInsight,
  PricePosition,
  CompetitorAnalysisResult,
  CompetitorSearchInput,
  NormalizedPrice,
} from '../../types/competitor';
import { formatBRLCompact } from '../../utils/currencyParser';

/**
 * Generates insights based on competitor price summary.
 */
export function generateInsights(
  summary: CompetitorPriceSummary | null,
  userPrice?: number
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  if (!summary) {
    insights.push({
      id: 'no-data',
      type: 'warning',
      title: 'Dados insuficientes',
      description: 'Não foram encontradas referências de preço suficientes para esta praça e serviço.',
    });
    return insights;
  }

  // Insight: Market average
  insights.push({
    id: 'market-avg',
    type: 'info',
    title: 'Preço médio de mercado',
    description: `Preço médio de mercado nesta praça: ${formatBRLCompact(summary.average)}`,
  });

  // Insight: Price range
  insights.push({
    id: 'price-range',
    type: 'info',
    title: 'Faixa de preço observada',
    description: `Faixa observada: ${summary.priceRange}`,
  });

  // Insight: Dispersion
  if (summary.dispersion > 0.4) {
    insights.push({
      id: 'high-dispersion',
      type: 'warning',
      title: 'Alta dispersão de preços',
      description: 'Alta dispersão de preços indica mercado fragmentado — há espaço para diferenciação.',
    });
  } else if (summary.dispersion < 0.15) {
    insights.push({
      id: 'low-dispersion',
      type: 'info',
      title: 'Preço consolidado',
      description: 'Baixa dispersão indica preço consolidado no mercado — pouco espaço para variação.',
    });
  } else {
    insights.push({
      id: 'moderate-dispersion',
      type: 'info',
      title: 'Dispersão moderada',
      description: 'Dispersão moderada indica mercado com faixas definidas mas alguma variação.',
    });
  }

  // Insight: Sample size / confidence
  if (summary.sampleSize < 3) {
    insights.push({
      id: 'low-sample',
      type: 'warning',
      title: 'Poucas referências',
      description: 'Poucas referências disponíveis — baixa confiança na análise.',
    });
  } else if (summary.sampleSize >= 8) {
    insights.push({
      id: 'good-sample',
      type: 'positive',
      title: 'Boa amostra',
      description: `Análise baseada em ${summary.sampleSize} referências de preço — boa representatividade.`,
    });
  }

  // Insight: User price position
  if (userPrice != null && userPrice > 0) {
    if (userPrice > summary.max) {
      insights.push({
        id: 'above-max',
        type: 'negative',
        title: 'Preço acima do teto',
        description: `Seu preço (${formatBRLCompact(userPrice)}) está acima do teto observado no mercado (${formatBRLCompact(summary.max)}).`,
      });
    } else if (userPrice > summary.median) {
      const pctAbove = Math.round(((userPrice - summary.median) / summary.median) * 100);
      insights.push({
        id: 'above-median',
        type: 'warning',
        title: 'Acima da mediana',
        description: `Seu preço está ${pctAbove}% acima da mediana do mercado (${formatBRLCompact(summary.median)}).`,
      });
    } else if (userPrice < summary.min) {
      insights.push({
        id: 'below-floor',
        type: 'negative',
        title: 'Abaixo do piso',
        description: `Seu preço (${formatBRLCompact(userPrice)}) está abaixo do piso observado (${formatBRLCompact(summary.min)}). Risco de subprecificação.`,
      });
    } else if (userPrice <= summary.median) {
      insights.push({
        id: 'competitive',
        type: 'positive',
        title: 'Preço competitivo',
        description: `Seu preço está alinhado ou abaixo da mediana do mercado (${formatBRLCompact(summary.median)}).`,
      });
    }
  }

  // Insight: Confidence level
  if (summary.confidenceLevel === 'baixa') {
    insights.push({
      id: 'low-confidence',
      type: 'warning',
      title: 'Baixa confiança',
      description: 'O score de confiança é baixo. Utilize os dados como referência exploratória.',
    });
  } else if (summary.confidenceLevel === 'alta') {
    insights.push({
      id: 'high-confidence',
      type: 'positive',
      title: 'Alta confiança',
      description: 'Análise com alta confiança — dados robustos e diversificados.',
    });
  }

  return insights;
}

/**
 * Calculates the user's price position relative to the market.
 */
export function calculatePricePosition(
  summary: CompetitorPriceSummary,
  userPrice: number
): PricePosition {
  const range = summary.max - summary.min;
  const positionPercent = range > 0
    ? Math.round(((userPrice - summary.min) / range) * 100)
    : 50;

  let positionLabel: string;
  if (userPrice < summary.min) positionLabel = 'Abaixo do mercado';
  else if (userPrice > summary.max) positionLabel = 'Acima do mercado';
  else if (userPrice <= summary.median * 0.9) positionLabel = 'Abaixo da mediana';
  else if (userPrice >= summary.median * 1.1) positionLabel = 'Acima da mediana';
  else positionLabel = 'Alinhado ao mercado';

  return {
    userPrice,
    marketMedian: summary.median,
    marketAverage: summary.average,
    marketMin: summary.min,
    marketMax: summary.max,
    positionLabel,
    positionPercent: Math.max(0, Math.min(100, positionPercent)),
  };
}

/**
 * Builds the complete analysis result.
 */
export function buildAnalysisResult(
  input: CompetitorSearchInput,
  summary: CompetitorPriceSummary | null,
  normalizedPrices: NormalizedPrice[],
  userPrice?: number
): CompetitorAnalysisResult {
  const insights = generateInsights(summary, userPrice);
  const position = summary && userPrice
    ? calculatePricePosition(summary, userPrice)
    : null;

  return {
    searchInput: input,
    summary,
    normalizedPrices,
    insights,
    position,
  };
}
