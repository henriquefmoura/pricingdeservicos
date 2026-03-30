// ========================================
// Competitor Intelligence — Type Definitions
// ========================================

// ----------------------------------------
// Enums / Unions
// ----------------------------------------

export type PriceUnit = 'servico' | 'hora' | 'm2' | 'visita';
export type ConfidenceLevel = 'baixa' | 'media' | 'alta';
export type SourceType = 'marketplace' | 'institucional' | 'classificado' | 'busca' | 'conteudo' | 'interna';

// ----------------------------------------
// Search Input
// ----------------------------------------

export interface CompetitorSearchInput {
  city: string;
  service: string;
  keywords?: string[];
}

// ----------------------------------------
// Raw Extracted Data
// ----------------------------------------

export interface RawPriceEntry {
  text: string;
  value: number;
  currency: string;
  context: string;
  url: string;
  sourceType: SourceType;
}

// ----------------------------------------
// Normalized Price
// ----------------------------------------

export interface NormalizedPrice {
  value: number;
  currency: 'BRL';
  unit?: PriceUnit;
  source: string;
  sourceType: SourceType;
  city?: string;
  confidence: number;
  extractedAt: string;
}

// ----------------------------------------
// Competitor Price Summary
// ----------------------------------------

export interface CompetitorPriceSummary {
  service: string;
  city: string;
  min: number;
  max: number;
  median: number;
  average: number;
  sampleSize: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  sources: string[];
  priceRange: string;
  dispersion: number;
  lastUpdated: string;
}

// ----------------------------------------
// Competitor Insight
// ----------------------------------------

export interface CompetitorInsight {
  id: string;
  type: 'info' | 'warning' | 'positive' | 'negative';
  title: string;
  description: string;
}

// ----------------------------------------
// Price Position
// ----------------------------------------

export interface PricePosition {
  userPrice: number;
  marketMedian: number;
  marketAverage: number;
  marketMin: number;
  marketMax: number;
  positionLabel: string;
  positionPercent: number;
}

// ----------------------------------------
// Competitor Analysis Result
// ----------------------------------------

export interface CompetitorAnalysisResult {
  searchInput: CompetitorSearchInput;
  summary: CompetitorPriceSummary | null;
  normalizedPrices: NormalizedPrice[];
  insights: CompetitorInsight[];
  position: PricePosition | null;
}

// ----------------------------------------
// Search Result (from search step)
// ----------------------------------------

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  sourceType: SourceType;
}

// ----------------------------------------
// Scraped Content
// ----------------------------------------

export interface ScrapedContent {
  url: string;
  title: string;
  textContent: string;
  sourceType: SourceType;
}

// ----------------------------------------
// Source Confidence Weights
// ----------------------------------------

export const SOURCE_CONFIDENCE_WEIGHTS: Record<SourceType, number> = {
  marketplace: 85,
  institucional: 80,
  classificado: 60,
  busca: 50,
  conteudo: 40,
  interna: 95,
};

// ----------------------------------------
// Enhanced Competitor Source (traceability)
// ----------------------------------------

export interface CompetitorSource {
  url: string;
  title?: string;
  capturedAt: string;
  sourceType: SourceType;
}

// ----------------------------------------
// Enhanced Competitor Data
// ----------------------------------------

export interface CompetitorDataEnhanced {
  price: number;
  city?: string;
  service: string;
  source: CompetitorSource;
  confidence: number;
}
