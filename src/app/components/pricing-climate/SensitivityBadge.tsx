// ========================================
// Sensitivity Badge
// ========================================

import type { ClimateSensitivityLevel, ClimateDriver } from '../../types/pricingClimate';

interface SensitivityBadgeProps {
  level: ClimateSensitivityLevel;
  drivers?: ClimateDriver[];
  compact?: boolean;
}

const LEVEL_CONFIG: Record<ClimateSensitivityLevel, { label: string; bg: string; text: string; border: string }> = {
  alta: {
    label: 'Sensibilidade alta',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
  },
  media: {
    label: 'Sensibilidade média',
    bg: '#FEF9C3',
    text: '#854D0E',
    border: '#FDE047',
  },
  baixa: {
    label: 'Sensibilidade baixa',
    bg: '#E0F2FE',
    text: '#075985',
    border: '#7DD3FC',
  },
  nenhuma: {
    label: 'Sem sensibilidade',
    bg: '#F1F5F9',
    text: '#64748B',
    border: '#CBD5E1',
  },
};

const DRIVER_LABELS: Record<ClimateDriver, string> = {
  chuva: '🌧️ Chuva',
  calor: '☀️ Calor',
  frio: '❄️ Frio',
  vento: '💨 Vento',
  umidade: '💧 Umidade',
  amplitude_termica: '🌡️ Amplitude',
};

export function SensitivityBadge({ level, drivers, compact }: SensitivityBadgeProps) {
  const c = LEVEL_CONFIG[level];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
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
      </span>
      {drivers && drivers.length > 0 && !compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {drivers.map((d) => (
            <span
              key={d}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 500,
                border: '1px solid #E2E8F0',
              }}
            >
              {DRIVER_LABELS[d]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
