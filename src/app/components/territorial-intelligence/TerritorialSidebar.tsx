// ========================================
// Territorial Sidebar — City Detail Panel
// ========================================

import { X, MapPin, RefreshCw, Tag, Navigation, Pin } from 'lucide-react';
import type { TerritorialInsightSummary } from '../../types/territorial';
import type { CnaeServiceCategory } from '../../types/territorial';
import { CNAE_CATEGORY_META, CNAE_CATEGORY_COLORS } from '../../utils/serviceCnaeMappings';
import { OfferPressureBadge, PricingProfileBadge } from './TerritorialBadges';
import { TerritorialSummaryCards } from './TerritorialSummaryCards';
import { TerritorialInsightsPanel } from './TerritorialInsightsPanel';

interface Props {
  summary: TerritorialInsightSummary;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onCompareClick?: () => void;
  onPinClick?: () => void;
  isPinned?: boolean;
}

// Group CNAE items by service category
function groupCnaeByCategory(cnaeInfo: TerritorialInsightSummary['cnaeInfo']) {
  const groups: Partial<Record<CnaeServiceCategory, typeof cnaeInfo>> = {};
  const order: CnaeServiceCategory[] = ['eletrica', 'pintura', 'hidraulica', 'reforma', 'outros'];
  for (const item of cnaeInfo ?? []) {
    const cat: CnaeServiceCategory = (item.serviceCategory as CnaeServiceCategory) ?? 'outros';
    if (!groups[cat]) groups[cat] = [];
    groups[cat]!.push(item);
  }
  return order.filter((c) => groups[c]?.length).map((c) => ({ category: c, items: groups[c]! }));
}

export function TerritorialSidebar({ summary, loading, onClose, onRefresh, onCompareClick, onPinClick, isPinned }: Props) {
  const hasCnae = summary.cnaeInfo && summary.cnaeInfo.length > 0;
  const cnaeGroups = groupCnaeByCategory(summary.cnaeInfo);

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
          {onPinClick && (
            <button
              onClick={onPinClick}
              title={isPinned ? 'Desafixar cidade' : 'Fixar cidade para comparação'}
              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
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

        {/* Address / Location */}
        {summary.addressInfo && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-[#78BE20]" />
              <h3 className="text-sm font-semibold text-gray-700">Localização</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="leading-relaxed">{summary.addressInfo.displayName}</p>
              {summary.addressInfo.postcode && (
                <p className="text-xs text-gray-500">CEP: {summary.addressInfo.postcode}</p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(summary.addressInfo.displayName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#78BE20] hover:text-[#5a9a10] font-medium mt-1"
              >
                <MapPin className="w-3 h-3" />
                Ver no Google Maps
              </a>
            </div>
          </div>
        )}

        {/* CNAE Information — grouped by activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#78BE20]" />
              <h3 className="text-sm font-semibold text-gray-700">CNAEs por Atividade Econômica</h3>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#78BE20] hover:bg-[#78BE20]/10 rounded-lg transition-colors disabled:opacity-50"
                title="Atualizar CNAEs"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            )}
          </div>

          {hasCnae ? (
            <div className="space-y-3">
              {cnaeGroups.map(({ category, items }) => {
                const meta = CNAE_CATEGORY_META[category];
                const color = CNAE_CATEGORY_COLORS[category];
                return (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1.5 text-white text-xs font-semibold"
                      style={{ background: color }}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                    {/* CNAE items in this category */}
                    <div className="space-y-1 pl-1">
                      {items.map((cnae) => (
                        <div key={cnae.code} className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg border-l-4" style={{ borderColor: color }}>
                          <span className="text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap text-white" style={{ background: color }}>
                            {cnae.code}
                          </span>
                          <span className="text-sm text-gray-700">{cnae.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">Nenhum CNAE encontrado</p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#78BE20] hover:bg-[#5a9a10] rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Buscar CNAEs
                </button>
              )}
            </div>
          )}
        </div>

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
