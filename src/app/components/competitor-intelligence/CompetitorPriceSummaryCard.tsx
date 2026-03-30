// ========================================
// Competitor Price Summary Card
// ========================================

import { DollarSign, TrendingUp, BarChart3, Hash } from 'lucide-react';
import type { CompetitorPriceSummary } from '../../types/competitor';
import { CompetitorConfidenceBadge } from './CompetitorConfidenceBadge';

interface Props {
  summary: CompetitorPriceSummary;
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CompetitorPriceSummaryCard({ summary }: Props) {
  const dispersionPct = Math.round(summary.dispersion * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{summary.service}</h3>
          <p className="text-sm text-gray-500">{summary.city}</p>
        </div>
        <CompetitorConfidenceBadge score={summary.confidenceScore} level={summary.confidenceLevel} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Median */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mediana</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{fmtBRL(summary.median)}</p>
          <span className="text-xs text-gray-400">Referência central</span>
        </div>

        {/* Average */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Média</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{fmtBRL(summary.average)}</p>
          <span className="text-xs text-gray-400">{summary.priceRange}</span>
        </div>

        {/* Dispersion */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dispersão</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{dispersionPct}%</p>
          <span className="text-xs text-gray-400">
            {dispersionPct > 40 ? 'Mercado fragmentado' : dispersionPct < 15 ? 'Preço consolidado' : 'Moderada'}
          </span>
        </div>

        {/* Sample Size */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Hash className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amostras</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{summary.sampleSize}</p>
          <span className="text-xs text-gray-400">{summary.sources.length} fontes</span>
        </div>
      </div>
    </div>
  );
}
