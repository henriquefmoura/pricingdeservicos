// ========================================
// Territorial Intelligence — Type Definitions
// ========================================

export type { AlertSeverity } from './pricingClimate';

// ----------------------------------------
// Enums / Unions
// ----------------------------------------

export type TerritorialPricingProfile =
  | 'premium'
  | 'equilibrado'
  | 'sensivel_preco'
  | 'competitivo'
  | 'expansao'
  | 'alto_risco';

export type OfferPressureLevel = 'baixa' | 'media' | 'alta';
export type IncomeLevel = 'baixa' | 'media' | 'alta';
export type MunicipalitySize = 'pequeno' | 'medio' | 'grande' | 'metropole';

// ----------------------------------------
// Insight
// ----------------------------------------

export interface TerritorialInsight {
  id: string;
  title: string;
  description: string;
  severity: import('./pricingClimate').AlertSeverity;
}

// ----------------------------------------
// Comparison Delta
// ----------------------------------------

export interface StateComparisonDelta {
  incomeDeltaPercent?: number | null;
  companiesDeltaPercent?: number | null;
  meisDeltaPercent?: number | null;
}

// ----------------------------------------
// Main Summary
// ----------------------------------------

export interface TerritorialCnaeInfo {
  code: string;
  description: string;
}

export interface TerritorialAddressInfo {
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

export interface TerritorialInsightSummary {
  city: string;
  ibgeCode: string;
  uf: string;
  region?: string;
  population?: number | null;
  income?: number | null;
  incomeLevel?: IncomeLevel;
  municipalitySize?: MunicipalitySize;
  relatedCompanies?: number | null;
  relatedMEIs?: number | null;
  offerPressure?: OfferPressureLevel;
  pricingProfile?: TerritorialPricingProfile;
  comparisonVsState?: StateComparisonDelta;
  cnaeInfo?: TerritorialCnaeInfo[];
  addressInfo?: TerritorialAddressInfo;
  insights: TerritorialInsight[];
}

// ----------------------------------------
// Service ↔ CNAE Mapping
// ----------------------------------------

export interface ServiceCnaeMapping {
  serviceId: string;
  serviceName: string;
  cnaeCodes: string[];
  keywords?: string[];
  notes?: string;
}

// ----------------------------------------
// IBGE Raw Types
// ----------------------------------------

export interface IBGERegiao {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGEUF {
  id: number;
  sigla: string;
  nome: string;
  regiao: IBGERegiao;
}

export interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
        regiao: IBGERegiao;
      };
    };
  };
}

// ----------------------------------------
// Normalized Data
// ----------------------------------------

export interface MunicipalityData {
  ibgeCode: string;
  name: string;
  uf: string;
  ufName: string;
  region: string;
  regionName: string;
  microregion?: string;
  mesoregion?: string;
  population?: number | null;
  income?: number | null;
}

export interface CompanyData {
  ibgeCode: string;
  municipality: string;
  uf: string;
  totalCompanies: number;
  totalMEIs: number;
  companiesByCnae: Record<string, number>;
  meisByCnae: Record<string, number>;
}

// ----------------------------------------
// CNAE Professional Marker
// ----------------------------------------

export interface CnaeProfessionalMarker {
  id: string;
  cnae: string;
  cnaeDescription: string;
  type: 'company' | 'mei' | 'instalador';
  lat: number;
  lon: number;
  municipalityCode: string;
}

// ----------------------------------------
// Filters
// ----------------------------------------

export interface TerritorialFilterState {
  selectedRegion?: string;
  selectedUF?: string;
  selectedMunicipality?: string;
  selectedService?: string;
  searchQuery?: string;
}

// ----------------------------------------
// Comparison
// ----------------------------------------

export interface TerritorialComparisonResult {
  cityA: TerritorialInsightSummary;
  cityB: TerritorialInsightSummary;
  populationRatio?: number | null;
  incomeRatio?: number | null;
  companyRatio?: number | null;
  meiRatio?: number | null;
  insights: TerritorialInsight[];
}

// ----------------------------------------
// Map Feature
// ----------------------------------------

export interface MapFeatureProperties {
  ibgeCode: string;
  name: string;
  uf: string;
  population?: number | null;
  income?: number | null;
  pricingProfile?: TerritorialPricingProfile;
}

// ----------------------------------------
// Territorial CNAE Insight
// ----------------------------------------

export interface TerritorialCnaeInsight {
  cnaeCode: string;
  cnaeDescription: string;
  relatedService: string;
  estimatedPresenceLevel: 'baixa' | 'media' | 'alta';
}

// ----------------------------------------
// Leroy Merlin Store
// ----------------------------------------

export interface LeroyStore {
  id: string;
  name: string;
  city: string;
  uf: string;
  lat: number;
  lon: number;
}

// ----------------------------------------
// Cache
// ----------------------------------------

export interface TerritorialCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
