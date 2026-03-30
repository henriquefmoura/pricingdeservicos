// ========================================
// useTerritorialIntelligence Hook
// ========================================

import { useState, useEffect, useCallback } from 'react';
import type { TerritorialInsightSummary, TerritorialComparisonResult, TerritorialFilterState, MunicipalityData } from '../types/territorial';
import type { IBGEUF } from '../types/territorial';
import { runTerritorialAnalysis, compareTerritorial } from '../services/territorialPricingEngine';
import { fetchUFs, fetchMunicipiosByUF } from '../services/ibgeLocalitiesService';
import { normalizeMunicipalityData } from '../utils/territorialMapper';

export interface UseTerritorialIntelligenceReturn {
  ufs: IBGEUF[];
  municipalities: MunicipalityData[];
  filters: TerritorialFilterState;
  setFilters: (f: Partial<TerritorialFilterState>) => void;
  selectedCity: TerritorialInsightSummary | null;
  selectCity: (ibgeCode: string) => Promise<void>;
  clearSelection: () => void;
  comparison: TerritorialComparisonResult | null;
  compareWith: (ibgeCode: string) => Promise<void>;
  clearComparison: () => void;
  loading: boolean;
  loadingCity: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTerritorialIntelligence(serviceId?: string): UseTerritorialIntelligenceReturn {
  const [ufs, setUFs] = useState<IBGEUF[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [filters, setFiltersState] = useState<TerritorialFilterState>({});
  const [selectedCity, setSelectedCity] = useState<TerritorialInsightSummary | null>(null);
  const [comparison, setComparison] = useState<TerritorialComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUFs()
      .then((data) => { if (!cancelled) setUFs(data); })
      .catch(() => { if (!cancelled) setError('Erro ao carregar estados.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!filters.selectedUF) { setMunicipalities([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchMunicipiosByUF(filters.selectedUF)
      .then((data) => { if (!cancelled) setMunicipalities(data.map(normalizeMunicipalityData)); })
      .catch(() => { if (!cancelled) setError('Erro ao carregar municípios.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters.selectedUF]);

  const setFilters = useCallback((partial: Partial<TerritorialFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    if (partial.selectedUF || partial.selectedRegion) {
      setSelectedCity(null);
      setComparison(null);
      setError(null);
    }
  }, []);

  const selectCity = useCallback(async (ibgeCode: string) => {
    setLoadingCity(true);
    setError(null);
    try {
      const summary = await runTerritorialAnalysis(ibgeCode, serviceId);
      setSelectedCity(summary);
    } catch {
      setError('Erro ao carregar dados do município.');
    } finally {
      setLoadingCity(false);
    }
  }, [serviceId]);

  const clearSelection = useCallback(() => { setSelectedCity(null); setComparison(null); setError(null); }, []);

  const compareWith = useCallback(async (ibgeCode: string) => {
    if (!selectedCity) return;
    setLoadingCity(true);
    try {
      const result = await compareTerritorial(selectedCity.ibgeCode, ibgeCode, serviceId);
      setComparison(result);
    } catch {
      setError('Erro ao comparar municípios.');
    } finally {
      setLoadingCity(false);
    }
  }, [selectedCity, serviceId]);

  const clearComparison = useCallback(() => setComparison(null), []);

  const refresh = useCallback(async () => {
    if (selectedCity) await selectCity(selectedCity.ibgeCode);
  }, [selectedCity, selectCity]);

  return {
    ufs,
    municipalities,
    filters,
    setFilters,
    selectedCity,
    selectCity,
    clearSelection,
    comparison,
    compareWith,
    clearComparison,
    loading,
    loadingCity,
    error,
    refresh,
  };
}
