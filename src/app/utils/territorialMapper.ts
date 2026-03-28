// ========================================
// Territorial Mapper — Classifications & Transforms
// ========================================

import type {
  IBGEMunicipio,
  MunicipalityData,
  CompanyData,
  MunicipalitySize,
  IncomeLevel,
  OfferPressureLevel,
  TerritorialPricingProfile,
  TerritorialInsightSummary,
} from '../types/territorial';
import { generateTerritorialInsights } from './territorialInsights';

// Thresholds
const POP_SMALL = 50_000;
const POP_MEDIUM = 200_000;
const POP_LARGE = 1_000_000;
const INCOME_LOW = 800;
const INCOME_HIGH = 1_600;

export function classifyMunicipalitySize(population: number | null | undefined): MunicipalitySize {
  if (population == null) return 'medio';
  if (population < POP_SMALL) return 'pequeno';
  if (population < POP_MEDIUM) return 'medio';
  if (population < POP_LARGE) return 'grande';
  return 'metropole';
}

export function classifyIncomeLevel(income: number | null | undefined, stateAvg?: number | null): IncomeLevel {
  const ref = stateAvg ?? 1_200;
  if (income == null) return 'media';
  if (income < ref * 0.7) return 'baixa';
  if (income > ref * 1.3) return 'alta';
  return 'media';
}

export function classifyOfferPressure(companies: number | null | undefined, meis: number | null | undefined, population: number | null | undefined): OfferPressureLevel {
  if (companies == null || population == null || population === 0) return 'media';
  const density = ((companies + (meis ?? 0)) / population) * 1000;
  if (density < 2) return 'baixa';
  if (density > 6) return 'alta';
  return 'media';
}

export function classifyPricingProfile(income: IncomeLevel, pressure: OfferPressureLevel, size: MunicipalitySize): TerritorialPricingProfile {
  if (income === 'alta' && pressure === 'baixa') return 'premium';
  if (income === 'alta' && pressure === 'alta') return 'competitivo';
  if (income === 'baixa' && pressure === 'alta') return 'alto_risco';
  if (income === 'baixa' && pressure === 'baixa' && size === 'pequeno') return 'expansao';
  if (income === 'media' && pressure === 'media') return 'equilibrado';
  // Remaining baixa cases (media pressure, or non-small size with baixa pressure)
  if (income === 'baixa') return 'sensivel_preco';
  return 'equilibrado';
}

export function calculateDeltaPercent(value: number | null | undefined, ref: number | null | undefined): number | null {
  if (value == null || ref == null || ref === 0) return null;
  return ((value - ref) / ref) * 100;
}

export function normalizeMunicipalityData(raw: IBGEMunicipio): MunicipalityData {
  return {
    ibgeCode: String(raw.id),
    name: raw.nome,
    uf: raw.microrregiao.mesorregiao.UF.sigla,
    ufName: raw.microrregiao.mesorregiao.UF.nome,
    region: raw.microrregiao.mesorregiao.UF.regiao.sigla,
    regionName: raw.microrregiao.mesorregiao.UF.regiao.nome,
    microregion: raw.microrregiao.nome,
    mesoregion: raw.microrregiao.mesorregiao.nome,
  };
}

export function buildTerritorialSummary(
  mun: MunicipalityData,
  companies: CompanyData | null,
  stateAvg: { avgIncome?: number | null; avgCompanies?: number | null; avgMEIs?: number | null }
): TerritorialInsightSummary {
  const incomeLevel = classifyIncomeLevel(mun.income, stateAvg.avgIncome);
  const size = classifyMunicipalitySize(mun.population);
  const totalCompanies = companies?.totalCompanies ?? null;
  const totalMEIs = companies?.totalMEIs ?? null;
  const pressure = classifyOfferPressure(totalCompanies, totalMEIs, mun.population);
  const profile = classifyPricingProfile(incomeLevel, pressure, size);

  const summary: TerritorialInsightSummary = {
    city: mun.name,
    ibgeCode: mun.ibgeCode,
    uf: mun.uf,
    region: mun.regionName,
    population: mun.population,
    income: mun.income,
    incomeLevel,
    municipalitySize: size,
    relatedCompanies: totalCompanies,
    relatedMEIs: totalMEIs,
    offerPressure: pressure,
    pricingProfile: profile,
    comparisonVsState: {
      incomeDeltaPercent: calculateDeltaPercent(mun.income, stateAvg.avgIncome),
      companiesDeltaPercent: calculateDeltaPercent(totalCompanies, stateAvg.avgCompanies),
      meisDeltaPercent: calculateDeltaPercent(totalMEIs, stateAvg.avgMEIs),
    },
    insights: [],
  };
  summary.insights = generateTerritorialInsights(summary);
  return summary;
}
