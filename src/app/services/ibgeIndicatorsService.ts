// ========================================
// IBGE Indicators Service (SIDRA)
// ========================================

import { getTerritorialCache, setTerritorialCache, INDICATORS_TTL_MS, municipalityCacheKey } from '../utils/territorialCache';

const SIDRA = 'https://servicodados.ibge.gov.br/api/v3/agregados';

export async function fetchPopulation(ibgeCode: string): Promise<number | null> {
  const key = `pop_${ibgeCode}`;
  const cached = getTerritorialCache<number>(key);
  if (cached != null) return cached;
  try {
    const url = `${SIDRA}/4714/periodos/-1/variaveis/93?localidades=N6[${ibgeCode}]`;
    const res = await fetch(url);
    if (!res.ok) return getMockIndicators(ibgeCode).population;
    const data = await res.json();
    const val = parseSidraValue(data);
    if (val != null) setTerritorialCache(key, val, INDICATORS_TTL_MS);
    return val ?? getMockIndicators(ibgeCode).population;
  } catch {
    return getMockIndicators(ibgeCode).population;
  }
}

export async function fetchIncome(ibgeCode: string): Promise<number | null> {
  const key = `inc_${ibgeCode}`;
  const cached = getTerritorialCache<number>(key);
  if (cached != null) return cached;
  try {
    const url = `${SIDRA}/5938/periodos/-1/variaveis/37?localidades=N6[${ibgeCode}]`;
    const res = await fetch(url);
    if (!res.ok) return getMockIndicators(ibgeCode).income;
    const data = await res.json();
    const val = parseSidraValue(data);
    if (val != null) setTerritorialCache(key, val, INDICATORS_TTL_MS);
    return val ?? getMockIndicators(ibgeCode).income;
  } catch {
    return getMockIndicators(ibgeCode).income;
  }
}

export async function fetchMunicipalityIndicators(ibgeCode: string): Promise<{ population: number | null; income: number | null }> {
  const key = municipalityCacheKey(ibgeCode);
  const cached = getTerritorialCache<{ population: number | null; income: number | null }>(key);
  if (cached) return cached;
  const [population, income] = await Promise.all([fetchPopulation(ibgeCode), fetchIncome(ibgeCode)]);
  const result = { population, income };
  setTerritorialCache(key, result, INDICATORS_TTL_MS);
  return result;
}

export async function fetchStateAverages(ufCode: string): Promise<{ avgIncome: number | null; avgPopulation: number | null }> {
  const key = `state_avg_${ufCode}`;
  const cached = getTerritorialCache<{ avgIncome: number | null; avgPopulation: number | null }>(key);
  if (cached) return cached;
  // Use mock averages per state
  const avgs = getMockStateAverages(ufCode);
  setTerritorialCache(key, avgs, INDICATORS_TTL_MS);
  return avgs;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSidraValue(data: any): number | null {
  try {
    if (Array.isArray(data) && data.length > 0) {
      const variable = data[0];
      if (variable?.resultados?.[0]?.series?.[0]?.serie) {
        const serie = variable.resultados[0].series[0].serie;
        const keys = Object.keys(serie);
        const lastKey = keys[keys.length - 1];
        const val = parseFloat(serie[lastKey]);
        return isNaN(val) ? null : val;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Deterministic mock based on IBGE code hash */
export function getMockIndicators(ibgeCode: string): { population: number; income: number } {
  let hash = 0;
  for (let i = 0; i < ibgeCode.length; i++) {
    hash = ((hash << 5) - hash + ibgeCode.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);
  const population = 10_000 + (h % 2_000_000);
  const income = 600 + (h % 3_000);
  return { population, income };
}

function getMockStateAverages(ufCode: string): { avgIncome: number | null; avgPopulation: number | null } {
  const avgs: Record<string, { avgIncome: number; avgPopulation: number }> = {
    SP: { avgIncome: 2100, avgPopulation: 300000 },
    RJ: { avgIncome: 1800, avgPopulation: 250000 },
    MG: { avgIncome: 1200, avgPopulation: 100000 },
    PR: { avgIncome: 1500, avgPopulation: 80000 },
    SC: { avgIncome: 1600, avgPopulation: 75000 },
    RS: { avgIncome: 1400, avgPopulation: 90000 },
    BA: { avgIncome: 900, avgPopulation: 70000 },
    PE: { avgIncome: 950, avgPopulation: 65000 },
    CE: { avgIncome: 850, avgPopulation: 60000 },
    DF: { avgIncome: 2800, avgPopulation: 500000 },
    GO: { avgIncome: 1300, avgPopulation: 50000 },
    PA: { avgIncome: 800, avgPopulation: 40000 },
    AM: { avgIncome: 750, avgPopulation: 35000 },
  };
  return avgs[ufCode] ?? { avgIncome: 1200, avgPopulation: 80000 };
}
