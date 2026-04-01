// ========================================
// CNAE Markers Table — City × CNAE × Google Maps
// ========================================

import { ExternalLink, MapPin } from 'lucide-react';
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

export function CnaeMarkersTable({ selectedCity }: Props) {
  const { cnaeInfo, city, uf, addressInfo } = selectedCity;

  if (!cnaeInfo || cnaeInfo.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#78BE20]" />
        <h3 className="text-sm font-semibold text-gray-800">
          Profissionais por CNAE — {city} ({uf})
        </h3>
        <span className="ml-auto text-xs text-gray-400 font-normal">
          {cnaeInfo.length} atividade{cnaeInfo.length !== 1 ? 's' : ''}
        </span>
      </div>

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
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Cidade / Endereço
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">
                Mapa
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cnaeInfo.map((cnae) => {
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
