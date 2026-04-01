// ========================================
// CNAE Service — Enhanced IBGE Integration
// ========================================
// Integra com a API oficial do IBGE para CNAEs v2
// https://servicodados.ibge.gov.br/api/docs/CNAE?versao=2

import { getTerritorialCache, setTerritorialCache, LOCALITIES_TTL_MS } from '../../utils/territorialCache';
import { getMappingByServiceId, SERVICE_CNAE_MAPPINGS } from '../../utils/serviceCnaeMappings';

const BASE = 'https://servicodados.ibge.gov.br/api/v2/cnae';

// ----------------------------------------
// Types
// ----------------------------------------

export interface CnaeClass {
  id: string;
  descricao: string;
}

export interface CnaeSubclass {
  id: string;
  descricao: string;
  classe?: CnaeClass;
}

export interface ServiceCnaeResult {
  serviceId: string;
  serviceName: string;
  cnaeCodes: string[];
  cnaeDescriptions: CnaeSubclass[];
}

// ----------------------------------------
// Cache keys
// ----------------------------------------

const CACHE_CLASSES = 'cnae_classes_all';
const CACHE_SUBCLASSES = 'cnae_subclasses_all';

// ----------------------------------------
// API Functions
// ----------------------------------------

/**
 * Busca todas as classes CNAE disponíveis.
 */
export async function getCnaeClasses(): Promise<CnaeClass[]> {
  const cached = getTerritorialCache<CnaeClass[]>(CACHE_CLASSES);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE}/classes`);
    if (!res.ok) return [];
    const data = await res.json();
    const result: CnaeClass[] = (Array.isArray(data) ? data : []).map((d: { id: string; descricao: string }) => ({
      id: d.id,
      descricao: d.descricao,
    }));
    setTerritorialCache(CACHE_CLASSES, result, LOCALITIES_TTL_MS);
    return result;
  } catch {
    return [];
  }
}

/**
 * Busca todas as subclasses CNAE disponíveis.
 */
export async function getCnaeSubclasses(): Promise<CnaeSubclass[]> {
  const cached = getTerritorialCache<CnaeSubclass[]>(CACHE_SUBCLASSES);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE}/subclasses`);
    if (!res.ok) return [];
    const data = await res.json();
    const result: CnaeSubclass[] = (Array.isArray(data) ? data : []).map(
      (d: { id: string; descricao: string }) => ({
        id: d.id,
        descricao: d.descricao,
      })
    );
    setTerritorialCache(CACHE_SUBCLASSES, result, LOCALITIES_TTL_MS);
    return result;
  } catch {
    return [];
  }
}

/**
 * Busca uma subclasse CNAE específica por código.
 */
export async function fetchCnaeByCode(code: string): Promise<CnaeSubclass | null> {
  const key = `cnae_${code}`;
  const cached = getTerritorialCache<CnaeSubclass>(key);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE}/subclasses/${code}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) return null;
    const result: CnaeSubclass = { id: item.id, descricao: item.descricao };
    setTerritorialCache(key, result, LOCALITIES_TTL_MS);
    return result;
  } catch {
    return null;
  }
}

/**
 * Mapeia um serviceId do sistema para os CNAEs correspondentes,
 * retornando as descrições oficiais da API do IBGE.
 */
export async function mapServiceToCnae(serviceId: string): Promise<ServiceCnaeResult | null> {
  const mapping = getMappingByServiceId(serviceId);
  if (!mapping) return null;

  const descriptions: CnaeSubclass[] = [];
  for (const code of mapping.cnaeCodes) {
    const cleanCode = code.replace(/[-/]/g, '');
    const result = await fetchCnaeByCode(cleanCode);
    if (result) {
      descriptions.push(result);
    } else {
      descriptions.push({ id: code, descricao: `Subclasse CNAE ${code}` });
    }
  }

  return {
    serviceId: mapping.serviceId,
    serviceName: mapping.serviceName,
    cnaeCodes: mapping.cnaeCodes,
    cnaeDescriptions: descriptions,
  };
}

/**
 * Busca todas as subclasses CNAE da seção F (Construção) e serviços correlatos
 * diretamente da API oficial do IBGE CNAE 2.0.
 * Inclui divisões 41xx, 42xx, 43xx e serviços 8121, 8129, 8130, 3104, 3321.
 *
 * Esta função é a fonte primária de CNAEs para a Inteligência Territorial,
 * cobrindo toda a base de estabelecimentos do CAGED/RAIS para construção civil.
 */
export async function fetchAllConstructionCnaes(): Promise<CnaeSubclass[]> {
  const CACHE_KEY = 'cnae_construction_all';
  const cached = getTerritorialCache<CnaeSubclass[]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE}/subclasses`);
    if (!res.ok) return [];
    const data: Array<{ id: string; descricao: string }> = await res.json();

    // Filter: Section F (41xx, 42xx, 43xx), plus related service codes.
    // EXTRA_CODES must use the 7-char cleaned format (hyphens/slashes removed)
    // to match what String(d.id).replace(/[-/]/g,'') produces from IBGE API IDs.
    const CONSTRUCTION_PREFIXES = ['41', '42', '43'];
    const EXTRA_CODES = new Set(['8121400', '8129000', '8130300', '3104700', '3321000']);

    const result: CnaeSubclass[] = (Array.isArray(data) ? data : [])
      .filter((d) => {
        const id = String(d.id).replace(/[-/]/g, '');
        return (
          CONSTRUCTION_PREFIXES.some((p) => id.startsWith(p)) ||
          EXTRA_CODES.has(id)
        );
      })
      .map((d) => ({ id: d.id, descricao: d.descricao }));

    if (result.length > 0) {
      setTerritorialCache(CACHE_KEY, result, LOCALITIES_TTL_MS);
    }
    return result;
  } catch {
    return [];
  }
}
export async function searchCnae(query: string): Promise<CnaeSubclass[]> {
  try {
    const res = await fetch(`${BASE}/subclasses`);
    if (!res.ok) return [];
    const data: CnaeSubclass[] = await res.json();
    const lower = query.toLowerCase();
    return data.filter((d) => d.descricao.toLowerCase().includes(lower)).slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Retorna todos os mappings service ↔ CNAE disponíveis no sistema.
 */
export function getAllServiceCnaeMappings() {
  return SERVICE_CNAE_MAPPINGS;
}
