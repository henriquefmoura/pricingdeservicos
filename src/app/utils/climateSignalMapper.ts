// ========================================
// Climate Signal Mapper
// ========================================
// Transforma dados climáticos (WeatherSummary) em sinais
// consumíveis pelo motor de pricing.

import type { WeatherSummary } from '../types/weather';
import type {
  ClimateDriver,
  ClimateSignal,
  ClimateSignalAnalysis,
  ServiceClimateSensitivity,
} from '../types/pricingClimate';
import { getWeatherInfo } from './weatherMapper';

// ----------------------------------------
// Thresholds (configuráveis)
// ----------------------------------------

const TEMP_HIGH_THRESHOLD = 30;
const TEMP_LOW_THRESHOLD = 15;
const PRECIPITATION_THRESHOLD = 5; // mm
const WIND_THRESHOLD = 30; // km/h
const HUMIDITY_PROXY_RAIN_THRESHOLD = 10; // mm — usado como proxy de umidade
const AMPLITUDE_THRESHOLD = 12; // °C

/**
 * Analisa os dados climáticos e retorna um sinal consolidado
 * para o motor de recomendação, levando em conta a sensibilidade do serviço.
 */
export function mapClimateSignal(
  weather: WeatherSummary,
  sensitivity: ServiceClimateSensitivity
): ClimateSignalAnalysis {
  const activeDrivers = detectActiveDrivers(weather);
  const matchingDrivers = activeDrivers.filter((d) => sensitivity.drivers.includes(d));
  const signal = determineSignal(weather, sensitivity, matchingDrivers);

  const weatherInfo = getWeatherInfo(weather.current.weatherCode);

  return {
    signal,
    currentTemperature: weather.current.temperature,
    historicalAverage: weather.historicalAverageTemperature,
    temperatureDelta: weather.currentVsHistoricalDelta,
    precipitationRisk: activeDrivers.includes('chuva'),
    windRisk: activeDrivers.includes('vento'),
    activeDrivers: matchingDrivers,
    label: weatherInfo.label,
  };
}

/**
 * Detecta quais drivers climáticos estão ativos com base nos dados atuais.
 */
function detectActiveDrivers(weather: WeatherSummary): ClimateDriver[] {
  const drivers: ClimateDriver[] = [];
  const temp = weather.current.temperature;

  if (temp != null && temp >= TEMP_HIGH_THRESHOLD) {
    drivers.push('calor');
  }

  if (temp != null && temp <= TEMP_LOW_THRESHOLD) {
    drivers.push('frio');
  }

  // Precipitação atual ou previsão significativa
  const hasPrecipitation =
    (weather.current.precipitation != null && weather.current.precipitation >= PRECIPITATION_THRESHOLD) ||
    weather.forecast.some((f) => f.precipitationSum != null && f.precipitationSum >= PRECIPITATION_THRESHOLD);

  if (hasPrecipitation) {
    drivers.push('chuva');
  }

  if (weather.current.windSpeed != null && weather.current.windSpeed >= WIND_THRESHOLD) {
    drivers.push('vento');
  }

  // Umidade: proxy via precipitação acumulada
  const totalPrecip = weather.forecast.reduce(
    (sum, f) => sum + (f.precipitationSum ?? 0),
    0
  );
  if (totalPrecip >= HUMIDITY_PROXY_RAIN_THRESHOLD) {
    drivers.push('umidade');
  }

  // Amplitude térmica
  if (weather.historical.length > 0) {
    const amplitudes = weather.historical
      .filter((d) => d.max != null && d.min != null)
      .map((d) => d.max! - d.min!);

    if (amplitudes.length > 0) {
      const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
      if (avgAmplitude >= AMPLITUDE_THRESHOLD) {
        drivers.push('amplitude_termica');
      }
    }
  }

  return drivers;
}

/**
 * Determina o sinal climático (favorável, neutro, desfavorável)
 * considerando os drivers do serviço e as condições climáticas.
 */
function determineSignal(
  weather: WeatherSummary,
  sensitivity: ServiceClimateSensitivity,
  matchingDrivers: ClimateDriver[]
): ClimateSignal {
  if (sensitivity.sensitivityLevel === 'nenhuma') return 'neutro';

  // Verifica se a previsão indica melhora de condições para o serviço
  const forecastFavorable = isForecastFavorable(weather, sensitivity.drivers);
  const forecastUnfavorable = isForecastUnfavorable(weather, sensitivity.drivers);

  if (matchingDrivers.length === 0 && !forecastFavorable && !forecastUnfavorable) {
    return 'neutro';
  }

  // Serviços sensíveis a calor: temperatura alta é favorável para demanda
  if (sensitivity.drivers.includes('calor') && matchingDrivers.includes('calor')) {
    return 'favoravel';
  }

  // Serviços sensíveis a frio: temperatura baixa é favorável para demanda
  if (sensitivity.drivers.includes('frio') && matchingDrivers.includes('frio')) {
    return 'favoravel';
  }

  // Serviços sensíveis a chuva: chuva pode ser favorável (impermeabilização) ou desfavorável (pintura)
  if (sensitivity.drivers.includes('chuva') && matchingDrivers.includes('chuva')) {
    return 'favoravel';
  }

  if (forecastFavorable) return 'favoravel';
  if (forecastUnfavorable) return 'desfavoravel';

  return 'neutro';
}

/**
 * Verifica se a previsão dos próximos dias é favorável para os drivers do serviço.
 */
function isForecastFavorable(
  weather: WeatherSummary,
  drivers: ClimateDriver[]
): boolean {
  if (weather.forecast.length === 0) return false;

  const avgMaxForecast =
    weather.forecast.reduce((sum, f) => sum + (f.max ?? 0), 0) / weather.forecast.length;

  if (drivers.includes('calor') && avgMaxForecast >= TEMP_HIGH_THRESHOLD) return true;
  if (drivers.includes('frio') && avgMaxForecast <= TEMP_LOW_THRESHOLD) return true;

  const totalRain = weather.forecast.reduce(
    (sum, f) => sum + (f.precipitationSum ?? 0),
    0
  );
  if (drivers.includes('chuva') && totalRain >= PRECIPITATION_THRESHOLD) return true;

  return false;
}

/**
 * Verifica se a previsão dos próximos dias é desfavorável para os drivers do serviço.
 */
function isForecastUnfavorable(
  weather: WeatherSummary,
  drivers: ClimateDriver[]
): boolean {
  if (weather.forecast.length === 0) return false;

  const avgMaxForecast =
    weather.forecast.reduce((sum, f) => sum + (f.max ?? 0), 0) / weather.forecast.length;

  // Serviço de calor em clima frio = demanda potencialmente baixa
  if (drivers.includes('calor') && avgMaxForecast < 22) return true;
  // Serviço de frio em clima quente = demanda potencialmente baixa
  if (drivers.includes('frio') && avgMaxForecast > 28) return true;

  return false;
}
