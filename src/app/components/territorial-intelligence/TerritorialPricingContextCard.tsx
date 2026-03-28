// ========================================
// Territorial Pricing Context Card
// ========================================
// Compact card for embedding in pricing editing screens.

import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TerritorialInsightSummary } from '../../types/territorial';
import { runTerritorialAnalysis } from '../../services/territorialPricingEngine';
import { OfferPressureBadge, PricingProfileBadge } from './TerritorialBadges';

interface Props {
  pracaIbgeCode: string;
  serviceId?: string;
}

export function TerritorialPricingContextCard({ pracaIbgeCode, serviceId }: Props) {
  const [summary, setSummary] = useState<TerritorialInsightSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pracaIbgeCode) return;
    let cancelled = false;
    setLoading(true);
    runTerritorialAnalysis(pracaIbgeCode, serviceId)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pracaIbgeCode, serviceId]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!summary) return null;

  const topInsight = summary.insights[0];

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-[#78BE20]" />
        <span className="text-xs font-semibold text-gray-700">{summary.city} · {summary.uf}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <PricingProfileBadge profile={summary.pricingProfile} />
        <OfferPressureBadge level={summary.offerPressure} />
        {summary.incomeLevel && (
          <span className="text-xs text-gray-500">Renda: {summary.incomeLevel}</span>
        )}
        {summary.relatedMEIs != null && (
          <span className="text-xs text-gray-500">MEIs: {summary.relatedMEIs.toLocaleString('pt-BR')}</span>
        )}
      </div>
      {topInsight && (
        <p className="text-xs text-gray-600 italic">💡 {topInsight.description}</p>
      )}
    </div>
  );
}
