// ========================================
// Pricing Climate — Type Definitions
// ========================================

// ----------------------------------------
// Climate Sensitivity
// ----------------------------------------

export type ClimateSensitivityLevel = 'alta' | 'media' | 'baixa' | 'nenhuma';

export type ClimateDriver =
  | 'chuva'
  | 'calor'
  | 'frio'
  | 'vento'
  | 'umidade'
  | 'amplitude_termica';

export interface ServiceClimateSensitivity {
  serviceId: string;
  serviceName: string;
  sensitivityLevel: ClimateSensitivityLevel;
  drivers: ClimateDriver[];
  notes?: string;
  /** Peso da recomendação climática (0 a 1). Default: baseado no nível de sensibilidade */
  recommendationWeight?: number;
}

// ----------------------------------------
// Seasonality
// ----------------------------------------

export type SeasonalityLevel = 'alta' | 'neutra' | 'baixa';

export type ForecastTrend = 'subindo' | 'estavel' | 'caindo';

export interface SeasonalityAnalysis {
  level: SeasonalityLevel;
  /** Score de 0 a 100 indicando intensidade da sazonalidade */
  score: number;
  explanation: string;
  currentPeriodLabel: string;
  historicalAverage?: number | null;
  forecastTrend?: ForecastTrend;
}

// ----------------------------------------
// Climate Signal
// ----------------------------------------

export type ClimateSignal = 'favoravel' | 'neutro' | 'desfavoravel';

export interface ClimateSignalAnalysis {
  signal: ClimateSignal;
  currentTemperature: number | null;
  historicalAverage: number | null;
  temperatureDelta: number | null;
  precipitationRisk: boolean;
  windRisk: boolean;
  activeDrivers: ClimateDriver[];
  label: string;
}

// ----------------------------------------
// Pricing Context (Input)
// ----------------------------------------

export interface PricingContextInput {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  proposedPrice: number;
  currency?: string;
  editedAt?: string;
}

// ----------------------------------------
// Price Delta
// ----------------------------------------

export type PriceDirection = 'aumento' | 'reducao' | 'manutencao';
export type PriceChangeIntensity = 'pequena' | 'moderada' | 'grande';

export interface PriceDeltaResult {
  absolute: number;
  percent: number;
  direction: PriceDirection;
  intensity: PriceChangeIntensity;
}

// ----------------------------------------
// Recommendation
// ----------------------------------------

export type PricingRecommendationAction = 'aumentar' | 'manter' | 'reduzir' | 'revisar';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface RecommendationAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
}

export interface PricingClimateRecommendation {
  action: PricingRecommendationAction;
  /** Confiança de 0 a 100 */
  confidence: number;
  reason: string;
  alerts: RecommendationAlert[];
  seasonalityLevel: SeasonalityLevel;
  climateSensitivityLevel: ClimateSensitivityLevel;
  suggestedPriceRange?: {
    min: number;
    max: number;
  };
}

// ----------------------------------------
// Chart Data
// ----------------------------------------

export interface ChartDataPoint {
  date: string;
  value: number | null;
  label?: string;
}

// ----------------------------------------
// Decision Support Output (consolidated)
// ----------------------------------------

export interface PricingDecisionSupportOutput {
  summary: {
    serviceName: string;
    pracaName: string;
    currentPrice: number;
    proposedPrice: number;
    priceDelta: number;
    priceDeltaPercent: number;
  };
  climateContext: {
    sensitivityLevel: ClimateSensitivityLevel;
    relevantDrivers: ClimateDriver[];
    seasonalityLevel: SeasonalityLevel;
    currentWeatherLabel?: string;
    forecastSignal?: ClimateSignal;
  };
  recommendation: PricingClimateRecommendation;
  chartData: {
    historicalCurve: ChartDataPoint[];
    forecastCurve: ChartDataPoint[];
  };
  messages: string[];
}
