// ========================================
// Territorial Pricing Engine — Consolidation
// ========================================

import type { TerritorialInsightSummary, TerritorialComparisonResult, IBGEMunicipio, MunicipalityData, CompanyData, TerritorialCnaeInfo, TerritorialAddressInfo } from '../types/territorial';
import { fetchMunicipioById } from './ibgeLocalitiesService';
import { fetchMunicipalityIndicators, fetchStateAverages } from './ibgeIndicatorsService';
import { fetchCompaniesByMunicipality } from './companySupplyService';
import { normalizeMunicipalityData, buildTerritorialSummary } from '../utils/territorialMapper';
import { getCnaeCodesForService } from '../utils/serviceCnaeMappings';
import { compareMunicipalities, rankByPricingAttractiveness } from '../utils/territorialComparators';
import { mapServiceToCnae } from './ibge/cnaeService';
import { SERVICE_CNAE_MAPPINGS } from '../utils/serviceCnaeMappings';
import { searchCityAddress } from './reverseGeocodingService';

const UF_NUM_TO_SIGLA: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

function buildFallbackMunicipalityData(ibgeCode: string): MunicipalityData {
  return {
    ibgeCode,
    name: `Município ${ibgeCode}`,
    uf: UF_NUM_TO_SIGLA[ibgeCode.substring(0, 2)] ?? 'SP',
    ufName: '',
    region: '',
    regionName: '',
  };
}

function safeNormalize(raw: IBGEMunicipio | null, ibgeCode: string): MunicipalityData {
  if (!raw) return buildFallbackMunicipalityData(ibgeCode);
  try {
    return normalizeMunicipalityData(raw);
  } catch {
    return buildFallbackMunicipalityData(ibgeCode);
  }
}

export async function runTerritorialAnalysis(
  ibgeCode: string,
  serviceId?: string
): Promise<TerritorialInsightSummary> {
  const cnaeCodes = serviceId ? getCnaeCodesForService(serviceId) : undefined;

  // Fetch each resource independently so a single failure doesn't block the rest
  let municipio: IBGEMunicipio | null = null;
  let indicators: { population: number | null; income: number | null } = { population: null, income: null };
  let companies: CompanyData | null = null;

  const results = await Promise.allSettled([
    fetchMunicipioById(Number(ibgeCode)),
    fetchMunicipalityIndicators(ibgeCode),
    fetchCompaniesByMunicipality(ibgeCode, cnaeCodes),
  ]);

  if (results[0].status === 'fulfilled') municipio = results[0].value;
  if (results[1].status === 'fulfilled') indicators = results[1].value;
  if (results[2].status === 'fulfilled') companies = results[2].value;

  const munData = safeNormalize(municipio, ibgeCode);

  munData.population = indicators.population;
  munData.income = indicators.income;

  const ufCode = munData.uf;
  const stateAvg = await fetchStateAverages(ufCode);

  const totalCompanies = companies?.totalCompanies ?? 0;
  const totalMEIs = companies?.totalMEIs ?? 0;

  const summary = buildTerritorialSummary(munData, companies, {
    avgIncome: stateAvg.avgIncome,
    // Approximate state averages as fractions of the local values (mock heuristic)
    avgCompanies: Math.round(totalCompanies * 0.8),
    avgMEIs: Math.round(totalMEIs * 0.75),
  });

  // Fetch CNAE descriptions from IBGE API for the selected service (or all services)
  const cnaeInfo = await fetchCnaeInfoForCity(serviceId);
  summary.cnaeInfo = cnaeInfo;

  // Fetch address info via Nominatim (best-effort, non-blocking)
  const addressInfo = await fetchAddressForCity(munData.name, munData.uf);
  if (addressInfo) summary.addressInfo = addressInfo;

  return summary;
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

/**
 * Fetch address/location info for a city using Nominatim geocoding.
 * Returns formatted address data or null if unavailable.
 */
async function fetchAddressForCity(cityName: string, uf: string): Promise<TerritorialAddressInfo | null> {
  try {
    const result = await searchCityAddress(cityName, uf);
    if (!result) return null;
    return {
      displayName: result.displayName,
      road: result.road,
      neighbourhood: result.neighbourhood,
      suburb: result.suburb,
      city: result.city,
      state: result.state,
      postcode: result.postcode,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch CNAE descriptions for the selected service or all mapped services.
 * Uses local SERVICE_CNAE_MAPPINGS as primary source and tries to enrich
 * descriptions from the IBGE API. Falls back to local data if API fails.
 */
async function fetchCnaeInfoForCity(serviceId?: string): Promise<TerritorialCnaeInfo[]> {
  if (serviceId) {
    // Single service: try IBGE API first, fall back to local mapping
    const mapping = SERVICE_CNAE_MAPPINGS.find((m) => m.serviceId === serviceId);
    if (!mapping) return [];

    try {
      const result = await mapServiceToCnae(serviceId);
      if (result && result.cnaeDescriptions.length > 0) {
        return result.cnaeDescriptions.map((d) => ({
          code: d.id,
          description: d.descricao,
        }));
      }
    } catch {
      // Fall through to local data
    }

    return mapping.cnaeCodes.map((code) => ({
      code,
      description: `${mapping.serviceName} (${code})`,
    }));
  }

  // When no service selected, build CNAE list from all local mappings
  // then try to enrich descriptions from IBGE API in the background
  const seen = new Set<string>();
  const localCnaeInfo: TerritorialCnaeInfo[] = [];

  for (const mapping of SERVICE_CNAE_MAPPINGS) {
    for (const code of mapping.cnaeCodes) {
      if (seen.has(code)) continue;
      seen.add(code);
      localCnaeInfo.push({
        code,
        description: `${mapping.serviceName} (${code})`,
      });
    }
  }

  // Try to enrich with official IBGE descriptions (best-effort, non-blocking)
  try {
    const enrichPromises = localCnaeInfo.map(async (info) => {
      const mapping = SERVICE_CNAE_MAPPINGS.find((m) => m.cnaeCodes.includes(info.code));
      if (!mapping) return info;
      try {
        const result = await mapServiceToCnae(mapping.serviceId);
        const cleanCode = info.code.replace(/[-/]/g, '');
        const desc = result?.cnaeDescriptions.find((d) => d.id === cleanCode || d.id === info.code);
        if (desc) return { code: info.code, description: desc.descricao };
      } catch {
        // Keep local description
      }
      return info;
    });
    const enriched = await Promise.allSettled(enrichPromises);
    return enriched
      .filter((r): r is PromiseFulfilledResult<TerritorialCnaeInfo> => r.status === 'fulfilled')
      .map((r) => r.value);
  } catch {
    // If enrichment fails entirely, return local data
    return localCnaeInfo;
  }
}
