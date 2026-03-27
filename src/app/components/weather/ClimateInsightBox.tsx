// ========================================
// Climate Insight Box
// ========================================

import type { WeatherInsight } from '../../types/weather';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ClimateInsightBoxProps {
  insights: WeatherInsight[];
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    bg: '#F0F9FF',
    border: '#BAE6FD',
    iconColor: '#0284C7',
    titleColor: '#0C4A6E',
  },
  warning: {
    icon: AlertTriangle,
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconColor: '#D97706',
    titleColor: '#78350F',
  },
  critical: {
    icon: AlertCircle,
    bg: '#FEF2F2',
    border: '#FECACA',
    iconColor: '#DC2626',
    titleColor: '#7F1D1D',
  },
};

export function ClimateInsightBox({ insights }: ClimateInsightBoxProps) {
  if (insights.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#1E293B',
          margin: 0,
        }}
      >
        Insights Executivos
      </h3>

      {insights.map((insight) => {
        const config = SEVERITY_CONFIG[insight.severity];
        const Icon = config.icon;

        return (
          <div
            key={insight.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: config.bg,
              borderLeft: `4px solid ${config.border}`,
              borderRadius: '8px',
            }}
          >
            <Icon
              size={18}
              style={{ color: config.iconColor, flexShrink: 0, marginTop: '2px' }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: config.titleColor,
                }}
              >
                {insight.title}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: '#475569',
                  lineHeight: '1.5',
                }}
              >
                {insight.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
