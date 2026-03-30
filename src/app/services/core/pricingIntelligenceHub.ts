// ========================================
// Pricing Intelligence Hub — Central Data Layer
// ========================================
// Camada central que consolida TODOS os dados para decisão de preço.
// Todos os módulos (Dashboard, Análises, Territorial, Concorrência)
// devem consumir ESSA camada ao invés de buscar dados isoladamente.

import type { WeatherSummary } from '../../types/weather';
import type { TerritorialInsightSummary, LeroyStore } from '../../types/territorial';
import type { ServiceClimateSensitivity } from '../../types/pricingClimate';
import type {
  PricingAnalysisInput,
  PricingAnalysisDecisionContext,
  PricingUnifiedContext,
  CompetitorContext,
  CnaeContext,
} from '../../types/pricingAnalysis';
import type { CompetitorAnalysisResult, NormalizedPrice } from '../../types/competitor';

import { getWeatherBundle } from '../weatherService';
import { runPricingAnalysisEngine } from '../pricingAnalysisEngine';
import { getMockTerritorialData } from '../territorialAnalysisService';
import { getSensitivityByServiceId, findSensitivityByName } from '../serviceSensitivityService';
import { mapServiceToCnae } from '../ibge/cnaeService';
import { getLeroyStoresByCity } from '../../data/leroyStores';
import { analysisCache, buildCacheKey } from '../../utils/pricingAnalysisCache';
import { getCnaeCodesForService } from '../../utils/serviceCnaeMappings';

// ----------------------------------------
// Hub Cache
// ----------------------------------------

const hubCache = new Map<string, { data: unknown; timestamp: number }>();
const HUB_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getHubCache<T>(key: string): T | null {
  const entry = hubCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > HUB_CACHE_TTL) {
    hubCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setHubCache<T>(key: string, data: T): void {
  hubCache.set(key, { data, timestamp: Date.now() });
}

// ----------------------------------------
// Hub Input
// ----------------------------------------

export interface PricingHubInput {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  proposedPrice: number;
  competitorResult?: CompetitorAnalysisResult | null;
  signal?: AbortSignal;
}

// ----------------------------------------
// Hub Output
// ----------------------------------------

export interface PricingHubOutput {
  context: PricingAnalysisDecisionContext;
  unified: PricingUnifiedContext;
  weather: WeatherSummary | null;
  territorial: TerritorialInsightSummary | null;
  sensitivity: ServiceClimateSensitivity;
  cnaeContext: CnaeContext;
  competitorContext: CompetitorContext;
  leroyStores: LeroyStore[];
}

// ----------------------------------------
// Resolve sensitivity
// ----------------------------------------

export function resolveSensitivity(
  serviceId: string,
  serviceName: string
): ServiceClimateSensitivity {
  const byId = getSensitivityByServiceId(serviceId);
  if (byId.sensitivityLevel !== 'nenhuma') return byId;
  const byName = findSensitivityByName(serviceName);
  return byName ?? byId;
}

// ----------------------------------------
// Load Weather (cached)
// ----------------------------------------

export async function loadWeatherData(
  pracaId: string,
  pracaName: string,
  serviceId: string,
  signal?: AbortSignal
): Promise<WeatherSummary | null> {
  const cacheKey = buildCacheKey(pracaId, serviceId, 'weather');
  const cached = analysisCache.get<WeatherSummary>(cacheKey);
  if (cached) return cached;

  try {
    const weatherSummary = await getWeatherBundle({
      city: pracaName,
      preset: '30d',
      signal,
    });
    analysisCache.set(cacheKey, weatherSummary);
    return weatherSummary;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return null;
  }
}

// ----------------------------------------
// Load Territorial
// ----------------------------------------

export function loadTerritorialData(
  pracaName: string
): TerritorialInsightSummary {
  return getMockTerritorialData(pracaName);
}

// ----------------------------------------
// Build CNAE Context
// ----------------------------------------

export async function buildCnaeContext(serviceId: string): Promise<CnaeContext> {
  const cacheKey = `hub_cnae_${serviceId}`;
  const cached = getHubCache<CnaeContext>(cacheKey);
  if (cached) return cached;

  try {
    const result = await mapServiceToCnae(serviceId);
    const cnaeCodes = getCnaeCodesForService(serviceId);
    const ctx: CnaeContext = {
      enabled: !!result,
      cnaeCodes: result?.cnaeCodes ?? cnaeCodes,
      cnaeDescriptions: result?.cnaeDescriptions ?? [],
      estimatedPresenceLevel: estimatePresenceLevel(cnaeCodes.length),
    };
    setHubCache(cacheKey, ctx);
    return ctx;
  } catch {
    const cnaeCodes = getCnaeCodesForService(serviceId);
    return {
      enabled: cnaeCodes.length > 0,
      cnaeCodes,
      cnaeDescriptions: [],
      estimatedPresenceLevel: estimatePresenceLevel(cnaeCodes.length),
    };
  }
}

function estimatePresenceLevel(cnaeCount: number): 'baixa' | 'media' | 'alta' {
  if (cnaeCount >= 3) return 'alta';
  if (cnaeCount >= 1) return 'media';
  return 'baixa';
}

// ----------------------------------------
// Build Competitor Context
// ----------------------------------------

export function buildCompetitorContext(
  competitorResult?: CompetitorAnalysisResult | null
): CompetitorContext {
  if (!competitorResult?.summary) {
    return { enabled: false };
  }

  const summary = competitorResult.summary;
  return {
    enabled: true,
    priceRange: summary.priceRange,
    median: summary.median,
    average: summary.average,
    min: summary.min,
    max: summary.max,
    sampleSize: summary.sampleSize,
    confidenceLevel: summary.confidenceLevel,
    sources: competitorResult.normalizedPrices.map(normalizedPriceToSourceRef),
    lastUpdated: summary.lastUpdated,
  };
}

function normalizedPriceToSourceRef(p: NormalizedPrice) {
  return {
    url: p.source,
    title: undefined,
    sourceType: p.sourceType,
    capturedAt: p.extractedAt,
  };
}

// ----------------------------------------
// Build Leroy Context
// ----------------------------------------

export function buildLeroyContext(pracaName: string): LeroyStore[] {
  return getLeroyStoresByCity(pracaName);
}

// ----------------------------------------
// Main Hub Function
// ----------------------------------------

/**
 * Executa o hub central de inteligência de pricing.
 * Consolida TODOS os dados em um único objeto de resposta.
 */
export async function runPricingIntelligenceHub(
  input: PricingHubInput
): Promise<PricingHubOutput> {
  const {
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    proposedPrice,
    competitorResult,
    signal,
  } = input;

  // 1. Resolve sensitivity
  const sensitivity = resolveSensitivity(serviceId, serviceName);

  // 2. Load weather (cached)
  const weather = await loadWeatherData(pracaId, pracaName, serviceId, signal);

  // 3. Load territorial
  const territorial = loadTerritorialData(pracaName);

  // 4. Build CNAE context (non-blocking)
  let cnaeContext: CnaeContext;
  try {
    cnaeContext = await buildCnaeContext(serviceId);
  } catch {
    cnaeContext = { enabled: false };
  }

  // 5. Build competitor context
  const competitorContext = buildCompetitorContext(competitorResult);

  // 6. Leroy stores nearby
  const leroyStores = buildLeroyContext(pracaName);

  // 7. Run analysis engine
  const analysisInput: PricingAnalysisInput = {
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    proposedPrice,
  };

  const context = runPricingAnalysisEngine(
    analysisInput,
    weather,
    territorial,
    sensitivity
  );

  // 8. Build unified context
  const unified: PricingUnifiedContext = {
    service: serviceName,
    serviceId,
    city: pracaName,
    price: currentPrice,
    proposedPrice,
    climate: context.climateContext,
    seasonality: context.seasonalityContext,
    territorial: context.marketContext,
    cnae: cnaeContext,
    meiDensity: {
      total: context.marketContext.relatedMEIs,
      offerPressure: context.marketContext.offerPressure,
    },
    competitor: competitorContext,
    leroyStoresNearby: leroyStores,
    recommendation: context.recommendation,
    executiveSummary: context.executiveSummary,
    alerts: context.alerts,
  };

  return {
    context,
    unified,
    weather,
    territorial,
    sensitivity,
    cnaeContext,
    competitorContext,
    leroyStores,
  };
}

// ----------------------------------------
// Invalidate hub cache for a context change
// ----------------------------------------

export function invalidateHubCache(pracaId: string, serviceId: string): void {
  const weatherKey = buildCacheKey(pracaId, serviceId, 'weather');
  analysisCache.invalidate(weatherKey);
  hubCache.delete(`hub_cnae_${serviceId}`);
}
