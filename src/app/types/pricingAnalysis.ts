// ========================================
// Pricing Analysis — Consolidated Types
// ========================================
// Tipos consolidados para o painel de Inteligência de Mercado para Pricing.

import type { AlertSeverity } from './pricingClimate';

// ----------------------------------------
// Core Context
// ----------------------------------------

export interface PricingAnalysisDecisionContext {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  proposedPrice: number;
  priceDelta: number;
  priceDeltaPercent: number;

  historicalContext: {
    localAverage?: number | null;
    localTrend?: 'subindo' | 'estavel' | 'caindo';
    pricePosition?: 'abaixo' | 'dentro' | 'acima';
  };

  climateContext: {
    enabled: boolean;
    currentTemperature?: number | null;
    apparentTemperature?: number | null;
    precipitation?: number | null;
    windSpeed?: number | null;
    weatherSummary?: string;
    forecastSignal?: 'favoravel' | 'neutro' | 'desfavoravel';
    climateImpactLevel?: 'baixo' | 'medio' | 'alto';
    forecastDays?: ClimateForecastDay[];
  };

  marketContext: {
    incomeLevel?: 'baixa' | 'media' | 'alta';
    municipalitySize?: 'pequeno' | 'medio' | 'grande' | 'metropole';
    population?: number | null;
    income?: number | null;
    relatedCompanies?: number | null;
    relatedMEIs?: number | null;
    offerPressure?: 'baixa' | 'media' | 'alta';
    pricingProfile?:
      | 'premium'
      | 'equilibrado'
      | 'sensivel_preco'
      | 'competitivo'
      | 'expansao'
      | 'alto_risco';
  };

  seasonalityContext: {
    level: 'alta' | 'neutra' | 'baixa';
    score?: number;
    explanation?: string;
    currentPeriodLabel?: string;
  };

  recommendation: {
    action: 'aumentar' | 'manter' | 'reduzir' | 'revisar';
    confidence: number;
    summary: string;
  };

  alerts: AnalysisAlert[];

  executiveSummary: string;

  positiveSignals: string[];
  negativeSignals: string[];
}

// ----------------------------------------
// Alert
// ----------------------------------------

export interface AnalysisAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
}

// ----------------------------------------
// Forecast day
// ----------------------------------------

export interface ClimateForecastDay {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitationSum: number | null;
  weatherCode: number | null;
}

// ----------------------------------------
// Input
// ----------------------------------------

export interface PricingAnalysisInput {
  serviceId: string;
  serviceName: string;
  pracaId: string;
  pracaName: string;
  currentPrice: number;
  proposedPrice: number;
}

// ----------------------------------------
// Historical price data (from internal app)
// ----------------------------------------

export interface HistoricalPriceData {
  prices: number[];
  average: number;
  min: number;
  max: number;
  trend: 'subindo' | 'estavel' | 'caindo';
}

// ----------------------------------------
// Dispersion data (between plazas)
// ----------------------------------------

export interface PlazaDispersionData {
  globalAverage: number;
  globalMin: number;
  globalMax: number;
  standardDeviation: number;
  position: 'abaixo' | 'dentro' | 'acima';
}

// ----------------------------------------
// Analysis Panel Props
// ----------------------------------------

export interface AnalysisPanelProps {
  context: PricingAnalysisDecisionContext;
  loading?: boolean;
  error?: string | null;
}

// ----------------------------------------
// Signal classification
// ----------------------------------------

export type SignalDirection = 'positivo' | 'neutro' | 'negativo';
export type RecommendationAction = 'aumentar' | 'manter' | 'reduzir' | 'revisar';

// ----------------------------------------
// Competitor Context (inside analysis)
// ----------------------------------------

export interface CompetitorContext {
  enabled: boolean;
  priceRange?: string;
  median?: number | null;
  average?: number | null;
  min?: number | null;
  max?: number | null;
  sampleSize?: number;
  confidenceLevel?: 'baixa' | 'media' | 'alta';
  sources?: CompetitorSourceRef[];
  lastUpdated?: string;
}

export interface CompetitorSourceRef {
  url: string;
  title?: string;
  sourceType: string;
  capturedAt: string;
}

// ----------------------------------------
// CNAE Context (inside analysis)
// ----------------------------------------

export interface CnaeContext {
  enabled: boolean;
  cnaeCodes?: string[];
  cnaeDescriptions?: Array<{ id: string; descricao: string }>;
  estimatedPresenceLevel?: 'baixa' | 'media' | 'alta';
}

// ----------------------------------------
// Pricing Unified Context
// ----------------------------------------
// Objeto central que consolida TODOS os dados para decisão de preço.

export interface PricingUnifiedContext {
  service: string;
  serviceId: string;
  city: string;
  price: number;
  proposedPrice: number;

  climate: PricingAnalysisDecisionContext['climateContext'] | null;
  seasonality: PricingAnalysisDecisionContext['seasonalityContext'] | null;
  territorial: PricingAnalysisDecisionContext['marketContext'] | null;
  cnae: CnaeContext | null;
  meiDensity: {
    total?: number | null;
    offerPressure?: 'baixa' | 'media' | 'alta';
  } | null;
  competitor: CompetitorContext | null;

  companyStoresNearby: import('../types/territorial').CompanyStore[];

  recommendation: PricingAnalysisDecisionContext['recommendation'] | null;
  executiveSummary: string;
  alerts: AnalysisAlert[];
}
