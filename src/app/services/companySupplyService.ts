// ========================================
// Company Supply Service (Mock Adapter)
// ========================================

import type { CompanyData } from '../types/territorial';
import { getTerritorialCache, setTerritorialCache, COMPANIES_TTL_MS, companyCacheKey } from '../utils/territorialCache';

export async function fetchCompaniesByMunicipality(ibgeCode: string, cnaeCodes?: string[]): Promise<CompanyData> {
  const key = companyCacheKey(ibgeCode, cnaeCodes?.join(','));
  const cached = getTerritorialCache<CompanyData>(key);
  if (cached) return cached;
  const data = generateMockCompanyData(ibgeCode, cnaeCodes);
  setTerritorialCache(key, data, COMPANIES_TTL_MS);
  return data;
}

export function getCompanyDensity(companies: number, population: number | null): number | null {
  if (!population || population === 0) return null;
  return (companies / population) * 1000;
}

function generateMockCompanyData(ibgeCode: string, cnaeCodes?: string[]): CompanyData {
  let hash = 0;
  for (let i = 0; i < ibgeCode.length; i++) {
    hash = ((hash << 5) - hash + ibgeCode.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);

  const totalCompanies = 50 + (h % 5000);
  const totalMEIs = Math.round(totalCompanies * (0.3 + (h % 30) / 100));

  const companiesByCnae: Record<string, number> = {};
  const meisByCnae: Record<string, number> = {};
  const codes = cnaeCodes ?? ['4321-5/00', '4330-4/04', '4322-3/02'];
  codes.forEach((code, i) => {
    const cRatio = (10 + ((h >> i) % 40)) / 100;
    companiesByCnae[code] = Math.round(totalCompanies * cRatio);
    meisByCnae[code] = Math.round(totalMEIs * cRatio);
  });

  // Derive UF from ibgeCode (first 2 digits map to UF code)
  const ufCodeNum = parseInt(ibgeCode.substring(0, 2), 10);
  const ufMap: Record<number, string> = { 35: 'SP', 33: 'RJ', 31: 'MG', 41: 'PR', 42: 'SC', 43: 'RS', 29: 'BA', 26: 'PE', 23: 'CE', 53: 'DF', 52: 'GO', 15: 'PA', 13: 'AM' };

  return {
    ibgeCode,
    municipality: '',
    uf: ufMap[ufCodeNum] ?? 'SP',
    totalCompanies,
    totalMEIs,
    companiesByCnae,
    meisByCnae,
  };
}
