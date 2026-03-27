// ========================================
// Pricing Climate Engine
// ========================================
// Motor principal que orquestra sensibilidade, sazonalidade,
// sinais climáticos e regras de recomendação.

import type { WeatherSummary } from '../types/weather';
import type {
  PricingContextInput,
  PricingDecisionSupportOutput,
  ChartDataPoint,
  ServiceClimateSensitivity,
} from '../types/pricingClimate';

import { calculatePriceDelta } from '../utils/priceDelta';
import { mapClimateSignal } from '../utils/climateSignalMapper';
import { generateRecommendation } from '../utils/pricingRecommendationRules';
import { analyzeSeasonality } from './seasonalityService';
import { getSensitivityByServiceId, findSensitivityByName } from './serviceSensitivityService';
import { getWeatherInfo } from '../utils/weatherMapper';

/**
 * Executa o motor de decisão completo.
 * Recebe contexto de pricing + dados climáticos + (opcionalmente) sensibilidade.
 *
 * O weather deve ser pré-carregado e cacheado por praça,
 * evitando chamadas de rede a cada dígito digitado.
 */
export function runPricingClimateEngine(
  input: PricingContextInput,
  weather: WeatherSummary,
  sensitivityOverride?: ServiceClimateSensitivity
): PricingDecisionSupportOutput {
  // 1. Resolver sensibilidade do serviço
  const sensitivity =
    sensitivityOverride ??
    getSensitivityByServiceId(input.serviceId) ??
    findSensitivityByName(input.serviceName) ??
    fallbackSensitivity(input);

  // 2. Calcular delta de preço
  const delta = calculatePriceDelta(input.currentPrice, input.proposedPrice);

  // 3. Analisar sinal climático
  const climateSignal = mapClimateSignal(weather, sensitivity);

  // 4. Analisar sazonalidade
  const seasonality = analyzeSeasonality(weather, sensitivity);

  // 5. Gerar recomendação
  const recommendation = generateRecommendation(
    delta,
    seasonality,
    climateSignal,
    sensitivity,
    input.currentPrice
  );

  // 6. Preparar dados de gráfico
  const chartData = buildChartData(weather);

  // 7. Gerar mensagens consolidadas
  const messages = buildMessages(recommendation, delta, seasonality, climateSignal, sensitivity);

  // 8. Montar saída consolidada
  const weatherLabel = getWeatherInfo(weather.current.weatherCode).label;

  return {
    summary: {
      serviceName: input.serviceName,
      pracaName: input.pracaName,
      currentPrice: input.currentPrice,
      proposedPrice: input.proposedPrice,
      priceDelta: delta.absolute,
      priceDeltaPercent: delta.percent,
    },
    climateContext: {
      sensitivityLevel: sensitivity.sensitivityLevel,
      relevantDrivers: sensitivity.drivers,
      seasonalityLevel: seasonality.level,
      currentWeatherLabel: weatherLabel,
      forecastSignal: climateSignal.signal,
    },
    recommendation,
    chartData,
    messages,
  };
}

// ----------------------------------------
// Helpers internos
// ----------------------------------------

function fallbackSensitivity(input: PricingContextInput): ServiceClimateSensitivity {
  return {
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    sensitivityLevel: 'nenhuma',
    drivers: [],
    notes: 'Serviço sem configuração de sensibilidade climática definida.',
    recommendationWeight: 0,
  };
}

/**
 * Constrói os dados para gráficos a partir do weather summary.
 */
function buildChartData(weather: WeatherSummary): {
  historicalCurve: ChartDataPoint[];
  forecastCurve: ChartDataPoint[];
} {
  const historicalCurve: ChartDataPoint[] = weather.historical.map((d) => ({
    date: d.date,
    value: d.mean,
    label: 'Histórico',
  }));

  const forecastCurve: ChartDataPoint[] = weather.forecast.map((d) => ({
    date: d.date,
    value: d.max != null && d.min != null ? (d.max + d.min) / 2 : d.max,
    label: 'Previsão',
  }));

  return { historicalCurve, forecastCurve };
}

/**
 * Gera mensagens textuais consolidadas para exibição.
 */
function buildMessages(
  recommendation: ReturnType<typeof generateRecommendation>,
  delta: ReturnType<typeof calculatePriceDelta>,
  seasonality: ReturnType<typeof analyzeSeasonality>,
  climateSignal: ReturnType<typeof mapClimateSignal>,
  sensitivity: ServiceClimateSensitivity
): string[] {
  const messages: string[] = [];

  // Mensagem principal da recomendação
  messages.push(recommendation.reason);

  // Adicionar explicação da sazonalidade
  if (seasonality.explanation) {
    messages.push(seasonality.explanation);
  }

  // Mensagem sobre a variação
  if (delta.direction === 'aumento') {
    const pct = Math.abs(delta.percent).toFixed(1);
    messages.push(`Proposta de aumento de ${pct}% sobre o preço atual.`);
  } else if (delta.direction === 'reducao') {
    const pct = Math.abs(delta.percent).toFixed(1);
    messages.push(`Proposta de redução de ${pct}% sobre o preço atual.`);
  }

  // Mensagem sobre sensibilidade
  if (sensitivity.sensitivityLevel !== 'nenhuma') {
    messages.push(
      `Sensibilidade climática: ${sensitivity.sensitivityLevel}. Drivers: ${sensitivity.drivers.join(', ')}.`
    );
  }

  // Mensagem sobre previsão
  if (climateSignal.signal === 'favoravel') {
    messages.push('A previsão dos próximos dias indica condições que podem elevar a procura por este serviço.');
  } else if (climateSignal.signal === 'desfavoravel') {
    messages.push('A previsão dos próximos dias sugere condições menos favoráveis para a demanda deste serviço.');
  }

  return messages;
}
