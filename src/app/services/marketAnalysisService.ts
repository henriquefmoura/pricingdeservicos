// ========================================
// Market Analysis Service
// ========================================
// Adapter para análise de mercado: renda, população, porte, perfil.

import type { TerritorialInsightSummary } from '../types/territorial';
import type { PricingAnalysisDecisionContext } from '../types/pricingAnalysis';

export type MarketContextResult = PricingAnalysisDecisionContext['marketContext'];

/**
 * Extrai o contexto de mercado a partir de dados territoriais.
 */
export function analyzeMarketContext(
  territorial: TerritorialInsightSummary | null
): MarketContextResult {
  if (!territorial) {
    return getDefaultMarketContext();
  }

  return {
    incomeLevel: territorial.incomeLevel ?? 'media',
    municipalitySize: territorial.municipalitySize ?? 'medio',
    population: territorial.population ?? null,
    income: territorial.income ?? null,
    relatedCompanies: territorial.relatedCompanies ?? null,
    relatedMEIs: territorial.relatedMEIs ?? null,
    offerPressure: territorial.offerPressure ?? 'media',
    pricingProfile: territorial.pricingProfile ?? 'equilibrado',
  };
}

/**
 * Retorna contexto de mercado padrão quando dados não estão disponíveis.
 */
function getDefaultMarketContext(): MarketContextResult {
  return {
    incomeLevel: 'media',
    municipalitySize: 'medio',
    population: null,
    income: null,
    relatedCompanies: null,
    relatedMEIs: null,
    offerPressure: 'media',
    pricingProfile: 'equilibrado',
  };
}

/**
 * Gera sinais de mercado textuais para o resumo executivo.
 */
export function generateMarketSignals(market: MarketContextResult): {
  positive: string[];
  negative: string[];
} {
  const positive: string[] = [];
  const negative: string[] = [];

  // Income signals
  if (market.incomeLevel === 'alta') {
    positive.push('Renda relativa da praça sustenta posicionamento acima da média.');
  } else if (market.incomeLevel === 'baixa') {
    negative.push('A renda relativa da praça sugere maior sensibilidade a preço.');
  }

  // Population signals
  if (market.municipalitySize === 'metropole' || market.municipalitySize === 'grande') {
    positive.push('Município com grande base populacional favorece volume.');
  } else if (market.municipalitySize === 'pequeno') {
    negative.push('Município pequeno pode limitar o volume de operações.');
  }

  // Offer pressure signals
  if (market.offerPressure === 'baixa') {
    positive.push('Baixa oferta local abre espaço para melhor posicionamento de preço.');
  } else if (market.offerPressure === 'alta') {
    negative.push('A pressão de oferta local parece elevada para este serviço.');
  }

  // Profile signals
  if (market.pricingProfile === 'premium') {
    positive.push('Perfil da praça favorece preço premium.');
  } else if (market.pricingProfile === 'sensivel_preco' || market.pricingProfile === 'alto_risco') {
    negative.push('O contexto territorial sugere atenção: a cidade apresenta maior sensibilidade a preço.');
  } else if (market.pricingProfile === 'competitivo') {
    negative.push('Os dados públicos indicam maior competitividade local, o que pode limitar espaço para aumento.');
  }

  // MEI signals
  if (market.relatedMEIs != null && market.relatedMEIs > 200 && market.offerPressure === 'alta') {
    negative.push('Alta presença de MEIs pode indicar maior sensibilidade competitiva.');
  }

  return { positive, negative };
}
