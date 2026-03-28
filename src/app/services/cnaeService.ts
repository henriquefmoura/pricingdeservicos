// ========================================
// CNAE Service
// ========================================

import { getTerritorialCache, setTerritorialCache, LOCALITIES_TTL_MS } from '../utils/territorialCache';

const BASE = 'https://servicodados.ibge.gov.br/api/v2/cnae';

interface CnaeResult {
  id: string;
  descricao: string;
}

export async function fetchCnaeByCode(code: string): Promise<CnaeResult | null> {
  const key = `cnae_${code}`;
  const cached = getTerritorialCache<CnaeResult>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/subclasses/${code}`);
    if (!res.ok) return null;
    const data = await res.json();
    const result = Array.isArray(data) ? data[0] : data;
    if (result) setTerritorialCache(key, { id: result.id, descricao: result.descricao }, LOCALITIES_TTL_MS);
    return result ? { id: result.id, descricao: result.descricao } : null;
  } catch {
    return null;
  }
}

export async function searchCnae(query: string): Promise<CnaeResult[]> {
  try {
    const res = await fetch(`${BASE}/subclasses`);
    if (!res.ok) return [];
    const data: CnaeResult[] = await res.json();
    const lower = query.toLowerCase();
    return data.filter((d) => d.descricao.toLowerCase().includes(lower)).slice(0, 20);
  } catch {
    return [];
  }
}
