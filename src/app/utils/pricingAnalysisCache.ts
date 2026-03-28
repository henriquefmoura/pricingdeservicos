// ========================================
// Pricing Analysis Cache
// ========================================
// Gerenciamento de cache para dados externos do motor de análise.

const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AnalysisCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Obtém valor do cache se válido.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena valor no cache.
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove uma chave do cache.
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Limpa todo o cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Remove entradas expiradas.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Retorna o número de entradas no cache.
   */
  get size(): number {
    return this.store.size;
  }
}

// Singleton
export const analysisCache = new AnalysisCache();

/**
 * Gera chave de cache para análise de praça.
 */
export function buildCacheKey(
  pracaId: string,
  serviceId: string,
  type: 'territorial' | 'weather' | 'analysis'
): string {
  return `pricing-analysis:${type}:${pracaId}:${serviceId}`;
}
