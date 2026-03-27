// ========================================
// Pricing Climate Alerts
// ========================================

import type { RecommendationAlert } from '../../types/pricingClimate';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface PricingClimateAlertsProps {
  alerts: RecommendationAlert[];
}

const SEVERITY_CONFIG = {
  critical: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#991B1B',
    icon: AlertCircle,
    iconColor: '#DC2626',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    text: '#92400E',
    icon: AlertTriangle,
    iconColor: '#D97706',
  },
  info: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    text: '#0C4A6E',
    icon: Info,
    iconColor: '#0284C7',
  },
};

export function PricingClimateAlerts({ alerts }: PricingClimateAlertsProps) {
  if (alerts.length === 0) return null;

  // Ordenar: critical > warning > info
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {sorted.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: config.bg,
              border: `1px solid ${config.border}`,
            }}
          >
            <Icon
              size={16}
              style={{ color: config.iconColor, flexShrink: 0, marginTop: '1px' }}
            />
            <span
              style={{
                fontSize: '13px',
                lineHeight: '1.5',
                color: config.text,
                fontWeight: 500,
              }}
            >
              {alert.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
