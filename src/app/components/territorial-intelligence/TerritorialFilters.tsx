// ========================================
// Territorial Filters
// ========================================

import { Filter } from 'lucide-react';
import type { TerritorialFilterState, IBGEUF, MunicipalityData } from '../../types/territorial';
import { SERVICE_CNAE_MAPPINGS } from '../../utils/serviceCnaeMappings';

const REGIONS = [
  { id: 'N', name: 'Norte' },
  { id: 'NE', name: 'Nordeste' },
  { id: 'SE', name: 'Sudeste' },
  { id: 'S', name: 'Sul' },
  { id: 'CO', name: 'Centro-Oeste' },
];

interface Props {
  filters: TerritorialFilterState;
  ufs: IBGEUF[];
  municipalities: MunicipalityData[];
  onFilterChange: (p: Partial<TerritorialFilterState>) => void;
  onCitySelect: (ibgeCode: string) => void;
}

export function TerritorialFilters({ filters, ufs, municipalities, onFilterChange, onCitySelect }: Props) {
  const filteredUFs = filters.selectedRegion ? ufs.filter((u) => u.regiao.sigla === filters.selectedRegion) : ufs;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Região</label>
          <select value={filters.selectedRegion ?? ''} onChange={(e) => onFilterChange({ selectedRegion: e.target.value || undefined, selectedUF: undefined, selectedMunicipality: undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Todas</option>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select value={filters.selectedUF ?? ''} onChange={(e) => onFilterChange({ selectedUF: e.target.value || undefined, selectedMunicipality: undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Selecione</option>
            {filteredUFs.map((u) => <option key={u.sigla} value={u.sigla}>{u.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Município</label>
          <select
            value={filters.selectedMunicipality ?? ''}
            onChange={(e) => {
              const ibgeCode = e.target.value;
              onFilterChange({ selectedMunicipality: ibgeCode || undefined });
              if (ibgeCode) onCitySelect(ibgeCode);
            }}
            disabled={!filters.selectedUF}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{filters.selectedUF ? `Selecione (${municipalities.length} cidades)` : 'Selecione um estado'}</option>
            {municipalities.map((m) => (
              <option key={m.ibgeCode} value={m.ibgeCode}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Serviço</label>
          <select value={filters.selectedService ?? ''} onChange={(e) => onFilterChange({ selectedService: e.target.value || undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Todos</option>
            {SERVICE_CNAE_MAPPINGS.map((s) => <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
