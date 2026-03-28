// ========================================
// Pricing Executive Summary Generator
// ========================================
// Gera resumo executivo em linguagem de negócio para o painel de análise.

import type { PricingAnalysisDecisionContext, RecommendationAction } from '../types/pricingAnalysis';

/**
 * Gera o resumo executivo consolidado.
 */
export function generateExecutiveSummary(
  ctx: Omit<PricingAnalysisDecisionContext, 'executiveSummary'>
): string {
  const parts: string[] = [];

  // Abertura com ação
  const actionLabel = getActionLabel(ctx.recommendation.action);
  parts.push(
    `Recomendação: ${actionLabel} o preço de ${ctx.serviceName} na praça ${ctx.pracaName}.`
  );

  // Variação
  if (ctx.priceDelta !== 0) {
    const direction = ctx.priceDelta > 0 ? 'aumento' : 'redução';
    parts.push(
      `A proposta de ${direction} de ${Math.abs(ctx.priceDeltaPercent).toFixed(1)}% foi avaliada com ${ctx.recommendation.confidence}% de confiança.`
    );
  }

  // Clima
  if (ctx.climateContext.enabled) {
    const climateLabel = getClimateLabel(ctx.climateContext.forecastSignal);
    parts.push(`Cenário climático: ${climateLabel}.`);
  }

  // Sazonalidade
  const seasonLabel = getSeasonalityLabel(ctx.seasonalityContext.level);
  parts.push(`Sazonalidade: ${seasonLabel}.`);

  // Mercado
  if (ctx.marketContext.pricingProfile) {
    const profileLabel = getProfileLabel(ctx.marketContext.pricingProfile);
    parts.push(`Perfil territorial: ${profileLabel}.`);
  }

  // Sinais
  if (ctx.positiveSignals.length > 0 && ctx.negativeSignals.length === 0) {
    parts.push('O conjunto de sinais externos sustenta preço mais firme nesta praça.');
  } else if (ctx.negativeSignals.length > 0 && ctx.positiveSignals.length === 0) {
    parts.push('O cenário atual sugere manter ou revisar moderadamente, e não aumentar de forma agressiva.');
  } else if (ctx.positiveSignals.length > 0 && ctx.negativeSignals.length > 0) {
    parts.push('O cenário apresenta sinais mistos — revisão atenta é recomendada.');
  }

  return parts.join(' ');
}

/**
 * Gera o resumo da recomendação curto.
 */
export function generateRecommendationSummary(
  action: RecommendationAction,
  confidence: number,
  positiveSignals: string[],
  negativeSignals: string[]
): string {
  const actionLabel = getActionLabel(action);
  const signalBalance = positiveSignals.length - negativeSignals.length;

  if (action === 'revisar') {
    if (negativeSignals.length > positiveSignals.length) {
      return `Revisar com atenção. ${negativeSignals.length} sinal(is) de cautela identificado(s). Confiança: ${confidence}%.`;
    }
    return `Revisar a proposta. Sinais mistos no contexto atual. Confiança: ${confidence}%.`;
  }

  if (action === 'aumentar') {
    return `${actionLabel}. ${positiveSignals.length} sinal(is) favorável(is) identificado(s). Confiança: ${confidence}%.`;
  }

  if (action === 'reduzir') {
    return `${actionLabel}. O contexto sugere ajuste para baixo. Confiança: ${confidence}%.`;
  }

  return `${actionLabel}. Cenário estável sem pressão significativa. Confiança: ${confidence}%.`;
}

// ----------------------------------------
// Helpers
// ----------------------------------------

function getActionLabel(action: RecommendationAction): string {
  switch (action) {
    case 'aumentar': return 'Aumentar';
    case 'manter': return 'Manter';
    case 'reduzir': return 'Reduzir';
    case 'revisar': return 'Revisar';
  }
}

function getClimateLabel(signal?: 'favoravel' | 'neutro' | 'desfavoravel'): string {
  switch (signal) {
    case 'favoravel': return 'favorável para a demanda';
    case 'desfavoravel': return 'desfavorável para a demanda';
    default: return 'neutro, sem impacto significativo';
  }
}

function getSeasonalityLabel(level: 'alta' | 'neutra' | 'baixa'): string {
  switch (level) {
    case 'alta': return 'período de alta demanda';
    case 'baixa': return 'período de baixa demanda';
    default: return 'período neutro';
  }
}

function getProfileLabel(profile: string): string {
  switch (profile) {
    case 'premium': return 'praça com perfil premium';
    case 'equilibrado': return 'praça equilibrada';
    case 'sensivel_preco': return 'praça sensível a preço';
    case 'competitivo': return 'praça com alta competição';
    case 'expansao': return 'praça com oportunidade de expansão';
    case 'alto_risco': return 'praça de alto risco';
    default: return 'perfil não classificado';
  }
}
