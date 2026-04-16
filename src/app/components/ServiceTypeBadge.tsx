import React from 'react';
import type { PricingCodeTipo } from '../store/pricingCodesStore';

export type ServiceType = PricingCodeTipo;

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
  'Inst + Pague -': {
    bg: '#FEF3C7',
    text: '#92400E',
  },
  'Emergencial': {
    bg: '#FEE2E2',
    text: '#991B1B',
  },
  'Complementar': {
    bg: '#F3F4F6',
    text: '#374151',
  },
  'Deslocamento': {
    bg: '#F3F4F6',
    text: '#374151',
  },
  'Reforma': {
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
