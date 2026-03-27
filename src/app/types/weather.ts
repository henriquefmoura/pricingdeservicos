// ========================================
// Weather Module — Type Definitions
// ========================================

/** Nível de risco operacional */
export type WeatherRiskLevel = 'baixo' | 'moderado' | 'alto';

/** Severidade de um insight */
export type InsightSeverity = 'info' | 'warning' | 'critical';

/** Preset de período histórico */
export type DateRangePreset = '7d' | '30d' | 'lastYear' | 'custom';

// ----------------------------------------
// Geocoding API
// ----------------------------------------

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

// ----------------------------------------
// Forecast API
// ----------------------------------------

export interface ForecastCurrentUnits {
  temperature_2m: string;
  apparent_temperature: string;
  precipitation: string;
  weather_code: string;
  wind_speed_10m: string;
}

export interface ForecastCurrent {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface ForecastDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: ForecastCurrent;
  current_units: ForecastCurrentUnits;
  daily: ForecastDaily;
  generationtime_ms?: number;
}

// ----------------------------------------
// Historical API
// ----------------------------------------

export interface HistoricalDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  temperature_2m_mean: number[];
}

export interface HistoricalResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: HistoricalDaily;
  generationtime_ms?: number;
}

// ----------------------------------------
// Domain Models
// ----------------------------------------

export interface WeatherCurrent {
  temperature: number | null;
  apparentTemperature: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  time?: string;
}

export interface WeatherDailyForecast {
  date: string;
  max: number | null;
  min: number | null;
  precipitationSum: number | null;
  weatherCode: number | null;
}

export interface WeatherHistoricalDaily {
  date: string;
  mean: number | null;
  max: number | null;
  min: number | null;
}

export interface WeatherInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
}

export interface WeatherSummary {
  city: string;
  latitude: number;
  longitude: number;
  current: WeatherCurrent;
  forecast: WeatherDailyForecast[];
  historical: WeatherHistoricalDaily[];
  historicalAverageTemperature: number | null;
  currentVsHistoricalDelta: number | null;
  insights: WeatherInsight[];
  operationalRisk: WeatherRiskLevel;
}

// ----------------------------------------
// Praça (Plaza)
// ----------------------------------------

export interface PlazaOption {
  label: string;
  value: string;
  latitude?: number;
  longitude?: number;
}

// ----------------------------------------
// Cache
// ----------------------------------------

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ----------------------------------------
// Hook state
// ----------------------------------------

export interface UseWeatherState {
  loading: boolean;
  error: string | null;
  summary: WeatherSummary | null;
  selectedCity: string;
  selectedPreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
}
