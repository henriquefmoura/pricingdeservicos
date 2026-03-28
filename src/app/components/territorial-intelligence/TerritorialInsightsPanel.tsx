// ========================================
// Territorial Insights Panel
// ========================================

import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import type { TerritorialInsight } from '../../types/territorial';

const CFG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ic: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', ic: 'text-yellow-500' },
  critical: { icon: AlertOctagon, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ic: 'text-red-500' },
};

export function TerritorialInsightsPanel({ insights, title = 'Insights para Pricing' }: { insights: TerritorialInsight[]; title?: string }) {
  if (!insights.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {insights.map((ins) => {
          const c = CFG[ins.severity];
          const Icon = c.icon;
          return (
            <div key={ins.id} className={`flex items-start gap-3 p-3 rounded-lg border ${c.bg} ${c.border}`}>
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.ic}`} />
              <div>
                <p className={`text-sm font-medium ${c.text}`}>{ins.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{ins.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
