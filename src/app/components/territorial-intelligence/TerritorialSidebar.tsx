// ========================================
// Territorial Sidebar — City Detail Panel
// ========================================

import { X, MapPin, RefreshCw, Tag } from 'lucide-react';
import type { TerritorialInsightSummary } from '../../types/territorial';
import { OfferPressureBadge, PricingProfileBadge } from './TerritorialBadges';
import { TerritorialSummaryCards } from './TerritorialSummaryCards';
import { TerritorialInsightsPanel } from './TerritorialInsightsPanel';

interface Props {
  summary: TerritorialInsightSummary;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onCompareClick?: () => void;
}

export function TerritorialSidebar({ summary, loading, onClose, onRefresh, onCompareClick }: Props) {
  return (
    <div className="bg-white border-l border-gray-200 w-full lg:w-[480px] h-full overflow-y-auto shadow-lg">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#78BE20]" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">{summary.city}</h2>
            <p className="text-xs text-gray-500">{summary.uf} · Código IBGE: {summary.ibgeCode} · {summary.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button onClick={onRefresh} disabled={loading} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <PricingProfileBadge profile={summary.pricingProfile} />
          <OfferPressureBadge level={summary.offerPressure} />
        </div>

        {/* Summary Cards */}
        <TerritorialSummaryCards summary={summary} />

        {/* CNAE Information */}
        {summary.cnaeInfo && summary.cnaeInfo.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-[#78BE20]" />
              <h3 className="text-sm font-semibold text-gray-700">CNAEs Relacionados (IBGE)</h3>
            </div>
            <div className="space-y-2">
              {summary.cnaeInfo.map((cnae) => (
                <div key={cnae.code} className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-mono text-[#78BE20] bg-[#78BE20]/10 px-2 py-0.5 rounded whitespace-nowrap">{cnae.code}</span>
                  <span className="text-sm text-gray-700">{cnae.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <TerritorialInsightsPanel insights={summary.insights} />

        {/* Compare Button */}
        {onCompareClick && (
          <button
            onClick={onCompareClick}
            className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Comparar com outra cidade
          </button>
        )}
      </div>
    </div>
  );
}
