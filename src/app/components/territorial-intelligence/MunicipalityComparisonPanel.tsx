// ========================================
// Municipality Comparison Panel
// ========================================

import { ArrowLeftRight } from 'lucide-react';
import type { TerritorialComparisonResult } from '../../types/territorial';
import { TerritorialInsightsPanel } from './TerritorialInsightsPanel';
import { OfferPressureBadge, PricingProfileBadge } from './TerritorialBadges';

interface Props {
  comparison: TerritorialComparisonResult;
  onClose: () => void;
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }
function fmtCurrency(n: number) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function ratioLabel(r: number | null | undefined) {
  if (r == null) return '—';
  return r > 1 ? `${((r - 1) * 100).toFixed(0)}% maior` : r < 1 ? `${((1 - r) * 100).toFixed(0)}% menor` : 'Igual';
}

export function MunicipalityComparisonPanel({ comparison, onClose }: Props) {
  const { cityA, cityB } = comparison;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-[#78BE20]" />
          <h3 className="text-sm font-semibold text-gray-800">Comparativo</h3>
        </div>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">Fechar</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs text-gray-500 font-medium">Indicador</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">{cityA.city}</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">{cityB.city}</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">Razão</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">População</td>
              <td className="py-2 text-right font-medium">{cityA.population != null ? fmt(cityA.population) : '—'}</td>
              <td className="py-2 text-right font-medium">{cityB.population != null ? fmt(cityB.population) : '—'}</td>
              <td className="py-2 text-right text-xs text-gray-500">{ratioLabel(comparison.populationRatio)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">Renda</td>
              <td className="py-2 text-right font-medium">{cityA.income != null ? fmtCurrency(cityA.income) : '—'}</td>
              <td className="py-2 text-right font-medium">{cityB.income != null ? fmtCurrency(cityB.income) : '—'}</td>
              <td className="py-2 text-right text-xs text-gray-500">{ratioLabel(comparison.incomeRatio)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">Empresas</td>
              <td className="py-2 text-right font-medium">{cityA.relatedCompanies != null ? fmt(cityA.relatedCompanies) : '—'}</td>
              <td className="py-2 text-right font-medium">{cityB.relatedCompanies != null ? fmt(cityB.relatedCompanies) : '—'}</td>
              <td className="py-2 text-right text-xs text-gray-500">{ratioLabel(comparison.companyRatio)}</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-700">MEIs</td>
              <td className="py-2 text-right font-medium">{cityA.relatedMEIs != null ? fmt(cityA.relatedMEIs) : '—'}</td>
              <td className="py-2 text-right font-medium">{cityB.relatedMEIs != null ? fmt(cityB.relatedMEIs) : '—'}</td>
              <td className="py-2 text-right text-xs text-gray-500">{ratioLabel(comparison.meiRatio)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Profile badges */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{cityA.city}</p>
          <div className="flex gap-1"><PricingProfileBadge profile={cityA.pricingProfile} /><OfferPressureBadge level={cityA.offerPressure} /></div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{cityB.city}</p>
          <div className="flex gap-1"><PricingProfileBadge profile={cityB.pricingProfile} /><OfferPressureBadge level={cityB.offerPressure} /></div>
        </div>
      </div>

      <TerritorialInsightsPanel insights={comparison.insights} title="Insights comparativos" />
    </div>
  );
}
