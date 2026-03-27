// ========================================
// Weather Service — Open-Meteo Integration
// ========================================

import type {
  GeocodingResponse,
  GeocodingResult,
  ForecastResponse,
  HistoricalResponse,
  WeatherSummary,
  WeatherDailyForecast,
  WeatherHistoricalDaily,
} from '../types/weather';
import { generateWeatherInsights } from '../utils/weatherInsights';
import {
  getCache,
  setCache,
  coordsCacheKey,
  weatherCacheKey,
  COORDS_TTL_MS,
  WEATHER_TTL_MS,
} from '../utils/weatherCache';
import { getDateRange } from '../utils/dateRangePresets';
import type { DateRangePreset } from '../types/weather';

// ----------------------------------------
// Endpoints
// ----------------------------------------

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

// ----------------------------------------
// Geocoding
// ----------------------------------------

/**
 * Busca coordenadas de uma cidade pelo nome, com cache.
 */
export async function searchCityByName(
  city: string,
  signal?: AbortSignal
): Promise<GeocodingResult | null> {
  const trimmed = city.trim();
  if (!trimmed) return null;

  // Verifica cache
  const cacheKey = coordsCacheKey(trimmed);
  const cached = getCache<GeocodingResult>(cacheKey);
  if (cached) return cached;

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=5&language=pt&format=json`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error('Falha ao buscar cidade. Tente novamente.');
  }

  const data: GeocodingResponse = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];

  // Salva no cache
  setCache(cacheKey, result, COORDS_TTL_MS);

  return result;
}

// ----------------------------------------
// Forecast
// ----------------------------------------

/**
 * Busca previsão climática atual e dos próximos dias.
 */
export async function getForecast(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  });

  const response = await fetch(`${FORECAST_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados climáticos agora. Tente novamente em instantes.');
  }

  return response.json();
}

// ----------------------------------------
// Historical
// ----------------------------------------

/**
 * Busca histórico de temperatura para um período.
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<HistoricalResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean',
    timezone: 'auto',
  });

  const response = await fetch(`${ARCHIVE_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados históricos. Tente novamente em instantes.');
  }

  return response.json();
}

// ----------------------------------------
// Bundle — Consolidated Data
// ----------------------------------------

export interface WeatherBundleParams {
  city: string;
  latitude?: number;
  longitude?: number;
  preset: DateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  signal?: AbortSignal;
}

/**
 * Busca e consolida todos os dados climáticos para uma praça:
 * 1. Resolve coordenadas (cache ou geocoding)
 * 2. Busca forecast
 * 3. Busca histórico
 * 4. Gera insights
 * 5. Retorna WeatherSummary
 */
export async function getWeatherBundle(params: WeatherBundleParams): Promise<WeatherSummary> {
  const { city, preset, customStartDate, customEndDate, signal } = params;
  let { latitude, longitude } = params;

  // 1. Resolve coordenadas
  if (latitude == null || longitude == null) {
    const geo = await searchCityByName(city, signal);
    if (!geo) {
      throw new Error('Praça não encontrada. Verifique o nome digitado.');
    }
    latitude = geo.latitude;
    longitude = geo.longitude;
  }

  // 2. Calcula intervalo de datas
  const { startDate, endDate } = getDateRange(preset, customStartDate, customEndDate);

  // 3. Verifica cache para o bundle completo
  const bundleCacheKey = weatherCacheKey(latitude, longitude, startDate, endDate);
  const cachedBundle = getCache<WeatherSummary>(bundleCacheKey);
  if (cachedBundle) return cachedBundle;

  // 4. Busca forecast e histórico em paralelo
  const [forecastData, historicalData] = await Promise.all([
    getForecast(latitude, longitude, signal),
    getHistoricalWeather(latitude, longitude, startDate, endDate, signal).catch(() => null),
  ]);

  // 5. Transforma dados de forecast
  const forecast: WeatherDailyForecast[] = (forecastData.daily.time ?? []).map((date, i) => ({
    date,
    max: forecastData.daily.temperature_2m_max?.[i] ?? null,
    min: forecastData.daily.temperature_2m_min?.[i] ?? null,
    precipitationSum: forecastData.daily.precipitation_sum?.[i] ?? null,
    weatherCode: forecastData.daily.weather_code?.[i] ?? null,
  }));

  // 6. Transforma dados históricos
  const historical: WeatherHistoricalDaily[] = historicalData
    ? (historicalData.daily.time ?? []).map((date, i) => ({
        date,
        mean: historicalData.daily.temperature_2m_mean?.[i] ?? null,
        max: historicalData.daily.temperature_2m_max?.[i] ?? null,
        min: historicalData.daily.temperature_2m_min?.[i] ?? null,
      }))
    : [];

  // 7. Calcula média histórica
  const validMeans = historical.filter((h) => h.mean != null).map((h) => h.mean!);
  const historicalAverageTemperature =
    validMeans.length > 0 ? validMeans.reduce((a, b) => a + b, 0) / validMeans.length : null;

  // 8. Delta atual vs histórico
  const currentTemp = forecastData.current.temperature_2m ?? null;
  const currentVsHistoricalDelta =
    currentTemp != null && historicalAverageTemperature != null
      ? currentTemp - historicalAverageTemperature
      : null;

  // 9. Monta summary parcial (sem insights)
  const partialSummary: WeatherSummary = {
    city,
    latitude,
    longitude,
    current: {
      temperature: currentTemp,
      apparentTemperature: forecastData.current.apparent_temperature ?? null,
      precipitation: forecastData.current.precipitation ?? null,
      windSpeed: forecastData.current.wind_speed_10m ?? null,
      weatherCode: forecastData.current.weather_code ?? null,
      time: forecastData.current.time,
    },
    forecast,
    historical,
    historicalAverageTemperature,
    currentVsHistoricalDelta,
    insights: [],
    operationalRisk: 'baixo',
  };

  // 10. Gera insights
  const { insights, operationalRisk } = generateWeatherInsights(partialSummary);

  const summary: WeatherSummary = {
    ...partialSummary,
    insights,
    operationalRisk,
  };

  // 11. Salva no cache
  setCache(bundleCacheKey, summary, WEATHER_TTL_MS);

  return summary;
}
