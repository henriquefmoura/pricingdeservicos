// ========================================
// Territorial Pricing Engine — Consolidation
// ========================================

import type { TerritorialInsightSummary, TerritorialComparisonResult, IBGEMunicipio, MunicipalityData, CompanyData, TerritorialCnaeInfo, TerritorialAddressInfo } from '../types/territorial';
import { fetchMunicipioById } from './ibgeLocalitiesService';
import { fetchMunicipalityIndicators, fetchStateAverages } from './ibgeIndicatorsService';
import { fetchCompaniesByMunicipality } from './companySupplyService';
import { normalizeMunicipalityData, buildTerritorialSummary } from '../utils/territorialMapper';
import { getCnaeCodesForService, getCnaeCategory, getCnaeColor } from '../utils/serviceCnaeMappings';
import { compareMunicipalities, rankByPricingAttractiveness } from '../utils/territorialComparators';
import { mapServiceToCnae, fetchAllConstructionCnaes } from './ibge/cnaeService';
import { SERVICE_CNAE_MAPPINGS, CNAE_CODE_CATEGORY } from '../utils/serviceCnaeMappings';
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

  // Fetch CNAE descriptions from IBGE API for the selected service (or all services).
  // After fetching, enrich each CNAE entry with the per-municipality company/MEI counts
  // from the companies data already loaded above (companies.companiesByCnae).
  // Wrap in try/catch so a CNAE fetch failure never blocks the entire analysis.
  try {
    const cnaeInfo = await fetchCnaeInfoForCity(serviceId);
    summary.cnaeInfo = enrichCnaeWithCompanyCounts(cnaeInfo, companies);
  } catch (err) {
    // Ensure we always provide at least local CNAE data
    console.warn('[TerritorialEngine] Falha ao buscar CNAEs da API IBGE, usando dados locais:', err);
    const fallbackCnae: TerritorialCnaeInfo[] = [];
    const seen = new Set<string>();
    const mappings = serviceId
      ? SERVICE_CNAE_MAPPINGS.filter((m) => m.serviceId === serviceId)
      : SERVICE_CNAE_MAPPINGS;
    for (const mapping of mappings) {
      for (const code of mapping.cnaeCodes) {
        if (seen.has(code)) continue;
        seen.add(code);
        fallbackCnae.push({ code, description: `${mapping.serviceName} (${code})`, serviceCategory: getCnaeCategory(code), color: getCnaeColor(code) });
      }
    }
    summary.cnaeInfo = enrichCnaeWithCompanyCounts(fallbackCnae, companies);
  }

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
      lat: result.lat,
      lon: result.lon,
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
 * Enrich a list of TerritorialCnaeInfo items with per-municipality company and MEI
 * counts sourced from the CompanyData already fetched for this municipality.
 * Also sorts the result by companiesCount descending so the most active segments
 * appear first in the UI.
 */
function enrichCnaeWithCompanyCounts(
  cnaeInfo: TerritorialCnaeInfo[],
  companies: CompanyData | null,
): TerritorialCnaeInfo[] {
  const enriched = cnaeInfo.map((cnae) => ({
    ...cnae,
    companiesCount: companies?.companiesByCnae?.[cnae.code] ?? 0,
    meisCount: companies?.meisByCnae?.[cnae.code] ?? 0,
  }));
  // Sort by company count descending so most active CNAEs appear first
  enriched.sort((a, b) => (b.companiesCount ?? 0) - (a.companiesCount ?? 0));
  return enriched;
}

/**
 * Fetch CNAE descriptions for the selected service or all mapped services.
 * When no service is selected, fetches the FULL list of construction-sector
 * CNAE subclasses (Section F — 41xx/42xx/43xx and related) from the IBGE
 * CNAE API. This replaces the previous 23-code local list with the complete
 * CAGED/RAIS base for the construction and services sector.
 *
 * Falls back to local SERVICE_CNAE_MAPPINGS data if the API is unavailable.
 */
async function fetchCnaeInfoForCity(serviceId?: string): Promise<TerritorialCnaeInfo[]> {
  if (serviceId) {
    // Single service: try IBGE API first, fall back to local mapping
    const mapping = SERVICE_CNAE_MAPPINGS.find((m) => m.serviceId === serviceId);
    if (!mapping) return [];

    // Build local fallback first so it's always available
    const localFallback: TerritorialCnaeInfo[] = mapping.cnaeCodes.map((code) => ({
      code,
      description: `${mapping.serviceName} (${code})`,
      serviceCategory: getCnaeCategory(code),
      color: getCnaeColor(code),
    }));

    try {
      const result = await mapServiceToCnae(serviceId);
      if (result && result.cnaeDescriptions.length > 0) {
        return result.cnaeDescriptions.map((d) => ({
          code: d.id,
          description: d.descricao,
          serviceCategory: getCnaeCategory(d.id),
          color: getCnaeColor(d.id),
        }));
      }
    } catch {
      // Fall through to local data
    }

    return localFallback;
  }

  // When no service is selected: fetch ALL construction CNAEs from IBGE API
  // This covers the complete CAGED/RAIS base for the construction sector.
  try {
    const allConstructionCnaes = await fetchAllConstructionCnaes();
    if (allConstructionCnaes.length > 0) {
      // Normalise the id returned by IBGE (may be numeric "43215") to our format ("4321-5/00")
      return allConstructionCnaes.map((d) => {
        // Try to find the canonical code format from local category map
        const localCode = Object.keys(CNAE_CODE_CATEGORY).find(
          (k) => k.replace(/[-/]/g, '') === String(d.id).replace(/[-/]/g, '')
        ) ?? d.id;
        return {
          code: localCode,
          description: d.descricao,
          serviceCategory: getCnaeCategory(localCode),
          color: getCnaeColor(localCode),
        };
      });
    }
  } catch (err) {
    console.warn('[TerritorialEngine] Falha ao buscar CNAEs da Seção F via API IBGE, usando dados locais:', err);
  }

  // Fallback: build from all local mappings (the expanded set)
  const seen = new Set<string>();
  const localCnaeInfo: TerritorialCnaeInfo[] = [];

  for (const mapping of SERVICE_CNAE_MAPPINGS) {
    for (const code of mapping.cnaeCodes) {
      if (seen.has(code)) continue;
      seen.add(code);
      localCnaeInfo.push({
        code,
        description: `${mapping.serviceName} (${code})`,
        serviceCategory: getCnaeCategory(code),
        color: getCnaeColor(code),
      });
    }
  }

  // Also add any codes in CNAE_CODE_CATEGORY that aren't yet in the list
  for (const code of Object.keys(CNAE_CODE_CATEGORY)) {
    if (seen.has(code)) continue;
    seen.add(code);
    localCnaeInfo.push({
      code,
      description: `CNAE ${code}`,
      serviceCategory: getCnaeCategory(code),
      color: getCnaeColor(code),
    });
  }

  return localCnaeInfo;
}
