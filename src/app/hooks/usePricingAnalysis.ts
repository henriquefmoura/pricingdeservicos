// ========================================
// usePricingAnalysis Hook
// ========================================
// Hook principal do painel de Inteligência de Mercado para Pricing.
// Orquestra carregamento de dados e cálculo em tempo real.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { WeatherSummary } from '../types/weather';
import type { TerritorialInsightSummary } from '../types/territorial';
import type { ServiceClimateSensitivity } from '../types/pricingClimate';
import type {
  PricingAnalysisDecisionContext,
  PricingAnalysisInput,
} from '../types/pricingAnalysis';

import { getWeatherBundle } from '../services/weatherService';
import { runPricingAnalysisEngine } from '../services/pricingAnalysisEngine';
import { getMockTerritorialData } from '../services/territorialAnalysisService';
import { getSensitivityByServiceId, findSensitivityByName } from '../services/serviceSensitivityService';
import { analysisCache, buildCacheKey } from '../utils/pricingAnalysisCache';

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
}

export interface UsePricingAnalysisReturn {
  proposedPrice: number;
  setProposedPrice: (price: number) => void;
  context: PricingAnalysisDecisionContext | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook principal para o painel de análise de pricing.
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
  } = params;

  // State
  const [proposedPrice, setProposedPrice] = useState<number>(currentPrice);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [territorial, setTerritorial] = useState<TerritorialInsightSummary | null>(null);
  const [context, setContext] = useState<PricingAnalysisDecisionContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weatherCacheRef = useRef<Record<string, WeatherSummary>>({});

  // Resolve sensitivity
  const sensitivity = useMemo<ServiceClimateSensitivity>(() => {
    const byId = getSensitivityByServiceId(serviceId);
    if (byId.sensitivityLevel !== 'nenhuma') return byId;
    const byName = findSensitivityByName(serviceName);
    return byName ?? byId;
  }, [serviceId, serviceName]);

  // Reset proposed price when currentPrice changes
  useEffect(() => {
    setProposedPrice(currentPrice);
  }, [currentPrice]);

  // ----------------------------------------
  // Load external data
  // ----------------------------------------

  const loadData = useCallback(async () => {
    if (!enabled || !pracaName) return;

    // Check analysis cache
    const cacheKey = buildCacheKey(pracaId, serviceId, 'weather');
    const cachedWeather = analysisCache.get<WeatherSummary>(cacheKey);

    if (cachedWeather) {
      setWeather(cachedWeather);
      // Load territorial (using mock as default since IBGE APIs may be unavailable)
      const mockTerritorial = getMockTerritorialData(pracaName);
      setTerritorial(mockTerritorial);
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Load weather
      const weatherSummary = await getWeatherBundle({
        city: pracaName,
        preset: '30d',
        signal: abortRef.current.signal,
      });

      weatherCacheRef.current[pracaId] = weatherSummary;
      analysisCache.set(cacheKey, weatherSummary);
      setWeather(weatherSummary);

      // Load territorial (using mock as fallback)
      const mockTerritorial = getMockTerritorialData(pracaName);
      setTerritorial(mockTerritorial);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      // Fallback: continue without weather data
      setWeather(null);
      const mockTerritorial = getMockTerritorialData(pracaName);
      setTerritorial(mockTerritorial);
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
  // Recalculate with debounce
  // ----------------------------------------

  useEffect(() => {
    if (!enabled) {
      setContext(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const input: PricingAnalysisInput = {
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
  ]);

  // ----------------------------------------
  // Manual refresh
  // ----------------------------------------

  const refresh = useCallback(async () => {
    const cacheKey = buildCacheKey(pracaId, serviceId, 'weather');
    analysisCache.invalidate(cacheKey);
    delete weatherCacheRef.current[pracaId];
    await loadData();
  }, [pracaId, serviceId, loadData]);

  return {
    proposedPrice,
    setProposedPrice,
    context,
    loading,
    error,
    refresh,
  };
}
