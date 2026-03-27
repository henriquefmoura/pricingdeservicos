// ========================================
// Weather Cache — localStorage with TTL
// ========================================

import type { CacheEntry } from '../types/weather';

const CACHE_PREFIX = 'weather_cache_';

/** TTL padrão para coordenadas: 7 dias */
export const COORDS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** TTL padrão para dados climáticos: 15 minutos */
export const WEATHER_TTL_MS = 15 * 60 * 1000;

/**
 * Salva um valor no cache localStorage com TTL.
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage cheio ou indisponível — ignora silenciosamente
  }
}

/**
 * Recupera um valor do cache. Retorna `null` se expirado ou inexistente.
 */
export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Remove uma entrada específica do cache.
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // ignora
  }
}

/**
 * Remove todas as entradas do cache de clima.
 */
export function clearAllWeatherCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignora
  }
}

/**
 * Gera chave de cache para coordenadas de uma cidade.
 */
export function coordsCacheKey(city: string): string {
  return `coords_${city.toLowerCase().trim()}`;
}

/**
 * Gera chave de cache para dados climáticos.
 */
export function weatherCacheKey(lat: number, lon: number, startDate: string, endDate: string): string {
  return `weather_${lat.toFixed(2)}_${lon.toFixed(2)}_${startDate}_${endDate}`;
}
