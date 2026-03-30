// ========================================
// Competitor Insights Panel
// ========================================

import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { CompetitorInsight } from '../../types/competitor';

interface Props {
  insights: CompetitorInsight[];
}

const ICON_MAP = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  positive: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  negative: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export function CompetitorInsightsPanel({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Insights de Mercado
      </h3>
      <div className="space-y-3">
        {insights.map((insight) => {
          const cfg = ICON_MAP[insight.type];
          const Icon = cfg.icon;

          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg} border ${cfg.border}`}
            >
              <Icon className={`w-5 h-5 ${cfg.color} mt-0.5 flex-shrink-0`} />
              <div>
                <p className={`text-sm font-medium ${cfg.color}`}>{insight.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
