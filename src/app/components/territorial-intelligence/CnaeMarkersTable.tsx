// ========================================
// CNAE Markers Table — City × CNAE × Google Maps
// ========================================

import { useState, useMemo } from 'react';
import { ExternalLink, MapPin, Search, X, Building2, Users } from 'lucide-react';
import type { TerritorialInsightSummary } from '../../types/territorial';
import type { CnaeServiceCategory } from '../../types/territorial';
import { CNAE_CATEGORY_META, CNAE_CATEGORY_COLORS } from '../../utils/serviceCnaeMappings';

interface Props {
  selectedCity: TerritorialInsightSummary;
}

function buildGoogleMapsUrl(cnaeDescription: string, cityName: string, uf: string): string {
  const query = `${cnaeDescription}, ${cityName}, ${uf}, Brasil`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Format a company/MEI count for display (e.g. 1500 → "1.500") */
function formatCount(n: number | undefined): string {
  if (n == null || n === 0) return '—';
  return n.toLocaleString('pt-BR');
}

export function CnaeMarkersTable({ selectedCity }: Props) {
  const { cnaeInfo, city, uf, addressInfo } = selectedCity;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CnaeServiceCategory | null>(null);

  // Build category groups for the filter chips
  const categoryGroups = useMemo(() => {
    if (!cnaeInfo) return [];
    const counts: Partial<Record<CnaeServiceCategory, number>> = {};
    const order: CnaeServiceCategory[] = ['eletrica', 'pintura', 'hidraulica', 'reforma', 'construcao', 'outros'];
    for (const c of cnaeInfo) {
      const cat = (c.serviceCategory as CnaeServiceCategory) ?? 'outros';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return order.filter((c) => (counts[c] ?? 0) > 0).map((c) => ({ category: c, count: counts[c]! }));
  }, [cnaeInfo]);

  // Filter CNAEs by category chip and keyword across code, description and category
  const filteredCnaes = useMemo(() => {
    if (!cnaeInfo) return [];
    let result = cnaeInfo;
    if (activeCategoryFilter) {
      result = result.filter((c) => ((c.serviceCategory as CnaeServiceCategory) ?? 'outros') === activeCategoryFilter);
    }
    if (!searchQuery.trim()) return result;
    const lower = searchQuery.toLowerCase();
    return result.filter(
      (c) =>
        c.code.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        (c.serviceCategory ?? '').toLowerCase().includes(lower),
    );
  }, [cnaeInfo, searchQuery, activeCategoryFilter]);

  if (!cnaeInfo || cnaeInfo.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#78BE20]" />
          <h3 className="text-sm font-semibold text-gray-800">
            Profissionais por CNAE — {city} ({uf})
          </h3>
          <span className="ml-auto text-xs text-gray-400 font-normal">
            {filteredCnaes.length} / {cnaeInfo.length} atividade{cnaeInfo.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Category filter chips */}
        {cnaeInfo && cnaeInfo.length > 0 && categoryGroups.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              onClick={() => setActiveCategoryFilter(null)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeCategoryFilter === null
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              Todos ({cnaeInfo.length})
            </button>
            {categoryGroups.map(({ category, count }) => {
              const meta = CNAE_CATEGORY_META[category];
              const color = CNAE_CATEGORY_COLORS[category];
              const isActive = activeCategoryFilter === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategoryFilter(isActive ? null : category)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                    isActive ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                  }`}
                  style={isActive ? { background: color, borderColor: color } : {}}
                >
                  <span>{meta.icon}</span>
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Keyword search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por instalação, reforma, construção, hidráulica…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78BE20] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpar filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredCnaes.length === 0 ? (
        /* Empty state when keyword filter returns no results */
        <div className="px-5 py-8 text-center text-sm text-gray-500">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p>Nenhum CNAE encontrado para <strong>"{searchQuery}"</strong></p>
          <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-[#78BE20] hover:underline">
            Limpar filtro
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                  CNAE
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Descrição
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                  Categoria
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24" title="Estabelecimentos formais (RAIS)">
                  <span className="flex items-center justify-end gap-1"><Building2 className="w-3 h-3" />Empresas</span>
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20" title="Microempreendedores individuais">
                  <span className="flex items-center justify-end gap-1"><Users className="w-3 h-3" />MEIs</span>
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Cidade
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">
                  Mapa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCnaes.map((cnae) => {
                const cat = (cnae.serviceCategory ?? 'outros') as CnaeServiceCategory;
                const meta = CNAE_CATEGORY_META[cat];
                const color = CNAE_CATEGORY_COLORS[cat] ?? cnae.color ?? '#6b7280';
                const mapsUrl = buildGoogleMapsUrl(cnae.description, city, uf);

                return (
                  <tr key={cnae.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded text-white whitespace-nowrap"
                        style={{ background: color }}
                      >
                        {cnae.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {cnae.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ background: color }}
                      >
                        <span>{meta?.icon}</span>
                        <span>{meta?.label ?? cat}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700 tabular-nums">
                      {formatCount(cnae.companiesCount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500 tabular-nums">
                      {formatCount(cnae.meisCount)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium">{city} — {uf}</p>
                      {addressInfo?.displayName && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs" title={addressInfo.displayName}>
                          {addressInfo.displayName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Buscar ${cnae.description} em ${city} no Google Maps`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#78BE20]/10 hover:bg-[#78BE20]/20 text-[#78BE20] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addressInfo?.displayName && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500 truncate">{addressInfo.displayName}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressInfo.displayName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex-shrink-0 text-xs text-[#78BE20] hover:text-[#5a9a10] font-medium flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver cidade no Maps
          </a>
        </div>
      )}
    </div>
  );
}
