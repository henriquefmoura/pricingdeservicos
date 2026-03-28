// ========================================
// Territorial Summary Cards
// ========================================

import { Users, DollarSign, Building2, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TerritorialInsightSummary } from '../../types/territorial';

interface Props {
  summary: TerritorialInsightSummary;
}

function fmt(n: number) { return n.toLocaleString('pt-BR'); }
function fmtCurrency(n: number) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function DeltaBadge({ delta }: { delta?: number | null }) {
  if (delta == null) return null;
  const Icon = delta > 5 ? TrendingUp : delta < -5 ? TrendingDown : Minus;
  const color = delta > 5 ? 'text-green-600' : delta < -5 ? 'text-red-600' : 'text-gray-500';
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />{delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs UF
    </span>
  );
}

const SIZE_LABELS: Record<string, string> = { pequeno: 'Pequeno porte', medio: 'Médio porte', grande: 'Grande porte', metropole: 'Metrópole' };

export function TerritorialSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Population */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">População</span>
        </div>
        <p className="text-xl font-bold text-gray-800">{summary.population != null ? fmt(summary.population) : '—'}</p>
        <span className="text-xs text-gray-400">{summary.municipalitySize ? SIZE_LABELS[summary.municipalitySize] ?? summary.municipalitySize : '—'}</span>
      </div>

      {/* Income */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-600" /></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Renda</span>
        </div>
        <p className="text-xl font-bold text-gray-800">{summary.income != null ? fmtCurrency(summary.income) : '—'}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{summary.incomeLevel ?? '—'}</span>
          <DeltaBadge delta={summary.comparisonVsState?.incomeDeltaPercent} />
        </div>
      </div>

      {/* Companies */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-600" /></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresas</span>
        </div>
        <p className="text-xl font-bold text-gray-800">{summary.relatedCompanies != null ? fmt(summary.relatedCompanies) : '—'}</p>
        <DeltaBadge delta={summary.comparisonVsState?.companiesDeltaPercent} />
      </div>

      {/* MEIs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Briefcase className="w-4 h-4 text-amber-600" /></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">MEIs</span>
        </div>
        <p className="text-xl font-bold text-gray-800">{summary.relatedMEIs != null ? fmt(summary.relatedMEIs) : '—'}</p>
        <DeltaBadge delta={summary.comparisonVsState?.meisDeltaPercent} />
      </div>
    </div>
  );
}
