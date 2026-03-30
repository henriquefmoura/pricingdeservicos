// ========================================
// Company Supply Service (Mock Adapter)
// ========================================

import type { CompanyData, CnaeProfessionalMarker } from '../types/territorial';
import { getTerritorialCache, setTerritorialCache, COMPANIES_TTL_MS, companyCacheKey } from '../utils/territorialCache';

const CNAE_DESCRIPTIONS: Record<string, string> = {
  '4321-5/00': 'Instalação Elétrica',
  '4330-4/04': 'Pintura',
  '4322-3/02': 'Ar-Condicionado',
  '4322-3/01': 'Hidráulica',
  '3104-7/00': 'Montagem de Móveis',
  '4330-4/02': 'Impermeabilização',
  '4330-4/99': 'Serviços Especializados',
  '3321-0/00': 'Manutenção de Equipamentos',
  '4399-1/03': 'Telhado / Coberturas',
  '8130-3/00': 'Jardinagem',
  '8121-4/00': 'Limpeza',
};

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

/**
 * Generate mock CNAE professional markers scattered around a municipality centroid.
 * Used to visualize professionals on the map.
 */
export function generateProfessionalMarkers(
  ibgeCode: string,
  centerLat: number,
  centerLon: number,
  cnaeCodes?: string[],
  maxMarkers = 30
): CnaeProfessionalMarker[] {
  const codes = cnaeCodes ?? ['4321-5/00', '4330-4/04', '4322-3/02'];

  let hash = 0;
  for (let i = 0; i < ibgeCode.length; i++) {
    hash = ((hash << 5) - hash + ibgeCode.charCodeAt(i)) | 0;
  }

  // Simple seeded pseudo-random generator
  let seed = Math.abs(hash);
  const nextRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const markers: CnaeProfessionalMarker[] = [];
  const count = Math.min(maxMarkers, 5 + Math.abs(hash) % 26);

  for (let i = 0; i < count; i++) {
    const cnae = codes[i % codes.length];
    // Scatter within ~0.05 degrees (~5km) of centroid
    const lat = centerLat + (nextRandom() - 0.5) * 0.1;
    const lon = centerLon + (nextRandom() - 0.5) * 0.1;
    const isMei = nextRandom() > 0.4;

    markers.push({
      id: `prof-${ibgeCode}-${i}`,
      cnae,
      cnaeDescription: CNAE_DESCRIPTIONS[cnae] ?? cnae,
      type: isMei ? 'mei' : 'company',
      lat,
      lon,
      municipalityCode: ibgeCode,
    });
  }

  return markers;
}

/**
 * Generate MEI density data for all municipalities in a GeoJSON feature collection.
 * Returns a Record<ibgeCode, count> for coloring municipality polygons.
 */
export function generateMeiDensityForMunicipalities(
  features: Array<{ properties?: Record<string, unknown>; id?: string | number }>
): Record<string, number> {
  const density: Record<string, number> = {};
  for (const feature of features) {
    const code = String(feature.properties?.codarea ?? feature.id ?? '');
    if (!code) continue;
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
    }
    density[code] = 5 + Math.abs(hash) % 200;
  }
  return density;
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
