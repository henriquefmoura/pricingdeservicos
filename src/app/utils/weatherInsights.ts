// ========================================
// Weather Insights — Business Logic
// ========================================

import type { WeatherInsight, WeatherRiskLevel, WeatherSummary } from '../types/weather';

interface InsightsResult {
  insights: WeatherInsight[];
  operationalRisk: WeatherRiskLevel;
}

// ----------------------------------------
// Thresholds (fáceis de ajustar)
// ----------------------------------------

const DELTA_ABOVE_THRESHOLD = 3; // °C acima da média
const DELTA_BELOW_THRESHOLD = -3; // °C abaixo da média
const HIGH_PRECIPITATION_MM = 10; // mm diário considerado relevante
const HIGH_WIND_KMH = 40; // km/h considerado elevado
const HIGH_AMPLITUDE_THRESHOLD = 15; // °C amplitude histórica elevada
const EXTREME_TEMP_HIGH = 35; // °C temperatura extremamente alta
const EXTREME_TEMP_LOW = 5; // °C temperatura extremamente baixa

/**
 * Gera insights automáticos e classifica o risco operacional
 * a partir de um WeatherSummary.
 */
export function generateWeatherInsights(summary: WeatherSummary): InsightsResult {
  const insights: WeatherInsight[] = [];
  let riskScore = 0;

  // 1. Temperatura atual vs média histórica
  if (summary.currentVsHistoricalDelta != null) {
    const delta = summary.currentVsHistoricalDelta;

    if (delta > DELTA_ABOVE_THRESHOLD) {
      insights.push({
        id: 'temp-above-avg',
        title: 'Temperatura acima da média',
        description: `A praça está ${delta.toFixed(1)}°C acima da média histórica do período. Isso pode afetar a demanda por serviços sensíveis ao calor.`,
        severity: delta > DELTA_ABOVE_THRESHOLD * 2 ? 'critical' : 'warning',
      });
      riskScore += delta > DELTA_ABOVE_THRESHOLD * 2 ? 2 : 1;
    }

    if (delta < DELTA_BELOW_THRESHOLD) {
      insights.push({
        id: 'temp-below-avg',
        title: 'Temperatura abaixo da média',
        description: `A praça está ${Math.abs(delta).toFixed(1)}°C abaixo da média histórica do período. Considere impacto em operações externas.`,
        severity: delta < DELTA_BELOW_THRESHOLD * 2 ? 'critical' : 'warning',
      });
      riskScore += delta < DELTA_BELOW_THRESHOLD * 2 ? 2 : 1;
    }
  }

  // 2. Temperatura extrema atual
  if (summary.current.temperature != null) {
    if (summary.current.temperature >= EXTREME_TEMP_HIGH) {
      insights.push({
        id: 'extreme-heat',
        title: 'Calor extremo',
        description: `Temperatura atual de ${summary.current.temperature.toFixed(1)}°C. Atenção redobrada para equipes em campo e condições de trabalho.`,
        severity: 'critical',
      });
      riskScore += 2;
    }

    if (summary.current.temperature <= EXTREME_TEMP_LOW) {
      insights.push({
        id: 'extreme-cold',
        title: 'Frio intenso',
        description: `Temperatura atual de ${summary.current.temperature.toFixed(1)}°C. Considere impacto em operações e deslocamento de equipes.`,
        severity: 'critical',
      });
      riskScore += 2;
    }
  }

  // 3. Precipitação nos próximos dias
  const upcomingRain = summary.forecast
    .filter((d) => d.precipitationSum != null && d.precipitationSum >= HIGH_PRECIPITATION_MM);

  if (upcomingRain.length > 0) {
    const maxRain = Math.max(...upcomingRain.map((d) => d.precipitationSum!));
    insights.push({
      id: 'rain-forecast',
      title: 'Previsão de chuva relevante',
      description: `Há previsão de chuva significativa (até ${maxRain.toFixed(1)} mm/dia) nos próximos dias. Isso pode impactar operações externas e logística.`,
      severity: maxRain > HIGH_PRECIPITATION_MM * 2 ? 'critical' : 'warning',
    });
    riskScore += maxRain > HIGH_PRECIPITATION_MM * 2 ? 2 : 1;
  }

  // 4. Vento elevado
  if (summary.current.windSpeed != null && summary.current.windSpeed >= HIGH_WIND_KMH) {
    insights.push({
      id: 'high-wind',
      title: 'Vento forte',
      description: `Vento atual de ${summary.current.windSpeed.toFixed(1)} km/h. Pode interferir em atividades externas, instalações e transporte.`,
      severity: summary.current.windSpeed >= HIGH_WIND_KMH * 1.5 ? 'critical' : 'warning',
    });
    riskScore += summary.current.windSpeed >= HIGH_WIND_KMH * 1.5 ? 2 : 1;
  }

  // 5. Amplitude térmica histórica
  if (summary.historical.length > 0) {
    const validHistorical = summary.historical.filter(
      (d) => d.max != null && d.min != null
    );

    if (validHistorical.length > 0) {
      const amplitudes = validHistorical.map((d) => d.max! - d.min!);
      const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;

      if (avgAmplitude >= HIGH_AMPLITUDE_THRESHOLD) {
        insights.push({
          id: 'high-amplitude',
          title: 'Instabilidade térmica',
          description: `A oscilação térmica histórica média da praça é de ${avgAmplitude.toFixed(1)}°C. A instabilidade pode afetar planejamento e sazonalidade.`,
          severity: 'warning',
        });
        riskScore += 1;
      }
    }
  }

  // 6. Precipitação atual
  if (summary.current.precipitation != null && summary.current.precipitation > 0) {
    insights.push({
      id: 'current-rain',
      title: 'Chuva no momento',
      description: `Precipitação atual de ${summary.current.precipitation.toFixed(1)} mm. Atenção para impacto imediato em serviços externos.`,
      severity: summary.current.precipitation >= HIGH_PRECIPITATION_MM ? 'warning' : 'info',
    });
    if (summary.current.precipitation >= HIGH_PRECIPITATION_MM) {
      riskScore += 1;
    }
  }

  // 7. Condições climáticas severas (tempestade)
  if (summary.current.weatherCode != null) {
    const severeWeatherCodes = [95, 96, 99]; // tempestade
    if (severeWeatherCodes.includes(summary.current.weatherCode)) {
      insights.push({
        id: 'severe-weather',
        title: 'Condição climática severa',
        description: 'As condições atuais indicam tempestade. Recomenda-se suspender atividades externas e avaliar impacto operacional.',
        severity: 'critical',
      });
      riskScore += 3;
    }
  }

  // Sem alertas → condições favoráveis
  if (insights.length === 0) {
    insights.push({
      id: 'all-clear',
      title: 'Condições favoráveis',
      description: 'As condições climáticas atuais estão dentro dos parâmetros normais. Sem alertas relevantes para a operação.',
      severity: 'info',
    });
  }

  // Classificação de risco
  let operationalRisk: WeatherRiskLevel = 'baixo';
  if (riskScore >= 4) {
    operationalRisk = 'alto';
  } else if (riskScore >= 2) {
    operationalRisk = 'moderado';
  }

  return { insights, operationalRisk };
}
