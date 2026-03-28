// ========================================
// IBGE Map Service — GeoJSON
// ========================================

import { getTerritorialCache, setTerritorialCache, MAP_TTL_MS, mapCacheKey } from '../utils/territorialCache';

const BASE = 'https://servicodados.ibge.gov.br/api/v3/malhas';

// Minimal GeoJSON types to avoid @types/geojson dependency
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: Array<{ type: 'Feature'; properties: any; geometry: any; id?: string | number }>;
}

export async function fetchBrazilStatesGeoJSON(): Promise<GeoJSONFeatureCollection> {
  const key = mapCacheKey('states', 'BR');
  const cached = getTerritorialCache<GeoJSONFeatureCollection>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&resolucao=2`);
    if (!res.ok) throw new Error(`Map: ${res.status}`);
    const data = await res.json();
    setTerritorialCache(key, data, MAP_TTL_MS);
    return data;
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

export async function fetchMunicipiosGeoJSON(ufCode: string): Promise<GeoJSONFeatureCollection> {
  const key = mapCacheKey('municipios', ufCode);
  const cached = getTerritorialCache<GeoJSONFeatureCollection>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}/estados/${ufCode}?intrarregiao=municipio&formato=application/vnd.geo+json&resolucao=2`);
    if (!res.ok) throw new Error(`Map municipios: ${res.status}`);
    const data = await res.json();
    setTerritorialCache(key, data, MAP_TTL_MS);
    return data;
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}
