// ========================================
// IBGE Localities Service
// ========================================

import type { IBGEUF, IBGEMunicipio, MunicipalityData } from '../types/territorial';
import { getTerritorialCache, setTerritorialCache, LOCALITIES_TTL_MS } from '../utils/territorialCache';
import { normalizeMunicipalityData } from '../utils/territorialMapper';

const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export async function fetchUFs(): Promise<IBGEUF[]> {
  const cached = getTerritorialCache<IBGEUF[]>('ufs');
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/estados?orderBy=nome`);
    if (!res.ok) throw new Error(`IBGE UFs: ${res.status}`);
    const data: IBGEUF[] = await res.json();
    setTerritorialCache('ufs', data, LOCALITIES_TTL_MS);
    return data;
  } catch {
    return getMockUFs();
  }
}

export async function fetchMunicipiosByUF(uf: string): Promise<IBGEMunicipio[]> {
  const key = `mun_uf_${uf}`;
  const cached = getTerritorialCache<IBGEMunicipio[]>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/estados/${uf}/municipios?orderBy=nome`);
    if (!res.ok) throw new Error(`IBGE Municipios: ${res.status}`);
    const data: IBGEMunicipio[] = await res.json();
    setTerritorialCache(key, data, LOCALITIES_TTL_MS);
    return data;
  } catch {
    return [];
  }
}

export async function fetchMunicipioById(id: number): Promise<IBGEMunicipio | null> {
  if (!id || isNaN(id)) return null;
  const key = `mun_${id}`;
  const cached = getTerritorialCache<IBGEMunicipio>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/municipios/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Validate basic structure
    if (!data || typeof data !== 'object' || !data.id || !data.nome) return null;
    const mun = data as IBGEMunicipio;
    setTerritorialCache(key, mun, LOCALITIES_TTL_MS);
    return mun;
  } catch {
    return null;
  }
}

export function buildTerritorialHierarchy(municipios: IBGEMunicipio[]): Record<string, Record<string, MunicipalityData[]>> {
  const result: Record<string, Record<string, MunicipalityData[]>> = {};
  for (const m of municipios) {
    const norm = normalizeMunicipalityData(m);
    if (!result[norm.region]) result[norm.region] = {};
    if (!result[norm.region][norm.uf]) result[norm.region][norm.uf] = [];
    result[norm.region][norm.uf].push(norm);
  }
  return result;
}

function getMockUFs(): IBGEUF[] {
  return [
    { id: 35, sigla: 'SP', nome: 'São Paulo', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
    { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
    { id: 31, sigla: 'MG', nome: 'Minas Gerais', regiao: { id: 3, sigla: 'SE', nome: 'Sudeste' } },
    { id: 41, sigla: 'PR', nome: 'Paraná', regiao: { id: 4, sigla: 'S', nome: 'Sul' } },
    { id: 42, sigla: 'SC', nome: 'Santa Catarina', regiao: { id: 4, sigla: 'S', nome: 'Sul' } },
    { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul', regiao: { id: 4, sigla: 'S', nome: 'Sul' } },
    { id: 29, sigla: 'BA', nome: 'Bahia', regiao: { id: 2, sigla: 'NE', nome: 'Nordeste' } },
    { id: 26, sigla: 'PE', nome: 'Pernambuco', regiao: { id: 2, sigla: 'NE', nome: 'Nordeste' } },
    { id: 23, sigla: 'CE', nome: 'Ceará', regiao: { id: 2, sigla: 'NE', nome: 'Nordeste' } },
    { id: 53, sigla: 'DF', nome: 'Distrito Federal', regiao: { id: 5, sigla: 'CO', nome: 'Centro-Oeste' } },
    { id: 52, sigla: 'GO', nome: 'Goiás', regiao: { id: 5, sigla: 'CO', nome: 'Centro-Oeste' } },
    { id: 15, sigla: 'PA', nome: 'Pará', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
    { id: 13, sigla: 'AM', nome: 'Amazonas', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
  ];
}
