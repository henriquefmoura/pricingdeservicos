// ========================================
// Territorial Dashboard — Main Orchestrator
// ========================================

import { useState } from 'react';
import { useTerritorialIntelligence } from '../../hooks/useTerritorialIntelligence';
import { TerritorialMap } from './TerritorialMap';
import { TerritorialSidebar } from './TerritorialSidebar';
import { TerritorialFilters } from './TerritorialFilters';
import { TerritorialSkeleton } from './TerritorialSkeleton';
import { MunicipalityComparisonPanel } from './MunicipalityComparisonPanel';
import { TerritorialChart } from './TerritorialChart';
import { MapPin, Pin, X } from 'lucide-react';

// Major cities quick-select
const QUICK_CITIES = [
  { ibgeCode: '3550308', name: 'São Paulo', uf: 'SP' },
  { ibgeCode: '3304557', name: 'Rio de Janeiro', uf: 'RJ' },
  { ibgeCode: '3106200', name: 'Belo Horizonte', uf: 'MG' },
  { ibgeCode: '4106902', name: 'Curitiba', uf: 'PR' },
  { ibgeCode: '4314902', name: 'Porto Alegre', uf: 'RS' },
];

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
    pinnedCities,
    pinCity,
    unpinCity,
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
    const uf = ufs.find((u) => String(u.id) === ufCode);
    if (uf) handleFilterChange({ selectedUF: uf.sigla });
  };

  const handleCityClick = (ibgeCode: string, _name: string) => {
    setFilters({ selectedMunicipality: ibgeCode });
    selectCity(ibgeCode);
  };

  // Quick-select a major city: auto-set UF filter, load city data
  const handleQuickCity = (ibgeCode: string, uf: string) => {
    handleFilterChange({ selectedUF: uf, selectedMunicipality: ibgeCode });
    selectCity(ibgeCode);
  };

  const isPinned = selectedCity ? pinnedCities.some((c) => c.ibgeCode === selectedCity.ibgeCode) : false;
  const handlePinToggle = () => {
    if (!selectedCity) return;
    if (isPinned) {
      unpinCity(selectedCity.ibgeCode);
    } else {
      pinCity(selectedCity.ibgeCode);
    }
  };

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

      {/* Quick city selection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Acesso rápido:</span>
        {QUICK_CITIES.map((city) => (
          <button
            key={city.ibgeCode}
            onClick={() => handleQuickCity(city.ibgeCode, city.uf)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              selectedCity?.ibgeCode === city.ibgeCode
                ? 'bg-[#78BE20] text-white border-[#78BE20]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#78BE20] hover:text-[#78BE20]'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {city.name} ({city.uf})
          </button>
        ))}
      </div>

      {/* Pinned cities bar */}
      {pinnedCities.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">Cidades Fixadas ({pinnedCities.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pinnedCities.map((city) => (
              <div key={city.ibgeCode} className="flex items-center gap-1.5 bg-white border border-violet-200 rounded-lg px-2.5 py-1">
                <button
                  onClick={() => {
                    handleFilterChange({ selectedUF: city.uf, selectedMunicipality: city.ibgeCode });
                    selectCity(city.ibgeCode);
                  }}
                  className="text-xs font-medium text-violet-700 hover:text-violet-900"
                >
                  {city.city} ({city.uf})
                </button>
                <button
                  onClick={() => unpinCity(city.ibgeCode)}
                  className="text-violet-400 hover:text-violet-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline error banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { clearSelection(); }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <TerritorialFilters
        filters={filters}
        ufs={ufs}
        municipalities={municipalities}
        onFilterChange={handleFilterChange}
        onCitySelect={(ibgeCode) => selectCity(ibgeCode)}
      />

      {loading && !selectedCity ? (
        <TerritorialSkeleton />
      ) : (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Map + Charts */}
          <div className="flex-1 space-y-5">
            <TerritorialMap
              selectedUF={filters.selectedUF}
              selectedIbgeCode={selectedCity?.ibgeCode}
              totalCompanies={selectedCity?.relatedCompanies}
              pinnedCities={pinnedCities}
              onCityClick={handleCityClick}
              onStateClick={handleStateClick}
            />

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
              onPinClick={handlePinToggle}
              isPinned={isPinned}
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
