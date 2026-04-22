// ============================================================================
// ML Pricing Suggestion Service
// ============================================================================
// Motor de sugestão de preço baseado em aprendizado estatístico ponderado.
//
// ALGORITMO:
//  1. Coleta histórico de SalesDataRows (N semanas) para o grupo × praça
//  2. Calcula métricas de tendência (preço médio, conversão, adesão, etc.)
//  3. Aplica pesos adaptativos (MLWeights) calibrados com o comportamento dos usuários
//  4. Gera preço base ponderado + correção de bias
//  5. Calcula banda de confiança a partir da variância dos preços históricos
//  6. Retorna MLPriceSuggestion com fatores explicativos
//
// Os pesos adaptativos são armazenados em mlBehaviorStore e evoluem conforme
// os admins aceitam, modificam ou ignoram as sugestões.
// ============================================================================

import type { SalesDataRow, MLPriceSuggestion, MLFactor, MLWeights } from '../types/mlPricing';
import { DEFAULT_ML_WEIGHTS } from '../types/mlPricing';

// ─── Utilitários estatísticos ─────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function linearTrend(values: number[]): number {
  // Retorna o slope normalizado (positivo = tendência de alta)
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  if (den === 0) return 0;
  return num / den;
}

// ─── Score de cada fator (retorna valor 0–1) ─────────────────────────────────

/** Score de preço histórico: quanto mais estável e alto o histórico, maior o score */
function scoreHistoricoPreco(rows: SalesDataRow[]): number {
  const prices = rows.map((r) => r.precoMedioVenda).filter((p) => p > 0);
  if (prices.length === 0) return 0.5;
  const trendSlope = linearTrend(prices);
  // Normaliza slope em relação à média do preço
  const m = mean(prices);
  const normalizedTrend = m > 0 ? Math.max(-1, Math.min(1, trendSlope / m)) : 0;
  return 0.5 + normalizedTrend * 0.4;
}

/** Score de conversão: alta conversão → pode praticar preço mais alto */
function scoreConversao(rows: SalesDataRow[]): number {
  const rates = rows.map((r) => r.taxaConversao).filter((v) => v >= 0 && v <= 1);
  if (rates.length === 0) return 0.5;
  const avgRate = mean(rates);
  return Math.min(1, avgRate * 1.2); // amplifica ligeiramente
}

/** Score de adesão: alta adesão → clientes aceitam bem o preço → pode subir */
function scoreAdesao(rows: SalesDataRow[]): number {
  const rates = rows.map((r) => r.taxaAdesao).filter((v) => v >= 0 && v <= 1);
  if (rates.length === 0) return 0.5;
  return Math.min(1, mean(rates) * 1.3);
}

/** Score de rede de prestadores: muitos prestadores → concorrência alta → pressão de baixa */
function scorePrestadores(rows: SalesDataRow[]): number {
  const counts = rows.map((r) => r.prestadoresAtivos).filter((v) => v > 0);
  if (counts.length === 0) return 0.5;
  const avg = mean(counts);
  // Até 5 prestadores = favorável (alta), >20 = desfavorável (baixa)
  if (avg <= 5) return 0.85;
  if (avg <= 10) return 0.65;
  if (avg <= 20) return 0.45;
  return 0.25;
}

/** Score de concorrentes: mais concorrentes → menor preço sustentável */
function scoreConcorrentes(rows: SalesDataRow[]): number {
  const counts = rows.map((r) => r.redeConcorrentes).filter((v) => v > 0);
  if (counts.length === 0) return 0.5;
  const avg = mean(counts);
  if (avg <= 3) return 0.85;
  if (avg <= 8) return 0.65;
  if (avg <= 15) return 0.45;
  return 0.3;
}

/** Score de capacidade de compra regional (1–5 → 0.2–1.0) */
function scoreCapacidadeCompra(rows: SalesDataRow[]): number {
  const levels = rows.map((r) => r.capacidadeCompraRegional).filter((v) => v >= 1 && v <= 5);
  if (levels.length === 0) return 0.5;
  return mean(levels) / 5;
}

import { FIXED_TAX } from '../data/plazasData';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default ratio used to estimate repasse from venda when no repasse history exists */
const DEFAULT_REPASSE_RATIO = 0.6;

/** Baseline score — scores above this increase prices, below decrease them */
const BASELINE_SCORE = 0.5;

/**
 * Maximum price adjustment factor relative to base price (±15%).
 * Kept conservative because the admin anchor is already a strong, correlated
 * price signal. Wide swings would erode the reliability of the suggestion.
 */
const MAX_ADJUSTMENT_RANGE = 0.30;

/**
 * Weight of the admin-replicated price in the base price blend (with history).
 * High (60%) because target plazas are selected precisely because they share
 * historical price similarity with the admin plaza.
 */
const ADMIN_ANCHOR_WEIGHT = 0.60;

/**
 * Weight of market-research (competitor) mean price in the base price blend
 * (only applied when market data is available alongside local history).
 */
const MARKET_ANCHOR_WEIGHT = 0.20;

/**
 * Admin price weight used in the no-history fallback.
 * Higher than the with-history ADMIN_ANCHOR_WEIGHT because there is no local
 * historical signal to temper it, so we lean more heavily on the external anchors.
 */
const NO_HISTORY_ADMIN_WEIGHT = 0.70;

/**
 * Market research weight used in the no-history fallback.
 * Complement of NO_HISTORY_ADMIN_WEIGHT when both signals are present.
 */
const NO_HISTORY_MARKET_WEIGHT = 0.30;

/**
 * Market research weight when only history + market (no admin anchor) is available.
 */
const HISTORY_MARKET_WEIGHT = 0.30;

/**
 * Half-range for the confidence band in the no-history case (±8%).
 * Narrower than MAX_ADJUSTMENT_RANGE because the no-history suggestion is
 * already anchored to the admin/market price and the band should reflect
 * the uncertainty of having no local validation.
 */
const NO_HISTORY_BAND_HALF = 0.08;

/**
 * Gera uma sugestão de preço ML para um grupo de serviço × praça.
 *
 * @param grupoServico Nome do grupo de serviço
 * @param plaza Nome da praça
 * @param history Histórico de SalesDataRows (de salesDataStore.getHistory)
 * @param weights Pesos adaptativos (de mlBehaviorStore.getWeights)
 * @param currentRepasse Repasse atual (para calcular margem) — opcional
 * @param adminReplicatedVenda Preço de venda replicado pelo admin para esta praça — opcional.
 *   Recebe 60% do peso no preço base porque praças-alvo são selecionadas por terem
 *   histórico de preços semelhante ao da praça do admin.
 * @param marketResearchMeanVenda Média dos preços de concorrentes para este serviço — opcional.
 *   Incorporado com 20% de peso quando histórico local também existe.
 */
export function generateMLSuggestion(
  grupoServico: string,
  plaza: string,
  history: SalesDataRow[],
  weights: MLWeights = DEFAULT_ML_WEIGHTS,
  currentRepasse?: number,
  adminReplicatedVenda?: number,
  marketResearchMeanVenda?: number
): MLPriceSuggestion | null {
  const hasHistory = history.length > 0;
  const hasAdminAnchor = adminReplicatedVenda != null && adminReplicatedVenda > 0;
  const hasMarketData = marketResearchMeanVenda != null && marketResearchMeanVenda > 0;

  // When there is no plaza-specific history, build the best possible anchor from
  // whatever external signals are available (admin price + market research).
  if (!hasHistory) {
    if (!hasAdminAnchor) return null;

    // Blend admin price with market research mean when both are available.
    // Without history the market data gets a stronger voice (NO_HISTORY_MARKET_WEIGHT)
    // since it's the only local market signal we have.
    const suggestedVenda = hasMarketData
      ? adminReplicatedVenda! * NO_HISTORY_ADMIN_WEIGHT + marketResearchMeanVenda! * NO_HISTORY_MARKET_WEIGHT
      : adminReplicatedVenda!;

    const repasseBase = currentRepasse ?? suggestedVenda * DEFAULT_REPASSE_RATIO;
    const suggestedRepasse = Math.round(repasseBase * 100) / 100;
    const estimatedMargem =
      suggestedVenda > 0
        ? ((suggestedVenda - suggestedRepasse) / suggestedVenda - FIXED_TAX) * 100
        : 0;

    // Confidence is higher when we also have market research to back up the admin price.
    const confidence = hasMarketData ? 35 : 20;
    const keyFactors: MLFactor[] = [
      {
        label: 'Preço replicado pelo admin',
        impact: 'neutro',
        description: `Praça correlacionada — preço do admin (R$ ${adminReplicatedVenda!.toFixed(2)}) usado como base principal`,
      },
    ];
    if (hasMarketData) {
      const delta = ((marketResearchMeanVenda! - adminReplicatedVenda!) / adminReplicatedVenda!) * 100;
      keyFactors.push({
        label: 'Pesquisa de mercado (concorrentes)',
        impact: Math.abs(delta) < 5 ? 'neutro' : delta > 0 ? 'positivo' : 'negativo',
        description: `Média de concorrentes R$ ${marketResearchMeanVenda!.toFixed(2)} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs. admin)`,
      });
    }

    return {
      grupoServico,
      plaza,
      suggestedVenda: Math.round(suggestedVenda * 100) / 100,
      suggestedRepasse,
      vendaMin: Math.round(suggestedVenda * (1 - NO_HISTORY_BAND_HALF) * 100) / 100,
      vendaMax: Math.round(suggestedVenda * (1 + NO_HISTORY_BAND_HALF) * 100) / 100,
      confidence,
      confidenceLevel: confidence >= 45 ? 'media' : 'baixa',
      estimatedMargem: Math.round(estimatedMargem * 100) / 100,
      keyFactors,
      summary: hasMarketData
        ? `Sem histórico local para ${plaza}. Sugestão baseada no preço do admin (70%) e média de concorrentes R$ ${marketResearchMeanVenda!.toFixed(2)} (30%). Confiança baixa-média — enriqueça com dados locais.`
        : `Sem dados históricos para ${plaza}. Sugestão baseada no preço replicado pelo admin (R$ ${adminReplicatedVenda!.toFixed(2)}). Confiança baixa — valide com dados locais.`,
      generatedAt: new Date().toISOString(),
      historicoSemanas: 0,
    };
  }

  // ── 1. Calcula preço base a partir dos dados históricos ──────────────────
  const validPrices = history
    .map((r) => r.precoMedioVenda)
    .filter((p) => p > 0);
  const validRepassePrices = history
    .map((r) => r.precoMedioRepasse)
    .filter((p) => p > 0);

  if (validPrices.length === 0) return null;

  const historicalMeanVenda = mean(validPrices);
  const repasseFallback = currentRepasse ?? historicalMeanVenda * DEFAULT_REPASSE_RATIO;
  const basePrecoRepasse = validRepassePrices.length > 0 ? mean(validRepassePrices) : repasseFallback;

  // ── 1b. Blend base price from all available anchors ───────────────────────
  //
  // Priority of signals (justified):
  //   Admin anchor (60%)  — target plazas are correlated with the admin plaza,
  //                         so this price is already the strongest market signal.
  //   Market research (20%) — real competitor prices for this exact service code;
  //                           only applied when market data is available.
  //   Historical mean (20% or 40%) — local historical prices capture past trends.
  //
  // When market research is not available:
  //   Admin 60% + Historical 40%.
  let basePrecoVenda: number;
  if (hasAdminAnchor && hasMarketData) {
    const histWeight = 1 - ADMIN_ANCHOR_WEIGHT - MARKET_ANCHOR_WEIGHT; // 0.20
    basePrecoVenda =
      historicalMeanVenda * histWeight +
      adminReplicatedVenda! * ADMIN_ANCHOR_WEIGHT +
      marketResearchMeanVenda! * MARKET_ANCHOR_WEIGHT;
  } else if (hasAdminAnchor) {
    const histWeight = 1 - ADMIN_ANCHOR_WEIGHT; // 0.40
    basePrecoVenda =
      historicalMeanVenda * histWeight + adminReplicatedVenda! * ADMIN_ANCHOR_WEIGHT;
  } else if (hasMarketData) {
    basePrecoVenda =
      historicalMeanVenda * (1 - HISTORY_MARKET_WEIGHT) + marketResearchMeanVenda! * HISTORY_MARKET_WEIGHT;
  } else {
    basePrecoVenda = historicalMeanVenda;
  }

  // ── 2. Calcula scores de cada fator ──────────────────────────────────────
  const sHistorico   = scoreHistoricoPreco(history);
  const sConversao   = scoreConversao(history);
  const sAdesao      = scoreAdesao(history);
  const sPrestadores = scorePrestadores(history);
  const sConcorr     = scoreConcorrentes(history);
  const sCapCompra   = scoreCapacidadeCompra(history);

  // ── 3. Score composto ponderado ───────────────────────────────────────────
  const totalWeight =
    weights.wHistoricoPreco +
    weights.wConversao +
    weights.wAdesao +
    weights.wPrestadores +
    weights.wConcorrentes +
    weights.wCapacidadeCompra;

  const compositeScore =
    (weights.wHistoricoPreco * sHistorico +
      weights.wConversao * sConversao +
      weights.wAdesao * sAdesao +
      weights.wPrestadores * sPrestadores +
      weights.wConcorrentes * sConcorr +
      weights.wCapacidadeCompra * sCapCompra) /
    totalWeight;

  // ── 4. Ajuste de preço baseado no score ──────────────────────────────────
  // Score acima de BASELINE_SCORE aumenta o preço, abaixo diminui.
  // Um score de 1.0 aumenta em até MAX_ADJUSTMENT_RANGE/2 (25%); 0.0 diminui 25%.
  const adjustmentFactor = 1 + (compositeScore - BASELINE_SCORE) * MAX_ADJUSTMENT_RANGE;
  let suggestedVenda = basePrecoVenda * adjustmentFactor;

  // ── 5. Aplica bias de correção aprendido ──────────────────────────────────
  suggestedVenda = suggestedVenda * (1 + weights.biasCorrecao);

  // ── 6. Calcula banda de confiança ────────────────────────────────────────
  const sd = stdDev(validPrices);
  const vendaMin = Math.max(basePrecoRepasse * 1.05, suggestedVenda - sd);
  const vendaMax = suggestedVenda + sd;

  // ── 7. Sugere repasse ────────────────────────────────────────────────────
  const repasseRatio = basePrecoRepasse / basePrecoVenda;
  const suggestedRepasse = Math.round(suggestedVenda * repasseRatio * 100) / 100;

  // ── 8. Estima margem ─────────────────────────────────────────────────────
  const estimatedMargem =
    suggestedVenda > 0
      ? ((suggestedVenda - suggestedRepasse) / suggestedVenda - FIXED_TAX) * 100
      : 0;

  // ── 9. Calcula confiança ──────────────────────────────────────────────────
  const dataPoints = validPrices.length;
  const stabilityScore = sd > 0 ? 1 - Math.min(1, sd / basePrecoVenda) : 1;
  const dataScore = Math.min(1, dataPoints / 8); // pleno em 8 semanas
  const rawConfidence = (stabilityScore * 0.6 + dataScore * 0.4) * 100;
  // Each strong external anchor (admin price from correlated plaza, real market
  // research) adds to the confidence since they validate the local signal.
  const anchorBonus = (hasAdminAnchor ? 12 : 0) + (hasMarketData ? 8 : 0);
  const confidence = Math.round(Math.min(95, Math.max(20, rawConfidence + anchorBonus)));

  const confidenceLevel =
    confidence >= 70 ? 'alta' : confidence >= 45 ? 'media' : 'baixa';

  // ── 10. Monta fatores explicativos ───────────────────────────────────────
  const keyFactors: MLFactor[] = [];

  keyFactors.push({
    label: 'Histórico de preços',
    impact: sHistorico > 0.6 ? 'positivo' : sHistorico < 0.4 ? 'negativo' : 'neutro',
    description:
      sHistorico > 0.6
        ? `Tendência de alta nos últimos ${dataPoints} períodos`
        : sHistorico < 0.4
        ? `Tendência de queda nos preços históricos`
        : `Preços estáveis no histórico recente`,
  });

  const avgConv = mean(history.map((r) => r.taxaConversao));
  keyFactors.push({
    label: 'Taxa de conversão',
    impact: sConversao > 0.6 ? 'positivo' : sConversao < 0.35 ? 'negativo' : 'neutro',
    description: `Média de ${(avgConv * 100).toFixed(1)}% de OS convertidas`,
  });

  const avgAd = mean(history.map((r) => r.taxaAdesao));
  keyFactors.push({
    label: 'Taxa de adesão',
    impact: sAdesao > 0.6 ? 'positivo' : sAdesao < 0.35 ? 'negativo' : 'neutro',
    description: `Média de ${(avgAd * 100).toFixed(1)}% de adesão dos clientes`,
  });

  const avgPrest = mean(history.map((r) => r.prestadoresAtivos));
  keyFactors.push({
    label: 'Rede de prestadores',
    impact: sPrestadores > 0.6 ? 'positivo' : sPrestadores < 0.4 ? 'negativo' : 'neutro',
    description: `Média de ${avgPrest.toFixed(0)} prestadores ativos`,
  });

  const avgConcorr = mean(history.map((r) => r.redeConcorrentes));
  keyFactors.push({
    label: 'Rede de concorrentes',
    impact: sConcorr > 0.6 ? 'positivo' : sConcorr < 0.4 ? 'negativo' : 'neutro',
    description: `Estimativa de ${avgConcorr.toFixed(0)} concorrentes na região`,
  });

  const avgCap = mean(history.map((r) => r.capacidadeCompraRegional));
  keyFactors.push({
    label: 'Capacidade de compra regional',
    impact: sCapCompra > 0.6 ? 'positivo' : sCapCompra < 0.4 ? 'negativo' : 'neutro',
    description: `Nível ${avgCap.toFixed(1)} / 5 de poder de compra`,
  });

  if (weights.nSamples > 0) {
    const biasDir = weights.biasCorrecao > 0.05 ? 'positivo' : weights.biasCorrecao < -0.05 ? 'negativo' : 'neutro';
    keyFactors.push({
      label: 'Calibração de comportamento',
      impact: biasDir,
      description: `Baseada em ${weights.nSamples} precificações registradas nesta praça`,
    });
  }

  // ── Fator: Preço replicado pelo admin ─────────────────────────────────────
  if (hasAdminAnchor && historicalMeanVenda > 0) {
    const delta = ((adminReplicatedVenda! - historicalMeanVenda) / historicalMeanVenda) * 100;
    const adminImpact: MLFactor['impact'] =
      Math.abs(delta) < 5 ? 'neutro' : delta > 0 ? 'positivo' : 'negativo';
    keyFactors.push({
      label: 'Preço replicado pelo admin (praça correlacionada)',
      impact: adminImpact,
      description:
        Math.abs(delta) < 5
          ? `Preço do admin R$ ${adminReplicatedVenda!.toFixed(2)} alinhado à média local — principal âncora da sugestão`
          : delta > 0
          ? `Preço do admin R$ ${adminReplicatedVenda!.toFixed(2)} (${delta.toFixed(1)}% acima da média local) — eleva a sugestão`
          : `Preço do admin R$ ${adminReplicatedVenda!.toFixed(2)} (${Math.abs(delta).toFixed(1)}% abaixo da média local) — modera a sugestão`,
    });
  }

  // ── Fator: Pesquisa de mercado (concorrentes) ─────────────────────────────
  if (hasMarketData && historicalMeanVenda > 0) {
    const delta = ((marketResearchMeanVenda! - historicalMeanVenda) / historicalMeanVenda) * 100;
    const marketImpact: MLFactor['impact'] =
      Math.abs(delta) < 5 ? 'neutro' : delta > 0 ? 'positivo' : 'negativo';
    keyFactors.push({
      label: 'Pesquisa de mercado (concorrentes)',
      impact: marketImpact,
      description:
        Math.abs(delta) < 5
          ? `Média de concorrentes R$ ${marketResearchMeanVenda!.toFixed(2)} — consistente com o histórico local`
          : delta > 0
          ? `Mercado pratica R$ ${marketResearchMeanVenda!.toFixed(2)} (${delta.toFixed(1)}% acima da média local) — potencial de valorização`
          : `Mercado pratica R$ ${marketResearchMeanVenda!.toFixed(2)} (${Math.abs(delta).toFixed(1)}% abaixo da média local) — pressão competitiva`,
    });
  }

  // ── 11. Resumo ─────────────────────────────────────────────────────────────
  const trendLabel =
    adjustmentFactor > 1.05
      ? 'acima da média histórica'
      : adjustmentFactor < 0.95
      ? 'abaixo da média histórica'
      : 'próximo à média histórica';

  const anchorLines = [
    hasAdminAnchor
      ? `Admin (praça correlacionada): R$ ${adminReplicatedVenda!.toFixed(2)}`
      : '',
    hasMarketData
      ? `Mercado (concorrentes): R$ ${marketResearchMeanVenda!.toFixed(2)}`
      : '',
  ].filter(Boolean).join('; ');

  const summary = [
    `Sugestão ${trendLabel} de R$ ${suggestedVenda.toFixed(2)}.`,
    anchorLines ? `Âncoras utilizadas — ${anchorLines}.` : '',
    confidence >= 70
      ? `Alta confiança com base em ${dataPoints} semana(s) de dados.`
      : confidence >= 45
      ? `Confiança média — recomenda-se revisar com dados adicionais.`
      : `Confiança baixa — poucos dados disponíveis para este grupo/praça.`,
    weights.biasCorrecao !== 0
      ? `Corrigido ${weights.biasCorrecao > 0 ? 'para cima' : 'para baixo'} com base no comportamento histórico dos precificadores.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    grupoServico,
    plaza,
    suggestedVenda: Math.round(suggestedVenda * 100) / 100,
    suggestedRepasse: Math.round(suggestedRepasse * 100) / 100,
    vendaMin: Math.round(vendaMin * 100) / 100,
    vendaMax: Math.round(vendaMax * 100) / 100,
    confidence,
    confidenceLevel,
    estimatedMargem: Math.round(estimatedMargem * 100) / 100,
    keyFactors,
    summary,
    generatedAt: new Date().toISOString(),
    historicoSemanas: history.length,
  };
}
