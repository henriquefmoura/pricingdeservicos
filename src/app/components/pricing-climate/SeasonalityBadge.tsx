// ========================================
// Seasonality Badge
// ========================================

import type { SeasonalityLevel } from '../../types/pricingClimate';

interface SeasonalityBadgeProps {
  level: SeasonalityLevel;
  score?: number;
  compact?: boolean;
}

const CONFIG: Record<SeasonalityLevel, { label: string; bg: string; text: string; border: string }> = {
  alta: {
    label: 'Alta sazonalidade',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#86EFAC',
  },
  neutra: {
    label: 'Sazonalidade neutra',
    bg: '#FEF9C3',
    text: '#854D0E',
    border: '#FDE047',
  },
  baixa: {
    label: 'Baixa sazonalidade',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
  },
};

export function SeasonalityBadge({ level, score, compact }: SeasonalityBadgeProps) {
  const c = CONFIG[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '2px 8px' : '4px 12px',
        borderRadius: '6px',
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontSize: compact ? '11px' : '12px',
        fontWeight: 600,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: c.text,
          flexShrink: 0,
        }}
      />
      {c.label}
      {score != null && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>({score})</span>
      )}
    </span>
  );
}
