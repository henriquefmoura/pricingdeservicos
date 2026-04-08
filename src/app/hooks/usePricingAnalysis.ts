// ========================================
// usePricingAnalysis Hook — Refactored
// ========================================
// Hook principal do painel de Inteligência de Mercado para Pricing.
// Agora consome o PricingIntelligenceHub como camada central de dados.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  PricingAnalysisDecisionContext,
  PricingUnifiedContext,
  CompetitorContext,
  CnaeContext,
} from '../types/pricingAnalysis';
import type { CompetitorAnalysisResult } from '../types/competitor';
import type { LeroyStore } from '../types/territorial';
import type { ServiceClimateSensitivity } from '../types/pricingClimate';
import type { WeatherSummary } from '../types/weather';
import type { TerritorialInsightSummary } from '../types/territorial';

import {
  invalidateHubCache,
  resolveSensitivity,
  loadWeatherData,
  loadTerritorialData,
  buildCompetitorContext,
  buildLeroyContext,
  buildCnaeContext,
} from '../services/core/pricingIntelligenceHub';
import { runPricingAnalysisEngine } from '../services/pricingAnalysisEngine';

// ----------------------------------------
// Configuration
// ----------------------------------------

const DEBOUNCE_MS = 400;

// ----------------------------------------
// Interface
// ----------------------------------------

export interface UsePricingAnalysisParams {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  enabled?: boolean;
  competitorResult?: CompetitorAnalysisResult | null;
}

export interface UsePricingAnalysisReturn {
  proposedPrice: number;
  setProposedPrice: (price: number) => void;
  context: PricingAnalysisDecisionContext | null;
  unified: PricingUnifiedContext | null;
  competitorContext: CompetitorContext;
  cnaeContext: CnaeContext | null;
  leroyStores: LeroyStore[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook principal para o painel de análise de pricing.
 * Consome o PricingIntelligenceHub para dados unificados.
 */
export function usePricingAnalysis(
  params: UsePricingAnalysisParams
): UsePricingAnalysisReturn {
  const {
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    enabled = true,
    competitorResult,
  } = params;

  // State
  const [proposedPrice, setProposedPrice] = useState<number>(currentPrice);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [territorial, setTerritorial] = useState<TerritorialInsightSummary | null>(null);
  const [context, setContext] = useState<PricingAnalysisDecisionContext | null>(null);
  const [unified, setUnified] = useState<PricingUnifiedContext | null>(null);
  const [competitorCtx, setCompetitorCtx] = useState<CompetitorContext>({ enabled: false });
  const [cnaeCtx, setCnaeCtx] = useState<CnaeContext | null>(null);
  const [leroyStores, setLeroyStores] = useState<LeroyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve sensitivity
  const sensitivity = useMemo<ServiceClimateSensitivity>(() => {
    return resolveSensitivity(serviceId, serviceName);
  }, [serviceId, serviceName]);

  // Reset proposed price when currentPrice changes
  useEffect(() => {
    setProposedPrice(currentPrice);
  }, [currentPrice]);

  // ----------------------------------------
  // Load external data via hub
  // ----------------------------------------

  const loadData = useCallback(async () => {
    if (!enabled || !pracaName) return;

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Load weather (cached)
      const weatherData = await loadWeatherData(
        pracaId,
        pracaName,
        serviceId,
        abortRef.current.signal
      );
      setWeather(weatherData);

      // Load territorial
      const territorialData = await loadTerritorialData(pracaName, serviceId);
      setTerritorial(territorialData);

      // Build CNAE context (non-blocking)
      buildCnaeContext(serviceId)
        .then(setCnaeCtx)
        .catch(() => setCnaeCtx({ enabled: false }));

      // Leroy stores
      setLeroyStores(buildLeroyContext(pracaName));

      if (!weatherData) {
        setError('Dados climáticos indisponíveis. Análise parcial baseada em dados territoriais.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      // Fallback: continue without weather data
      setWeather(null);
      const territorialData = await loadTerritorialData(pracaName, serviceId);
      setTerritorial(territorialData);
      setLeroyStores(buildLeroyContext(pracaName));
      setError('Dados climáticos indisponíveis. Análise parcial baseada em dados territoriais.');
    } finally {
      setLoading(false);
    }
  }, [enabled, pracaId, pracaName, serviceId]);

  // Load data when plaza changes
  useEffect(() => {
    loadData();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadData]);

  // ----------------------------------------
  // Update competitor context when result changes
  // ----------------------------------------

  useEffect(() => {
    setCompetitorCtx(buildCompetitorContext(competitorResult));
  }, [competitorResult]);

  // ----------------------------------------
  // Recalculate with debounce
  // ----------------------------------------

  useEffect(() => {
    if (!enabled) {
      setContext(null);
      setUnified(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const input = {
        serviceId,
        serviceName,
        pracaId,
        pracaName,
        currentPrice,
        proposedPrice,
      };

      const result = runPricingAnalysisEngine(
        input,
        weather,
        territorial,
        sensitivity
      );

      setContext(result);

      // Build unified context
      const compCtx = buildCompetitorContext(competitorResult);
      setCompetitorCtx(compCtx);

      const unifiedCtx: PricingUnifiedContext = {
        service: serviceName,
        serviceId,
        city: pracaName,
        price: currentPrice,
        proposedPrice,
        climate: result.climateContext,
        seasonality: result.seasonalityContext,
        territorial: result.marketContext,
        cnae: cnaeCtx,
        meiDensity: {
          total: result.marketContext.relatedMEIs,
          offerPressure: result.marketContext.offerPressure,
        },
        competitor: compCtx,
        leroyStoresNearby: leroyStores,
        recommendation: result.recommendation,
        executiveSummary: result.executiveSummary,
        alerts: result.alerts,
      };

      setUnified(unifiedCtx);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    enabled,
    weather,
    territorial,
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    proposedPrice,
    sensitivity,
    competitorResult,
    cnaeCtx,
    leroyStores,
  ]);

  // ----------------------------------------
  // Manual refresh
  // ----------------------------------------

  const refresh = useCallback(async () => {
    invalidateHubCache(pracaId, serviceId);
    await loadData();
  }, [pracaId, serviceId, loadData]);

  return {
    proposedPrice,
    setProposedPrice,
    context,
    unified,
    competitorContext: competitorCtx,
    cnaeContext: cnaeCtx,
    leroyStores,
    loading,
    error,
    refresh,
  };
}
