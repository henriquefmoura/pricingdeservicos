// ========================================
// MEI Supply Service (Mock Adapter)
// ========================================
// Generates realistic MEI data scaled by municipality population,
// covering all mapped CNAE codes from serviceCnaeMappings.

import { getTerritorialCache, setTerritorialCache, COMPANIES_TTL_MS } from '../utils/territorialCache';
import { getAllCnaeCodes } from '../utils/serviceCnaeMappings';

export async function fetchMEIsByMunicipality(ibgeCode: string, cnaeCodes?: string[]): Promise<{ total: number; byCnae: Record<string, number> }> {
  const key = `mei_${ibgeCode}_${cnaeCodes?.join(',')}`;
  const cached = getTerritorialCache<{ total: number; byCnae: Record<string, number> }>(key);
  if (cached) return cached;

  let hash = 0;
  for (let i = 0; i < ibgeCode.length; i++) {
    hash = ((hash << 5) - hash + ibgeCode.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);
  // Scale MEIs by estimated population (~2.7 MEIs per 1000 inhabitants)
  const estimatedPop = 10_000 + (h % 2_000_000);
  const total = Math.max(10, Math.round(estimatedPop * (2.2 + (h % 15) / 10) / 1000));
  const byCnae: Record<string, number> = {};
  // Distribute MEIs across CNAE codes proportionally (5–25% each, varying by hash bits)
  const codes = cnaeCodes ?? getAllCnaeCodes();
  codes.forEach((code, i) => {
    byCnae[code] = Math.round(total * ((5 + ((h >> (i % 16)) % 20)) / 100));
  });

  const result = { total, byCnae };
  setTerritorialCache(key, result, COMPANIES_TTL_MS);
  return result;
}
