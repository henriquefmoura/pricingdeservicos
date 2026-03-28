// ========================================
// MEI Supply Service (Mock Adapter)
// ========================================

import { getTerritorialCache, setTerritorialCache, COMPANIES_TTL_MS } from '../utils/territorialCache';

export async function fetchMEIsByMunicipality(ibgeCode: string, cnaeCodes?: string[]): Promise<{ total: number; byCnae: Record<string, number> }> {
  const key = `mei_${ibgeCode}_${cnaeCodes?.join(',')}`;
  const cached = getTerritorialCache<{ total: number; byCnae: Record<string, number> }>(key);
  if (cached) return cached;

  let hash = 0;
  for (let i = 0; i < ibgeCode.length; i++) {
    hash = ((hash << 5) - hash + ibgeCode.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);
  const total = 20 + (h % 2000);
  const byCnae: Record<string, number> = {};
  const codes = cnaeCodes ?? ['4321-5/00', '4330-4/04', '4322-3/02'];
  codes.forEach((code, i) => {
    byCnae[code] = Math.round(total * ((10 + ((h >> i) % 30)) / 100));
  });

  const result = { total, byCnae };
  setTerritorialCache(key, result, COMPANIES_TTL_MS);
  return result;
}
