// ========================================
// Operational Risk Badge
// ========================================

import type { WeatherRiskLevel } from '../../types/weather';

interface OperationalRiskBadgeProps {
  risk: WeatherRiskLevel;
  className?: string;
}

const RISK_CONFIG: Record<WeatherRiskLevel, { label: string; bg: string; text: string; dot: string }> = {
  baixo: {
    label: 'Risco Baixo',
    bg: '#F0FDF4',
    text: '#166534',
    dot: '#22C55E',
  },
  moderado: {
    label: 'Risco Moderado',
    bg: '#FFFBEB',
    text: '#92400E',
    dot: '#F59E0B',
  },
  alto: {
    label: 'Risco Alto',
    bg: '#FEF2F2',
    text: '#991B1B',
    dot: '#EF4444',
  },
};

export function OperationalRiskBadge({ risk, className = '' }: OperationalRiskBadgeProps) {
  const config = RISK_CONFIG[risk];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '100px',
        backgroundColor: config.bg,
        color: config.text,
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
