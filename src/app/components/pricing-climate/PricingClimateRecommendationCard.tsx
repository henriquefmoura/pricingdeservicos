// ========================================
// Pricing Climate Recommendation Card
// ========================================

import type { PricingClimateRecommendation } from '../../types/pricingClimate';
import { CheckCircle2, AlertTriangle, ArrowDown, ArrowUp, Eye } from 'lucide-react';

interface PricingClimateRecommendationCardProps {
  recommendation: PricingClimateRecommendation;
}

const ACTION_CONFIG = {
  aumentar: {
    label: 'Recomendável aumentar',
    icon: ArrowUp,
    bg: '#F0FDF4',
    border: '#86EFAC',
    color: '#166534',
    iconColor: '#16A34A',
  },
  manter: {
    label: 'Recomendável manter',
    icon: CheckCircle2,
    bg: '#F0F9FF',
    border: '#BAE6FD',
    color: '#0C4A6E',
    iconColor: '#0284C7',
  },
  reduzir: {
    label: 'Recomendável reduzir',
    icon: ArrowDown,
    bg: '#FEF9C3',
    border: '#FDE047',
    color: '#854D0E',
    iconColor: '#D97706',
  },
  revisar: {
    label: 'Decisão sensível — Atenção',
    icon: AlertTriangle,
    bg: '#FEF2F2',
    border: '#FCA5A5',
    color: '#991B1B',
    iconColor: '#DC2626',
  },
};

export function PricingClimateRecommendationCard({
  recommendation,
}: PricingClimateRecommendationCardProps) {
  const config = ACTION_CONFIG[recommendation.action];
  const Icon = config.icon;

  return (
    <div
      style={{
        backgroundColor: config.bg,
        borderRadius: '10px',
        padding: '16px',
        border: `1px solid ${config.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: `${config.iconColor}15`,
          }}
        >
          <Icon size={18} style={{ color: config.iconColor }} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: config.color }}>
            {config.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Eye size={12} style={{ color: config.color, opacity: 0.6 }} />
            <span style={{ fontSize: '11px', color: config.color, opacity: 0.7 }}>
              Confiança: {recommendation.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Razão */}
      <div
        style={{
          fontSize: '13px',
          lineHeight: '1.6',
          color: config.color,
          fontWeight: 500,
        }}
      >
        {recommendation.reason}
      </div>
    </div>
  );
}
