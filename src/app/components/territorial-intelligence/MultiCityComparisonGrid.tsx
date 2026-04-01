// ========================================
// Multi-City Comparison Grid
// ========================================
// Shows key metrics for multiple pinned cities side-by-side

import { X, MapPin, Building2, Users, TrendingUp } from 'lucide-react';
import type { TerritorialInsightSummary } from '../../types/territorial';
import { OfferPressureBadge, PricingProfileBadge } from './TerritorialBadges';

interface Props {
  cities: TerritorialInsightSummary[];
  onRemoveCity: (ibgeCode: string) => void;
  onSelectCity: (city: TerritorialInsightSummary) => void;
}

function fmt(n: number | null | undefined, suffix = '') {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${n}${suffix}`;
}

function fmtCurrency(n: number | null | undefined) {
  if (n == null) return '—';
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function MultiCityComparisonGrid({ cities, onRemoveCity, onSelectCity }: Props) {
  if (cities.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-violet-800">
          Comparação de Praças ({cities.length} {cities.length === 1 ? 'cidade' : 'cidades'})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-gray-500 pb-2 pr-4 whitespace-nowrap">Cidade / UF</th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />População</span>
              </th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Renda Média</span>
              </th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />Empresas</span>
              </th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">MEIs</th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">Oferta</th>
              <th className="text-xs font-semibold text-gray-500 pb-2 px-3 whitespace-nowrap">Perfil</th>
              <th className="text-xs font-semibold text-gray-500 pb-2 pl-3 whitespace-nowrap">CNAEs</th>
              <th className="pb-2 pl-2"></th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city, idx) => (
              <tr
                key={city.ibgeCode}
                className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50/40' : 'bg-white'}`}
              >
                {/* City name */}
                <td className="py-2.5 pr-4">
                  <button
                    onClick={() => onSelectCity(city)}
                    className="flex items-center gap-1.5 text-left hover:text-[#78BE20] transition-colors group"
                  >
                    <MapPin className="w-3 h-3 text-violet-500 flex-shrink-0 group-hover:text-[#78BE20]" />
                    <span className="font-medium text-gray-800 group-hover:text-[#78BE20] whitespace-nowrap">
                      {city.city}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">({city.uf})</span>
                  </button>
                </td>

                {/* Population */}
                <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                  {fmt(city.population)}
                </td>

                {/* Income */}
                <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                  {fmtCurrency(city.income)}
                </td>

                {/* Companies */}
                <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                  {fmt(city.relatedCompanies)}
                </td>

                {/* MEIs */}
                <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                  {fmt(city.relatedMEIs)}
                </td>

                {/* Offer pressure */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <OfferPressureBadge level={city.offerPressure} />
                </td>

                {/* Pricing profile */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <PricingProfileBadge profile={city.pricingProfile} />
                </td>

                {/* CNAE count */}
                <td className="py-2.5 pl-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {city.cnaeInfo?.length ?? 0} CNAEs
                  </span>
                </td>

                {/* Remove */}
                <td className="py-2.5 pl-2">
                  <button
                    onClick={() => onRemoveCity(city.ibgeCode)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title={`Remover ${city.city}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary insight row */}
      {cities.length >= 2 && (() => {
        const sorted = [...cities].sort((a, b) => (b.income ?? 0) - (a.income ?? 0));
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (!best.income || !worst.income || worst.income === 0 || best.ibgeCode === worst.ibgeCode) return null;
        return (
          <div className="mt-3 pt-3 border-t border-violet-100 flex items-start gap-2 text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2">
            <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>
              <strong>{best.city}</strong> tem a maior renda média ({fmtCurrency(best.income)}),
              {' '}{Math.round(((best.income - worst.income) / worst.income) * 100)}% acima de{' '}
              <strong>{worst.city}</strong> ({fmtCurrency(worst.income)}).
            </p>
          </div>
        );
      })()}
    </div>
  );
}
