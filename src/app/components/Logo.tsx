import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ variant = 'full', className = '', style }: LogoProps) {
  if (variant === 'compact') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#2563EB',
          flexShrink: 0,
          ...style,
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.5px',
          }}
        >
          PS
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
            }}
          >
            PS
          </span>
        </div>
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: '#001022',
              lineHeight: 1.1,
              letterSpacing: '-0.3px',
            }}
          >
            PRICING DE SERVIÇOS
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#2563EB',
              lineHeight: 1.1,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            Serviços e Reformas
          </div>
        </div>
      </div>
    </div>
  );
}
