// ========================================
// Pricing Analysis Rules
// ========================================
// Motor de regras de negócio consolidadas para apoio à formação de preço.

import type {
  PricingAnalysisDecisionContext,
  AnalysisAlert,
  RecommendationAction,
} from '../types/pricingAnalysis';

interface RuleInput {
  priceDirection: 'aumento' | 'reducao' | 'manutencao';
  priceIntensity: 'pequena' | 'moderada' | 'grande';
  priceDeltaPercent: number;
  seasonality: 'alta' | 'neutra' | 'baixa';
  forecastSignal: 'favoravel' | 'neutro' | 'desfavoravel';
  climateImpactLevel: 'baixo' | 'medio' | 'alto';
  incomeLevel: 'baixa' | 'media' | 'alta';
  offerPressure: 'baixa' | 'media' | 'alta';
  pricingProfile: string;
  municipalitySize: string;
  pricePosition: 'abaixo' | 'dentro' | 'acima';
}

interface RuleOutput {
  action: RecommendationAction;
  confidence: number;
  alerts: AnalysisAlert[];
  positiveSignals: string[];
  negativeSignals: string[];
}

/**
 * Executa o motor de regras consolidadas.
 */
export function evaluatePricingRules(input: RuleInput): RuleOutput {
  const alerts: AnalysisAlert[] = [];
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  let action: RecommendationAction = 'manter';
  let confidence = 50;

  // ----------------------------------------
  // REGRA 1: Aumento + baixa sazonalidade + clima desfavorável
  // ----------------------------------------
  if (
    input.priceDirection === 'aumento' &&
    input.seasonality === 'baixa' &&
    input.forecastSignal === 'desfavoravel'
  ) {
    alerts.push({
      id: 'r1-aumento-baixa-saz-clima-desf',
      title: 'Cautela recomendada',
      description: 'Você está aumentando o preço em uma praça com sinais de baixa sazonalidade e previsão climática desfavorável.',
      severity: 'warning',
    });
    action = 'revisar';
    confidence = 75;
    negativeSignals.push('Baixa sazonalidade combinada com clima desfavorável.');
  }

  // ----------------------------------------
  // REGRA 2: Renda alta + oferta baixa + histórico saudável
  // ----------------------------------------
  if (
    input.incomeLevel === 'alta' &&
    input.offerPressure === 'baixa' &&
    (input.pricePosition === 'dentro' || input.pricePosition === 'abaixo')
  ) {
    positiveSignals.push('A renda relativa da praça sustenta posicionamento acima da média.');
    positiveSignals.push('Baixa oferta local abre espaço para preço sustentado.');
    if (action === 'manter') {
      action = 'aumentar';
      confidence = 70;
    }
  }

  // ----------------------------------------
  // REGRA 3: Oferta alta + MEIs + perfil sensível
  // ----------------------------------------
  if (
    input.offerPressure === 'alta' &&
    (input.pricingProfile === 'sensivel_preco' || input.pricingProfile === 'alto_risco')
  ) {
    alerts.push({
      id: 'r3-oferta-alta-sensivel',
      title: 'Pressão competitiva',
      description: 'Os dados públicos indicam maior competitividade local, o que pode limitar espaço para aumento.',
      severity: 'warning',
    });
    negativeSignals.push('Maior pressão competitiva no território.');
    if (input.priceDirection === 'aumento') {
      action = 'revisar';
      confidence = Math.max(confidence, 65);
    }
  }

  // ----------------------------------------
  // REGRA 4: Clima favorável + alta sazonalidade + preço abaixo da média
  // ----------------------------------------
  if (
    input.forecastSignal === 'favoravel' &&
    input.seasonality === 'alta' &&
    input.pricePosition !== 'acima'
  ) {
    positiveSignals.push('Momento favorável: clima e sazonalidade sustentam manutenção ou aumento moderado.');
    alerts.push({
      id: 'r4-clima-fav-saz-alta',
      title: 'Oportunidade identificada',
      description: 'A previsão climática atual e a sazonalidade sustentam preço mais firme nesta praça.',
      severity: 'info',
    });
    if (action === 'manter') {
      action = 'aumentar';
      confidence = 65;
    }
  }

  // ----------------------------------------
  // REGRA 5: Sinais mistos
  // ----------------------------------------
  const totalPositive = positiveSignals.length;
  const totalNegative = negativeSignals.length;
  if (totalPositive > 0 && totalNegative > 0 && action !== 'revisar') {
    alerts.push({
      id: 'r5-sinais-mistos',
      title: 'Sinais mistos',
      description: 'O conjunto de sinais externos apresenta aspectos favoráveis e desfavoráveis. Recomenda-se revisão com atenção.',
      severity: 'info',
    });
    action = 'revisar';
    confidence = 55;
  }

  // ----------------------------------------
  // REGRA 6: Previsão climática desfavorável + aumento
  // ----------------------------------------
  if (
    input.forecastSignal === 'desfavoravel' &&
    input.priceDirection === 'aumento' &&
    input.climateImpactLevel !== 'baixo'
  ) {
    alerts.push({
      id: 'r6-previsao-desfav-aumento',
      title: 'Clima desfavorável',
      description: 'A previsão climática atual não favorece este movimento de preço.',
      severity: 'warning',
    });
    negativeSignals.push('Previsão climática desfavorável para o período.');
    if (action !== 'revisar') {
      action = 'revisar';
      confidence = Math.max(confidence, 60);
    }
  }

  // ----------------------------------------
  // REGRA 7: Variação grande
  // ----------------------------------------
  if (input.priceIntensity === 'grande') {
    alerts.push({
      id: 'r7-variacao-grande',
      title: 'Variação significativa',
      description: `A proposta de ${input.priceDirection === 'aumento' ? 'aumento' : 'redução'} de ${Math.abs(input.priceDeltaPercent).toFixed(1)}% é significativa. Avalie o impacto.`,
      severity: input.priceDirection === 'aumento' && input.seasonality === 'baixa' ? 'critical' : 'warning',
    });
    if (action === 'manter' || action === 'aumentar') {
      action = 'revisar';
      confidence = Math.max(confidence, 70);
    }
  }

  // ----------------------------------------
  // REGRA 8: Coerência geral
  // ----------------------------------------
  if (
    totalNegative === 0 &&
    input.priceDirection !== 'manutencao' &&
    (input.priceIntensity === 'pequena' || input.priceIntensity === 'moderada')
  ) {
    positiveSignals.push('A proposta de preço está coerente com o histórico, o clima e os sinais de mercado.');
    confidence = Math.max(confidence, 65);
    if (input.priceDirection === 'aumento') action = 'aumentar';
    else if (input.priceDirection === 'reducao') action = 'reduzir';
  }

  // ----------------------------------------
  // REGRA 9: Município premium + momento favorável
  // ----------------------------------------
  if (
    input.pricingProfile === 'premium' &&
    input.forecastSignal !== 'desfavoravel' &&
    input.seasonality !== 'baixa'
  ) {
    positiveSignals.push('O conjunto de sinais externos sustenta preço mais firme nesta praça.');
    if (action === 'manter') {
      action = 'aumentar';
      confidence = 60;
    }
  }

  // ----------------------------------------
  // REGRA 10: Bom potencial + momento climático ruim
  // ----------------------------------------
  if (
    input.incomeLevel === 'alta' &&
    input.forecastSignal === 'desfavoravel'
  ) {
    alerts.push({
      id: 'r10-potencial-bom-clima-ruim',
      title: 'Potencial vs momento',
      description: 'A praça apresenta bom potencial estrutural, mas o momento climático é desfavorável.',
      severity: 'info',
    });
  }

  // ----------------------------------------
  // REGRA 11: Manutenção em cenário favorável
  // ----------------------------------------
  if (
    input.priceDirection === 'manutencao' &&
    input.seasonality === 'alta' &&
    input.forecastSignal === 'favoravel'
  ) {
    alerts.push({
      id: 'r11-manutencao-cenario-fav',
      title: 'Oportunidade de revisão',
      description: 'O cenário atual sugere espaço para aumento moderado, e não apenas manutenção.',
      severity: 'info',
    });
    positiveSignals.push('Cenário favorável pode sustentar aumento moderado.');
    action = 'aumentar';
    confidence = 55;
  }

  // Fallback: se não há alertas, criar informativo
  if (alerts.length === 0) {
    alerts.push({
      id: 'default-info',
      title: 'Análise neutra',
      description: 'Sem alertas relevantes para o contexto atual. A alteração parece neutra.',
      severity: 'info',
    });
  }

  return { action, confidence, alerts, positiveSignals, negativeSignals };
}

/**
 * Classifica a intensidade da variação.
 */
export function classifyPriceIntensity(
  absPercent: number
): 'pequena' | 'moderada' | 'grande' {
  if (absPercent <= 5) return 'pequena';
  if (absPercent <= 15) return 'moderada';
  return 'grande';
}

/**
 * Classifica a direção da variação.
 */
export function classifyPriceDirection(
  delta: number
): 'aumento' | 'reducao' | 'manutencao' {
  if (delta > 0.01) return 'aumento';
  if (delta < -0.01) return 'reducao';
  return 'manutencao';
}
