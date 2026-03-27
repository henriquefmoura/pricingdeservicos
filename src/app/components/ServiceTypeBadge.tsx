import React from 'react';

export type ServiceType = 'Visita Técnica' | 'Serviço' | 'Complementar' | 'Deslocamento';

interface ServiceTypeBadgeProps {
  type: ServiceType;
  className?: string;
}

const typeStyles: Record<ServiceType, { bg: string; text: string }> = {
  'Visita Técnica': {
    bg: '#FEF3C7',
    text: '#92400E',
  },
  'Serviço': {
    bg: '#D1FAE5',
    text: '#065F46',
  },
  'Complementar': {
    bg: '#DBEAFE',
    text: '#1E40AF',
  },
  'Deslocamento': {
    bg: '#EDE9FE',
    text: '#5B21B6',
  },
};

export function ServiceTypeBadge({ type, className = '' }: ServiceTypeBadgeProps) {
  const style = typeStyles[type];

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '6px',
        backgroundColor: style.bg,
      }}
    >
      <span
        style={{
          color: style.text,
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        {type}
      </span>
    </div>
  );
}
