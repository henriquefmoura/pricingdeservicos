// ========================================
// Seasonality Calculator
// ========================================
// Calcula o nível de sazonalidade de um serviço em uma praça
// com base em dados climáticos históricos e previsão.

import type { WeatherSummary } from '../types/weather';
import type {
  SeasonalityLevel,
  SeasonalityAnalysis,
  ForecastTrend,
  ServiceClimateSensitivity,
} from '../types/pricingClimate';

// ----------------------------------------
// Labels de período por mês
// ----------------------------------------

const PERIOD_LABELS: Record<number, string> = {
  0: 'Verão (Janeiro)',
  1: 'Verão (Fevereiro)',
  2: 'Fim de Verão (Março)',
  3: 'Outono (Abril)',
  4: 'Outono (Maio)',
  5: 'Início de Inverno (Junho)',
  6: 'Inverno (Julho)',
  7: 'Inverno (Agosto)',
  8: 'Início de Primavera (Setembro)',
  9: 'Primavera (Outubro)',
  10: 'Primavera (Novembro)',
  11: 'Início de Verão (Dezembro)',
};

// Meses tipicamente de alta demanda para serviços de calor (verão)
const HIGH_HEAT_MONTHS = [10, 11, 0, 1, 2]; // Nov–Mar
// Meses tipicamente de alta demanda para serviços de frio (inverno)
const HIGH_COLD_MONTHS = [4, 5, 6, 7]; // Mai–Ago
// Meses de chuva (verão chuvoso no Brasil)
const HIGH_RAIN_MONTHS = [10, 11, 0, 1, 2, 3]; // Nov–Abr

/**
 * Calcula a sazonalidade do momento atual para um serviço
 * com base nos dados climáticos e na sensibilidade do serviço.
 */
export function calculateSeasonality(
  weather: WeatherSummary,
  sensitivity: ServiceClimateSensitivity
): SeasonalityAnalysis {
  const now = new Date();
  const month = now.getMonth();
  const currentPeriodLabel = PERIOD_LABELS[month] ?? `Mês ${month + 1}`;

  if (sensitivity.sensitivityLevel === 'nenhuma') {
    return {
      level: 'neutra',
      score: 50,
      explanation: 'Este serviço possui sensibilidade climática nula. A sazonalidade climática não influencia significativamente a demanda.',
      currentPeriodLabel,
      historicalAverage: weather.historicalAverageTemperature,
      forecastTrend: determineForecastTrend(weather),
    };
  }

  const seasonalScore = computeSeasonalScore(month, weather, sensitivity);
  const level = scoreToLevel(seasonalScore);
  const forecastTrend = determineForecastTrend(weather);
  const explanation = buildExplanation(level, sensitivity, currentPeriodLabel, weather, forecastTrend);

  return {
    level,
    score: seasonalScore,
    explanation,
    currentPeriodLabel,
    historicalAverage: weather.historicalAverageTemperature,
    forecastTrend,
  };
}

/**
 * Calcula um score de 0 a 100 para a sazonalidade.
 * Score alto = alta sazonalidade (alta demanda esperada).
 */
function computeSeasonalScore(
  month: number,
  weather: WeatherSummary,
  sensitivity: ServiceClimateSensitivity
): number {
  let score = 50; // base neutra

  const drivers = sensitivity.drivers;
  const weight = sensitivityWeight(sensitivity.sensitivityLevel);

  // Componente 1: Período do ano vs drivers do serviço
  if (drivers.includes('calor') && HIGH_HEAT_MONTHS.includes(month)) {
    score += 20 * weight;
  } else if (drivers.includes('calor') && HIGH_COLD_MONTHS.includes(month)) {
    score -= 20 * weight;
  }

  if (drivers.includes('frio') && HIGH_COLD_MONTHS.includes(month)) {
    score += 20 * weight;
  } else if (drivers.includes('frio') && HIGH_HEAT_MONTHS.includes(month)) {
    score -= 20 * weight;
  }

  if (drivers.includes('chuva') && HIGH_RAIN_MONTHS.includes(month)) {
    score += 15 * weight;
  }

  // Componente 2: Temperatura atual vs histórica
  if (weather.currentVsHistoricalDelta != null) {
    const delta = weather.currentVsHistoricalDelta;

    if (drivers.includes('calor') && delta > 3) {
      score += 10 * weight; // Mais quente que o normal = mais demanda para serviços de calor
    } else if (drivers.includes('calor') && delta < -3) {
      score -= 10 * weight;
    }

    if (drivers.includes('frio') && delta < -3) {
      score += 10 * weight; // Mais frio que o normal = mais demanda para serviços de frio
    } else if (drivers.includes('frio') && delta > 3) {
      score -= 10 * weight;
    }
  }

  // Componente 3: Previsão dos próximos dias
  if (weather.forecast.length > 0) {
    const avgMax = weather.forecast.reduce((s, f) => s + (f.max ?? 0), 0) / weather.forecast.length;

    if (drivers.includes('calor') && avgMax >= 30) {
      score += 10 * weight;
    }

    if (drivers.includes('frio') && avgMax <= 15) {
      score += 10 * weight;
    }

    const totalPrecip = weather.forecast.reduce((s, f) => s + (f.precipitationSum ?? 0), 0);
    if (drivers.includes('chuva') && totalPrecip > 20) {
      score += 10 * weight;
    }
  }

  // Clamp entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sensitivityWeight(level: ServiceClimateSensitivity['sensitivityLevel']): number {
  switch (level) {
    case 'alta': return 1.0;
    case 'media': return 0.7;
    case 'baixa': return 0.4;
    case 'nenhuma': return 0;
  }
}

function scoreToLevel(score: number): SeasonalityLevel {
  if (score >= 65) return 'alta';
  if (score >= 35) return 'neutra';
  return 'baixa';
}

/**
 * Determina a tendência da previsão com base nos dados de forecast.
 */
function determineForecastTrend(weather: WeatherSummary): ForecastTrend {
  if (weather.forecast.length < 3) return 'estavel';

  const temps = weather.forecast.map((f) => f.max ?? 0);
  const firstHalf = temps.slice(0, Math.floor(temps.length / 2));
  const secondHalf = temps.slice(Math.floor(temps.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 2) return 'subindo';
  if (diff < -2) return 'caindo';
  return 'estavel';
}

/**
 * Gera explicação textual para a sazonalidade.
 */
function buildExplanation(
  level: SeasonalityLevel,
  sensitivity: ServiceClimateSensitivity,
  periodLabel: string,
  weather: WeatherSummary,
  trend: ForecastTrend
): string {
  const serviceName = sensitivity.serviceName;
  const driverText = sensitivity.drivers.join(', ');

  const parts: string[] = [];

  if (level === 'alta') {
    parts.push(`O período atual (${periodLabel}) é historicamente favorável para "${serviceName}".`);
    parts.push(`Os drivers climáticos relevantes (${driverText}) estão alinhados com a sazonalidade esperada.`);
  } else if (level === 'baixa') {
    parts.push(`O período atual (${periodLabel}) apresenta baixa propensão sazonal para "${serviceName}".`);
    parts.push(`Os fatores climáticos (${driverText}) não favorecem a demanda neste momento.`);
  } else {
    parts.push(`O período atual (${periodLabel}) apresenta sazonalidade neutra para "${serviceName}".`);
  }

  if (weather.currentVsHistoricalDelta != null) {
    const delta = weather.currentVsHistoricalDelta;
    if (Math.abs(delta) > 3) {
      parts.push(
        `A temperatura está ${delta > 0 ? 'acima' : 'abaixo'} da média histórica em ${Math.abs(delta).toFixed(1)}°C.`
      );
    }
  }

  if (trend === 'subindo') {
    parts.push('A previsão indica tendência de aumento de temperatura nos próximos dias.');
  } else if (trend === 'caindo') {
    parts.push('A previsão indica tendência de queda de temperatura nos próximos dias.');
  }

  return parts.join(' ');
}
