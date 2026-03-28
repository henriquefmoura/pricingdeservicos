// ========================================
// Climate Analysis Service
// ========================================
// Adapter que encapsula dados climáticos para o motor de análise.

import type { WeatherSummary } from '../types/weather';
import type { PricingAnalysisDecisionContext, ClimateForecastDay } from '../types/pricingAnalysis';
import type { ServiceClimateSensitivity } from '../types/pricingClimate';

export interface ClimateAnalysisResult {
  enabled: boolean;
  currentTemperature?: number | null;
  apparentTemperature?: number | null;
  precipitation?: number | null;
  windSpeed?: number | null;
  weatherSummary?: string;
  forecastSignal?: PricingAnalysisDecisionContext['climateContext']['forecastSignal'];
  climateImpactLevel?: PricingAnalysisDecisionContext['climateContext']['climateImpactLevel'];
  forecastDays?: ClimateForecastDay[];
}

/**
 * Analisa dados climáticos e retorna contexto para o motor de pricing.
 */
export function analyzeClimateForPricing(
  weather: WeatherSummary | null,
  sensitivity?: ServiceClimateSensitivity | null
): ClimateAnalysisResult {
  if (!weather) {
    return { enabled: false };
  }

  const forecastDays: ClimateForecastDay[] = weather.forecast.map((f) => ({
    date: f.date,
    tempMax: f.max,
    tempMin: f.min,
    precipitationSum: f.precipitationSum,
    weatherCode: f.weatherCode,
  }));

  const forecastSignal = determineForecastSignal(weather, sensitivity);
  const impactLevel = determineClimateImpactLevel(weather, sensitivity);
  const weatherSummary = buildWeatherSummary(weather);

  return {
    enabled: true,
    currentTemperature: weather.current.temperature,
    apparentTemperature: weather.current.apparentTemperature,
    precipitation: weather.current.precipitation,
    windSpeed: weather.current.windSpeed,
    weatherSummary,
    forecastSignal,
    climateImpactLevel: impactLevel,
    forecastDays,
  };
}

function determineForecastSignal(
  weather: WeatherSummary,
  sensitivity?: ServiceClimateSensitivity | null
): 'favoravel' | 'neutro' | 'desfavoravel' {
  if (!sensitivity || sensitivity.sensitivityLevel === 'nenhuma') return 'neutro';

  const avgMaxForecast =
    weather.forecast.length > 0
      ? weather.forecast.reduce((sum, f) => sum + (f.max ?? 0), 0) / weather.forecast.length
      : null;

  if (avgMaxForecast == null) return 'neutro';

  const totalRain = weather.forecast.reduce((sum, f) => sum + (f.precipitationSum ?? 0), 0);

  // Check if forecast conditions match service drivers
  const drivers = sensitivity.drivers;
  let favorable = 0;
  let unfavorable = 0;

  if (drivers.includes('calor')) {
    if (avgMaxForecast >= 30) favorable++;
    else if (avgMaxForecast < 22) unfavorable++;
  }

  if (drivers.includes('frio')) {
    if (avgMaxForecast <= 15) favorable++;
    else if (avgMaxForecast > 28) unfavorable++;
  }

  if (drivers.includes('chuva')) {
    if (totalRain >= 5) favorable++;
    else if (totalRain < 1) unfavorable++;
  }

  if (favorable > unfavorable) return 'favoravel';
  if (unfavorable > favorable) return 'desfavoravel';
  return 'neutro';
}

function determineClimateImpactLevel(
  weather: WeatherSummary,
  sensitivity?: ServiceClimateSensitivity | null
): 'baixo' | 'medio' | 'alto' {
  if (!sensitivity) return 'baixo';

  switch (sensitivity.sensitivityLevel) {
    case 'alta':
      return 'alto';
    case 'media':
      return 'medio';
    default:
      return 'baixo';
  }
}

function buildWeatherSummary(weather: WeatherSummary): string {
  const temp = weather.current.temperature;
  const precip = weather.current.precipitation;

  const parts: string[] = [];

  if (temp != null) {
    if (temp >= 30) parts.push('Calor intenso');
    else if (temp >= 25) parts.push('Temperatura elevada');
    else if (temp >= 18) parts.push('Temperatura agradável');
    else if (temp >= 10) parts.push('Temperatura amena');
    else parts.push('Frio intenso');
  }

  if (precip != null && precip > 0) {
    if (precip >= 10) parts.push('chuva forte');
    else if (precip >= 2) parts.push('chuva moderada');
    else parts.push('chuva leve');
  }

  if (weather.current.windSpeed != null && weather.current.windSpeed >= 30) {
    parts.push('vento forte');
  }

  return parts.length > 0 ? parts.join(', ') : 'Condições normais';
}
