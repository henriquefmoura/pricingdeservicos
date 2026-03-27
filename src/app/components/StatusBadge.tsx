import React from 'react';

export type BadgeStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Novo' | 'Em Andamento';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusStyles: Record<
  BadgeStatus,
  { bg: string; text: string; dot: string }
> = {
  Pendente: {
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
  },
  Aprovado: {
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#78BE20',
  },
  Rejeitado: {
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#DA291C',
  },
  Novo: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    dot: '#3B82F6',
  },
  'Em Andamento': {
    bg: '#F0FDF4',
    text: '#166534',
    dot: '#CEDC00',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: style.bg,
      }}
    >
      {/* Dot Indicator */}
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.dot,
          flexShrink: 0,
        }}
      />
      {/* Label */}
      <span
        style={{
          color: style.text,
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </span>
    </div>
  );
}
