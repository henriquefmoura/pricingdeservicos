// ========================================
// usePricingClimateAdvisor Hook
// ========================================
// Hook que gerencia o motor de recomendação em tempo real.
// - Aplica debounce no preço digitado.
// - Carrega e cacheia dados climáticos por praça.
// - Recalcula a recomendação a cada mudança de preço.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { WeatherSummary } from '../types/weather';
import type {
  PricingContextInput,
  PricingDecisionSupportOutput,
  ServiceClimateSensitivity,
} from '../types/pricingClimate';
import { getWeatherBundle } from '../services/weatherService';
import { runPricingClimateEngine } from '../services/pricingClimateEngine';
import { getSensitivityByServiceId, findSensitivityByName } from '../services/serviceSensitivityService';

// ----------------------------------------
// Configuração
// ----------------------------------------

const DEBOUNCE_MS = 400;

// ----------------------------------------
// Interface pública
// ----------------------------------------

export interface UsePricingClimateAdvisorParams {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  /** Latitude da praça (opcional — se não informado, faz geocoding) */
  latitude?: number;
  /** Longitude da praça (opcional) */
  longitude?: number;
  /** Override de sensibilidade do serviço */
  sensitivityOverride?: ServiceClimateSensitivity;
  /** Habilita ou desabilita o motor */
  enabled?: boolean;
}

export interface UsePricingClimateAdvisorReturn {
  /** Preço proposto pelo usuário (atualizado a cada onChange) */
  proposedPrice: number;
  /** Atualizar preço proposto */
  setProposedPrice: (price: number) => void;
  /** Saída consolidada do motor */
  output: PricingDecisionSupportOutput | null;
  /** Dados climáticos carregados */
  weather: WeatherSummary | null;
  /** Sensibilidade do serviço resolvida */
  sensitivity: ServiceClimateSensitivity;
  /** Se o motor está carregando dados climáticos */
  loadingWeather: boolean;
  /** Se o motor está calculando a recomendação */
  computing: boolean;
  /** Erro ao carregar dados climáticos */
  error: string | null;
  /** Força recarga dos dados climáticos */
  refreshWeather: () => Promise<void>;
}

/**
 * Hook principal do motor de recomendação climática para pricing.
 */
export function usePricingClimateAdvisor(
  params: UsePricingClimateAdvisorParams
): UsePricingClimateAdvisorReturn {
  const {
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    latitude,
    longitude,
    sensitivityOverride,
    enabled = true,
  } = params;

  // Estado
  const [proposedPrice, setProposedPrice] = useState<number>(currentPrice);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [output, setOutput] = useState<PricingDecisionSupportOutput | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weatherCacheRef = useRef<Record<string, WeatherSummary>>({});

  // Resolver sensibilidade
  const sensitivity = useMemo<ServiceClimateSensitivity>(() => {
    if (sensitivityOverride) return sensitivityOverride;
    const byId = getSensitivityByServiceId(serviceId);
    if (byId.sensitivityLevel !== 'nenhuma') return byId;
    const byName = findSensitivityByName(serviceName);
    return byName ?? byId;
  }, [serviceId, serviceName, sensitivityOverride]);

  // ----------------------------------------
  // Carrega dados climáticos da praça
  // ----------------------------------------

  const fetchWeather = useCallback(async () => {
    if (!enabled || !pracaName) return;

    // Verificar cache in-memory
    const cacheKey = `${pracaId}_${pracaName}`;
    if (weatherCacheRef.current[cacheKey]) {
      setWeather(weatherCacheRef.current[cacheKey]);
      return;
    }

    // Cancelar request anterior
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoadingWeather(true);
    setError(null);

    try {
      const summary = await getWeatherBundle({
        city: pracaName,
        latitude,
        longitude,
        preset: '30d',
        signal: abortRef.current.signal,
      });

      weatherCacheRef.current[cacheKey] = summary;
      setWeather(summary);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados climáticos.');
    } finally {
      setLoadingWeather(false);
    }
  }, [enabled, pracaId, pracaName, latitude, longitude]);

  // Carregar clima quando a praça muda
  useEffect(() => {
    fetchWeather();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchWeather]);

  // ----------------------------------------
  // Recalcular recomendação com debounce
  // ----------------------------------------

  useEffect(() => {
    if (!enabled || !weather) {
      setOutput(null);
      return;
    }

    // Limpar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setComputing(true);

    debounceRef.current = setTimeout(() => {
      const input: PricingContextInput = {
        serviceId,
        serviceName,
        pracaId,
        pracaName,
        currentPrice,
        proposedPrice,
        currency: 'BRL',
        editedAt: new Date().toISOString(),
      };

      const result = runPricingClimateEngine(input, weather, sensitivity);
      setOutput(result);
      setComputing(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    enabled,
    weather,
    serviceId,
    serviceName,
    pracaId,
    pracaName,
    currentPrice,
    proposedPrice,
    sensitivity,
  ]);

  // ----------------------------------------
  // Refresh manual
  // ----------------------------------------

  const refreshWeather = useCallback(async () => {
    const cacheKey = `${pracaId}_${pracaName}`;
    delete weatherCacheRef.current[cacheKey];
    await fetchWeather();
  }, [pracaId, pracaName, fetchWeather]);

  return {
    proposedPrice,
    setProposedPrice,
    output,
    weather,
    sensitivity,
    loadingWeather,
    computing,
    error,
    refreshWeather,
  };
}
