// ========================================
// Pricing Recommendation Rules
// ========================================
// Regras legíveis e configuráveis para o motor de recomendação.

import type {
  PriceDeltaResult,
  SeasonalityAnalysis,
  ClimateSignalAnalysis,
  ServiceClimateSensitivity,
  PricingClimateRecommendation,
  RecommendationAlert,
  PricingRecommendationAction,
  AlertSeverity,
} from '../types/pricingClimate';

/**
 * Gera a recomendação completa de pricing baseada nas regras de negócio.
 */
export function generateRecommendation(
  delta: PriceDeltaResult,
  seasonality: SeasonalityAnalysis,
  climateSignal: ClimateSignalAnalysis,
  sensitivity: ServiceClimateSensitivity,
  currentPrice: number
): PricingClimateRecommendation {
  const alerts: RecommendationAlert[] = [];
  let action: PricingRecommendationAction = 'manter';
  let confidence = 50;
  const reasons: string[] = [];

  // ----------------------------------------
  // REGRA 1: Serviço sensível + baixa sazonalidade + aumento
  // ----------------------------------------
  if (
    sensitivity.sensitivityLevel === 'alta' &&
    seasonality.level === 'baixa' &&
    delta.direction === 'aumento'
  ) {
    alerts.push(
      createAlert(
        'alta-sens-baixa-saz-aumento',
        delta.intensity === 'grande' ? 'critical' : 'warning',
        'Você está aumentando o valor em um momento de baixa sazonalidade para esta praça.'
      )
    );
    action = 'revisar';
    confidence = 75;
    reasons.push('O período atual apresenta baixa sazonalidade para um serviço de alta sensibilidade climática.');
  }

  // ----------------------------------------
  // REGRA 2: Serviço sensível + alta sazonalidade/previsão favorável + redução
  // ----------------------------------------
  if (
    (sensitivity.sensitivityLevel === 'alta' || sensitivity.sensitivityLevel === 'media') &&
    (seasonality.level === 'alta' || climateSignal.signal === 'favoravel') &&
    delta.direction === 'reducao'
  ) {
    alerts.push(
      createAlert(
        'alta-sens-alta-saz-reducao',
        delta.intensity === 'grande' ? 'critical' : 'warning',
        'Você está reduzindo o valor em um período historicamente aquecido para este serviço.'
      )
    );
    action = 'revisar';
    confidence = 70;
    reasons.push('A redução de preço ocorre em um momento de maior propensão de demanda.');
  }

  // ----------------------------------------
  // REGRA 3: Previsão climática favorável
  // ----------------------------------------
  if (climateSignal.signal === 'favoravel' && delta.direction !== 'reducao') {
    alerts.push(
      createAlert(
        'previsao-favoravel',
        'info',
        'A previsão climática dos próximos dias sugere aumento potencial de demanda.'
      )
    );
    if (action === 'manter') {
      action = 'aumentar';
      confidence = 60;
    }
    reasons.push('As condições climáticas previstas favorecem a demanda por este serviço.');
  }

  // ----------------------------------------
  // REGRA 4: Histórico indica sensibilidade
  // ----------------------------------------
  if (
    sensitivity.sensitivityLevel === 'alta' &&
    climateSignal.activeDrivers.length > 0
  ) {
    const driversText = climateSignal.activeDrivers.join(', ');
    alerts.push(
      createAlert(
        'historico-sensibilidade',
        'info',
        `O histórico da praça indica sensibilidade relevante entre ${driversText} e procura por este serviço.`
      )
    );
    reasons.push(`Drivers climáticos ativos: ${driversText}.`);
  }

  // ----------------------------------------
  // REGRA 5: Variação grande contrariando contexto
  // ----------------------------------------
  if (delta.intensity === 'grande') {
    const isConflicting =
      (delta.direction === 'aumento' && seasonality.level === 'baixa') ||
      (delta.direction === 'reducao' && seasonality.level === 'alta');

    if (isConflicting) {
      alerts.push(
        createAlert(
          'variacao-grande-conflito',
          'critical',
          'A alteração proposta pode reduzir competitividade em um momento de alta propensão de conversão.'
        )
      );
      action = 'revisar';
      confidence = 80;
      reasons.push('A variação é significativa e contraria o contexto sazonal/climático.');
    }
  }

  // ----------------------------------------
  // REGRA 6: Variação pequena — alerta informativo
  // ----------------------------------------
  if (delta.intensity === 'pequena' && delta.direction !== 'manutencao') {
    const coherent =
      (delta.direction === 'aumento' && seasonality.level !== 'baixa') ||
      (delta.direction === 'reducao' && seasonality.level !== 'alta');

    if (coherent) {
      alerts.push(
        createAlert(
          'variacao-pequena-coerente',
          'info',
          'A alteração está coerente com o contexto climático da praça.'
        )
      );
      action = delta.direction === 'aumento' ? 'aumentar' : 'reduzir';
      confidence = 65;
      reasons.push('A variação é moderada e alinhada ao contexto.');
    }
  }

  // ----------------------------------------
  // REGRA 7: Serviço com baixa sensibilidade climática
  // ----------------------------------------
  if (sensitivity.sensitivityLevel === 'baixa' || sensitivity.sensitivityLevel === 'nenhuma') {
    alerts.push(
      createAlert(
        'baixa-sensibilidade',
        'info',
        'O serviço apresenta baixa correlação climática. A recomendação deve considerar mais fatores comerciais do que meteorológicos.'
      )
    );
    confidence = Math.max(confidence - 20, 30);
    reasons.push('A sensibilidade climática é baixa; fatores comerciais e competitivos têm maior peso.');
  }

  // ----------------------------------------
  // REGRA 8: Condições estáveis — oportunidade de manutenção/aumento
  // ----------------------------------------
  if (
    seasonality.level === 'neutra' &&
    climateSignal.signal === 'neutro' &&
    delta.direction === 'manutencao'
  ) {
    alerts.push(
      createAlert(
        'estabilidade',
        'info',
        'O histórico e a previsão sugerem estabilidade, sem forte pressão sazonal.'
      )
    );
    action = 'manter';
    confidence = 55;
    reasons.push('O cenário atual indica possível espaço para manutenção ou aumento moderado.');
  }

  // ----------------------------------------
  // REGRA 9: Previsão desfavorável + aumento
  // ----------------------------------------
  if (
    climateSignal.signal === 'desfavoravel' &&
    delta.direction === 'aumento' &&
    sensitivity.sensitivityLevel !== 'nenhuma'
  ) {
    alerts.push(
      createAlert(
        'previsao-desfavoravel-aumento',
        'warning',
        'A proposta de aumento merece atenção: o período atual é historicamente fraco para este serviço.'
      )
    );
    if (action !== 'revisar') action = 'revisar';
    confidence = Math.max(confidence, 65);
    reasons.push('A previsão climática desfavorável sugere cautela com aumento de preço.');
  }

  // ----------------------------------------
  // REGRA 10: Queda de preço em cenário de baixa temp/demanda
  // ----------------------------------------
  if (
    delta.direction === 'reducao' &&
    seasonality.level === 'baixa' &&
    climateSignal.signal === 'desfavoravel'
  ) {
    alerts.push(
      createAlert(
        'reducao-baixa-demanda',
        'info',
        'A queda de preço acontece em um cenário de baixa temperatura e demanda historicamente enfraquecida.'
      )
    );
    action = 'reduzir';
    confidence = 60;
    reasons.push('A redução está alinhada com o cenário de baixa demanda.');
  }

  // Se nenhuma regra gerou alertas, criar um default
  if (alerts.length === 0) {
    alerts.push(
      createAlert(
        'sem-alertas',
        'info',
        'Sem alertas relevantes para o contexto atual. A alteração parece neutra.'
      )
    );
  }

  // Faixa sugerida (simplificada)
  const suggestedRange = calculateSuggestedRange(
    currentPrice,
    seasonality,
    climateSignal,
    sensitivity
  );

  return {
    action,
    confidence,
    reason: reasons.length > 0 ? reasons.join(' ') : 'Análise sem conflitos relevantes.',
    alerts,
    seasonalityLevel: seasonality.level,
    climateSensitivityLevel: sensitivity.sensitivityLevel,
    suggestedPriceRange: suggestedRange,
  };
}

// ----------------------------------------
// Helpers
// ----------------------------------------

function createAlert(
  id: string,
  severity: AlertSeverity,
  message: string
): RecommendationAlert {
  return { id, severity, message };
}

/**
 * Calcula uma faixa sugerida de preço (simplificada).
 */
function calculateSuggestedRange(
  currentPrice: number,
  seasonality: SeasonalityAnalysis,
  climateSignal: ClimateSignalAnalysis,
  sensitivity: ServiceClimateSensitivity
): { min: number; max: number } | undefined {
  if (sensitivity.sensitivityLevel === 'nenhuma') return undefined;

  let minFactor = 0.95;
  let maxFactor = 1.05;

  if (seasonality.level === 'alta' && climateSignal.signal === 'favoravel') {
    minFactor = 1.0;
    maxFactor = 1.15;
  } else if (seasonality.level === 'baixa' && climateSignal.signal === 'desfavoravel') {
    minFactor = 0.90;
    maxFactor = 1.0;
  } else if (seasonality.level === 'alta') {
    minFactor = 0.98;
    maxFactor = 1.10;
  } else if (seasonality.level === 'baixa') {
    minFactor = 0.92;
    maxFactor = 1.02;
  }

  // Ajustar pelo peso da sensibilidade
  const weight = sensitivity.recommendationWeight ?? sensitivityToWeight(sensitivity.sensitivityLevel);
  const spread = (maxFactor - minFactor) * weight;
  const center = (minFactor + maxFactor) / 2;

  return {
    min: Math.round(currentPrice * (center - spread / 2) * 100) / 100,
    max: Math.round(currentPrice * (center + spread / 2) * 100) / 100,
  };
}

function sensitivityToWeight(level: ServiceClimateSensitivity['sensitivityLevel']): number {
  switch (level) {
    case 'alta': return 1.0;
    case 'media': return 0.7;
    case 'baixa': return 0.4;
    case 'nenhuma': return 0;
  }
}
