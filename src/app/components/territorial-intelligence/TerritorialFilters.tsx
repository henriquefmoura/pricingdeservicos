// ========================================
// Territorial Filters
// ========================================

import { Search, Filter } from 'lucide-react';
import type { TerritorialFilterState, IBGEUF } from '../../types/territorial';
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
  onFilterChange: (p: Partial<TerritorialFilterState>) => void;
}

export function TerritorialFilters({ filters, ufs, onFilterChange }: Props) {
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
          <select value={filters.selectedRegion ?? ''} onChange={(e) => onFilterChange({ selectedRegion: e.target.value || undefined, selectedUF: undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Todas</option>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select value={filters.selectedUF ?? ''} onChange={(e) => onFilterChange({ selectedUF: e.target.value || undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Selecione</option>
            {filteredUFs.map((u) => <option key={u.sigla} value={u.sigla}>{u.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Serviço</label>
          <select value={filters.selectedService ?? ''} onChange={(e) => onFilterChange({ selectedService: e.target.value || undefined })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent">
            <option value="">Todos</option>
            {SERVICE_CNAE_MAPPINGS.map((s) => <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Buscar município</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={filters.searchQuery ?? ''} onChange={(e) => onFilterChange({ searchQuery: e.target.value || undefined })} placeholder="Nome..." className="w-full text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2 bg-white focus:ring-2 focus:ring-[#78BE20] focus:border-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
