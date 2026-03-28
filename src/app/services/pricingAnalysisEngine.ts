// ========================================
// Pricing Analysis Engine
// ========================================
// Motor principal que orquestra todos os serviços de análise
// e gera o PricingAnalysisDecisionContext consolidado.

import type { WeatherSummary } from '../types/weather';
import type { TerritorialInsightSummary } from '../types/territorial';
import type { ServiceClimateSensitivity } from '../types/pricingClimate';
import type {
  PricingAnalysisDecisionContext,
  PricingAnalysisInput,
} from '../types/pricingAnalysis';

import { analyzeClimateForPricing } from './climateAnalysisService';
import { analyzeMarketContext, generateMarketSignals } from './marketAnalysisService';
import { analyzeOfferPressure } from './offerPressureService';
import { analyzeSeasonalityForPricing, generateSeasonalitySignals } from './seasonalityAnalysisService';
import {
  evaluatePricingRules,
  classifyPriceIntensity,
  classifyPriceDirection,
} from '../utils/pricingAnalysisRules';
import {
  buildHistoricalContext,
  getMockHistoricalData,
  getMockDispersionData,
} from '../utils/pricingAnalysisMappers';
import {
  generateExecutiveSummary,
  generateRecommendationSummary,
} from '../utils/pricingExecutiveSummary';

/**
 * Executa o motor de análise de pricing completo.
 *
 * Recebe todos os dados pré-carregados e retorna o contexto
 * consolidado de decisão. Não faz chamadas de rede — apenas lógica.
 */
export function runPricingAnalysisEngine(
  input: PricingAnalysisInput,
  weather: WeatherSummary | null,
  territorial: TerritorialInsightSummary | null,
  sensitivity?: ServiceClimateSensitivity | null
): PricingAnalysisDecisionContext {
  // 1. Calculate price delta
  const priceDelta = input.proposedPrice - input.currentPrice;
  const priceDeltaPercent =
    input.currentPrice > 0 ? (priceDelta / input.currentPrice) * 100 : 0;

  // 2. Analyze climate
  const climateContext = analyzeClimateForPricing(weather, sensitivity);

  // 3. Analyze market
  const marketContext = analyzeMarketContext(territorial);

  // 4. Analyze seasonality
  const seasonalityContext = analyzeSeasonalityForPricing(weather, sensitivity);

  // 5. Analyze offer pressure
  const offerPressure = analyzeOfferPressure(territorial);

  // 6. Build historical context (mock or real)
  const mockHistorical = getMockHistoricalData(input.pracaName, input.currentPrice);
  const mockDispersion = getMockDispersionData(input.currentPrice);
  const historicalContext = buildHistoricalContext(
    input.currentPrice,
    mockHistorical,
    mockDispersion
  );

  // 7. Classify price change
  const priceDirection = classifyPriceDirection(priceDelta);
  const priceIntensity = classifyPriceIntensity(Math.abs(priceDeltaPercent));

  // 8. Run rules engine
  const rulesResult = evaluatePricingRules({
    priceDirection,
    priceIntensity,
    priceDeltaPercent,
    seasonality: seasonalityContext.level,
    forecastSignal: climateContext.forecastSignal ?? 'neutro',
    climateImpactLevel: climateContext.climateImpactLevel ?? 'baixo',
    incomeLevel: marketContext.incomeLevel ?? 'media',
    offerPressure: marketContext.offerPressure ?? 'media',
    pricingProfile: marketContext.pricingProfile ?? 'equilibrado',
    municipalitySize: marketContext.municipalitySize ?? 'medio',
    pricePosition: historicalContext.pricePosition ?? 'dentro',
  });

  // 9. Consolidate signals
  const marketSignals = generateMarketSignals(marketContext);
  const seasonalitySignals = generateSeasonalitySignals(seasonalityContext, priceDirection);

  const positiveSignals = [
    ...rulesResult.positiveSignals,
    ...marketSignals.positive,
    ...seasonalitySignals.positive,
  ];

  const negativeSignals = [
    ...rulesResult.negativeSignals,
    ...marketSignals.negative,
    ...seasonalitySignals.negative,
  ];

  // 10. Consolidate alerts
  const allAlerts = [
    ...rulesResult.alerts,
    ...offerPressure.alerts,
  ];

  // 11. Build recommendation
  const recommendation = {
    action: rulesResult.action,
    confidence: rulesResult.confidence,
    summary: generateRecommendationSummary(
      rulesResult.action,
      rulesResult.confidence,
      positiveSignals,
      negativeSignals
    ),
  };

  // 12. Build context (without executiveSummary first)
  const contextWithoutSummary = {
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    pracaId: input.pracaId,
    pracaName: input.pracaName,
    currentPrice: input.currentPrice,
    proposedPrice: input.proposedPrice,
    priceDelta,
    priceDeltaPercent,
    historicalContext,
    climateContext,
    marketContext,
    seasonalityContext,
    recommendation,
    alerts: allAlerts,
    positiveSignals,
    negativeSignals,
  };

  // 13. Generate executive summary
  const executiveSummary = generateExecutiveSummary(contextWithoutSummary);

  return {
    ...contextWithoutSummary,
    executiveSummary,
  };
}
