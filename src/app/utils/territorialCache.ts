// ========================================
// Territorial Cache — localStorage with TTL
// ========================================

const CACHE_PREFIX = 'territorial_cache_';

export const LOCALITIES_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const INDICATORS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAP_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const COMPANIES_TTL_MS = 24 * 60 * 60 * 1000;

export function setTerritorialCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now(), ttl: ttlMs }));
  } catch { /* ignore */ }
}

export function getTerritorialCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export function clearTerritorialCache(key: string): void {
  try { localStorage.removeItem(CACHE_PREFIX + key); } catch { /* ignore */ }
}

export function clearAllTerritorialCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function municipalityCacheKey(ibgeCode: string): string {
  return `mun_${ibgeCode}`;
}

export function companyCacheKey(ibgeCode: string, cnae?: string): string {
  return cnae ? `comp_${ibgeCode}_${cnae}` : `comp_${ibgeCode}`;
}

export function mapCacheKey(level: string, code: string): string {
  return `map_${level}_${code}`;
}
