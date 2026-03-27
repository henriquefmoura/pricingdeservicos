// ========================================
// useWeather — Custom Hook
// ========================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WeatherSummary, DateRangePreset } from '../types/weather';
import { getWeatherBundle } from '../services/weatherService';

interface UseWeatherOptions {
  /** Cidade / praça inicial */
  initialCity?: string;
  /** Coordenadas pré-definidas */
  latitude?: number;
  longitude?: number;
  /** Preset inicial */
  initialPreset?: DateRangePreset;
  /** Auto-fetch ao inicializar */
  autoFetch?: boolean;
}

interface UseWeatherReturn {
  loading: boolean;
  error: string | null;
  summary: WeatherSummary | null;
  selectedCity: string;
  selectedPreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
  setSelectedCity: (city: string) => void;
  setSelectedPreset: (preset: DateRangePreset) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  fetchWeather: (city?: string, lat?: number, lon?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWeather(options: UseWeatherOptions = {}): UseWeatherReturn {
  const {
    initialCity = '',
    latitude,
    longitude,
    initialPreset = '30d',
    autoFetch = false,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(initialPreset);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const fetchWeather = useCallback(
    async (city?: string, lat?: number, lon?: number) => {
      const targetCity = city ?? selectedCity;
      if (!targetCity.trim() && lat == null) return;

      // Cancela requisição anterior
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await getWeatherBundle({
          city: targetCity,
          latitude: lat,
          longitude: lon,
          preset: selectedPreset,
          customStartDate: selectedPreset === 'custom' ? customStartDate : undefined,
          customEndDate: selectedPreset === 'custom' ? customEndDate : undefined,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSummary(result);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar os dados climáticos agora. Tente novamente em instantes.';

        if (!controller.signal.aborted) {
          setError(message);
          setSummary(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [selectedCity, selectedPreset, customStartDate, customEndDate]
  );

  const refresh = useCallback(() => {
    return fetchWeather(selectedCity, summary?.latitude, summary?.longitude);
  }, [fetchWeather, selectedCity, summary?.latitude, summary?.longitude]);

  // Auto-fetch quando o preset muda e já há dados
  useEffect(() => {
    if (summary && selectedCity) {
      fetchWeather(selectedCity, summary.latitude, summary.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, customStartDate, customEndDate]);

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch && initialCity) {
      fetchWeather(initialCity, latitude, longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    loading,
    error,
    summary,
    selectedCity,
    selectedPreset,
    customStartDate,
    customEndDate,
    setSelectedCity,
    setSelectedPreset,
    setCustomStartDate,
    setCustomEndDate,
    fetchWeather,
    refresh,
  };
}
