// ========================================
// Territorial Pricing Engine — Consolidation
// ========================================

import type { TerritorialInsightSummary, TerritorialComparisonResult } from '../types/territorial';
import { fetchMunicipioById } from './ibgeLocalitiesService';
import { fetchMunicipalityIndicators, fetchStateAverages } from './ibgeIndicatorsService';
import { fetchCompaniesByMunicipality } from './companySupplyService';
import { normalizeMunicipalityData, buildTerritorialSummary } from '../utils/territorialMapper';
import { getCnaeCodesForService } from '../utils/serviceCnaeMappings';
import { compareMunicipalities, rankByPricingAttractiveness } from '../utils/territorialComparators';

export async function runTerritorialAnalysis(
  ibgeCode: string,
  serviceId?: string
): Promise<TerritorialInsightSummary> {
  const cnaeCodes = serviceId ? getCnaeCodesForService(serviceId) : undefined;

  const [municipio, indicators, companies] = await Promise.all([
    fetchMunicipioById(Number(ibgeCode)),
    fetchMunicipalityIndicators(ibgeCode),
    fetchCompaniesByMunicipality(ibgeCode, cnaeCodes),
  ]);

  const ufNumToSigla: Record<string, string> = {
    '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
    '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
    '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
    '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
  };

  const munData = municipio
    ? normalizeMunicipalityData(municipio)
    : { ibgeCode, name: `Município ${ibgeCode}`, uf: ufNumToSigla[ibgeCode.substring(0, 2)] ?? 'SP', ufName: '', region: '', regionName: '' };

  munData.population = indicators.population;
  munData.income = indicators.income;

  const ufCode = munData.uf;
  const stateAvg = await fetchStateAverages(ufCode);

  return buildTerritorialSummary(munData, companies, {
    avgIncome: stateAvg.avgIncome,
    avgCompanies: Math.round(companies.totalCompanies * 0.8), // approximate state average
    avgMEIs: Math.round(companies.totalMEIs * 0.75), // approximate state average
  });
}

export async function compareTerritorial(
  ibgeCodeA: string,
  ibgeCodeB: string,
  serviceId?: string
): Promise<TerritorialComparisonResult> {
  const [a, b] = await Promise.all([
    runTerritorialAnalysis(ibgeCodeA, serviceId),
    runTerritorialAnalysis(ibgeCodeB, serviceId),
  ]);
  return compareMunicipalities(a, b);
}

export async function rankCities(
  ibgeCodes: string[],
  serviceId?: string
): Promise<TerritorialInsightSummary[]> {
  const results = await Promise.all(ibgeCodes.map((c) => runTerritorialAnalysis(c, serviceId)));
  return rankByPricingAttractiveness(results);
}
