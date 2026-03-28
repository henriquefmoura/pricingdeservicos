// ========================================
// Territorial Dashboard — Main Orchestrator
// ========================================

import { useState } from 'react';
import { useTerritorialIntelligence } from '../../hooks/useTerritorialIntelligence';
import { TerritorialMap } from './TerritorialMap';
import { TerritorialSidebar } from './TerritorialSidebar';
import { TerritorialFilters } from './TerritorialFilters';
import { TerritorialSkeleton } from './TerritorialSkeleton';
import { TerritorialErrorState } from './TerritorialErrorState';
import { MunicipalityComparisonPanel } from './MunicipalityComparisonPanel';
import { TerritorialChart } from './TerritorialChart';
import { MapPin } from 'lucide-react';

export function TerritorialDashboard() {
  const [activeService, setActiveService] = useState<string | undefined>(undefined);

  const {
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
  } = useTerritorialIntelligence(activeService);

  const [showCompareInput, setShowCompareInput] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');

  const handleFilterChange = (partial: Partial<typeof filters>) => {
    if (partial.selectedService !== undefined) {
      setActiveService(partial.selectedService);
    }
    setFilters(partial);
  };

  const filteredForCompare = compareSearch
    ? municipalities.filter((m) => m.name.toLowerCase().includes(compareSearch.toLowerCase())).slice(0, 10)
    : [];

  const handleStateClick = (ufCode: string) => {
    // Map IBGE UF numeric code to sigla
    const uf = ufs.find((u) => String(u.id) === ufCode);
    if (uf) handleFilterChange({ selectedUF: uf.sigla });
  };

  const handleCityClick = (ibgeCode: string, _name: string) => {
    selectCity(ibgeCode);
  };

  if (error && !selectedCity && !loading) {
    return <TerritorialErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#78BE20]/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-[#78BE20]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inteligência Territorial</h1>
          <p className="text-sm text-gray-500">Análise socioeconômica e de oferta por praça</p>
        </div>
      </div>

      {/* Filters */}
      <TerritorialFilters filters={filters} ufs={ufs} onFilterChange={handleFilterChange} />

      {loading && !selectedCity ? (
        <TerritorialSkeleton />
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Map + Charts */}
          <div className="flex-1 space-y-5">
            <TerritorialMap
              selectedUF={filters.selectedUF}
              selectedIbgeCode={selectedCity?.ibgeCode}
              onCityClick={handleCityClick}
              onStateClick={handleStateClick}
            />

            {/* Municipality list */}
            {municipalities.length > 0 && !selectedCity && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Municípios ({municipalities.length})
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {municipalities.slice(0, 50).map((m) => (
                    <button
                      key={m.ibgeCode}
                      onClick={() => selectCity(m.ibgeCode)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span className="text-gray-700">{m.name}</span>
                      <span className="text-xs text-gray-400">{m.ibgeCode}</span>
                    </button>
                  ))}
                  {municipalities.length > 50 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Use a busca para encontrar mais municípios
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Comparison */}
            {comparison && (
              <MunicipalityComparisonPanel comparison={comparison} onClose={clearComparison} />
            )}

            {/* Chart preview when multiple cities analyzed */}
            {selectedCity && municipalities.length > 0 && (
              <TerritorialChart
                cities={[selectedCity]}
                metric="income"
                title="Renda da Praça Selecionada"
              />
            )}
          </div>

          {/* Sidebar */}
          {selectedCity && (
            <TerritorialSidebar
              summary={selectedCity}
              loading={loadingCity}
              onClose={clearSelection}
              onRefresh={refresh}
              onCompareClick={() => setShowCompareInput(true)}
            />
          )}
        </div>
      )}

      {/* Compare Modal */}
      {showCompareInput && selectedCity && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCompareInput(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Comparar {selectedCity.city} com:</h3>
            <input
              type="text"
              value={compareSearch}
              onChange={(e) => setCompareSearch(e.target.value)}
              placeholder="Buscar município..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-[#78BE20] focus:border-transparent"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredForCompare.map((m) => (
                <button
                  key={m.ibgeCode}
                  onClick={() => {
                    compareWith(m.ibgeCode);
                    setShowCompareInput(false);
                    setCompareSearch('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg"
                >
                  {m.name} <span className="text-xs text-gray-400">({m.ibgeCode})</span>
                </button>
              ))}
              {compareSearch && filteredForCompare.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum município encontrado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
