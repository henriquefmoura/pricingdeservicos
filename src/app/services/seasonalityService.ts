// ========================================
// Seasonality Service
// ========================================
// Serviço de sazonalidade — delega cálculos ao seasonalityCalculator
// e encapsula a lógica de obtenção de dados climáticos.

import type { WeatherSummary } from '../types/weather';
import type { SeasonalityAnalysis, ServiceClimateSensitivity } from '../types/pricingClimate';
import { calculateSeasonality } from '../utils/seasonalityCalculator';

/**
 * Analisa a sazonalidade de um serviço com base nos dados climáticos.
 */
export function analyzeSeasonality(
  weather: WeatherSummary,
  sensitivity: ServiceClimateSensitivity
): SeasonalityAnalysis {
  return calculateSeasonality(weather, sensitivity);
}

/**
 * Retorna o label do mês atual em pt-BR.
 */
export function getCurrentMonthLabel(): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[new Date().getMonth()];
}

/**
 * Verifica se um determinado mês é historicamente forte para um driver.
 */
export function isHighSeasonMonth(month: number, driver: ServiceClimateSensitivity['drivers'][number]): boolean {
  const highHeatMonths = [10, 11, 0, 1, 2]; // Nov–Mar
  const highColdMonths = [4, 5, 6, 7]; // Mai–Ago
  const highRainMonths = [10, 11, 0, 1, 2, 3]; // Nov–Abr

  switch (driver) {
    case 'calor': return highHeatMonths.includes(month);
    case 'frio': return highColdMonths.includes(month);
    case 'chuva': return highRainMonths.includes(month);
    case 'umidade': return highRainMonths.includes(month);
    case 'vento': return false; // Vento não tem sazonalidade forte no Brasil
    case 'amplitude_termica': return [3, 4, 8, 9].includes(month); // Outono/Primavera
    default: return false;
  }
}
