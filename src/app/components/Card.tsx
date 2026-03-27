import React, { ReactNode, useState } from 'react';

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

// Default Card
export function Card({ children, className = '', onClick, style }: BaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Highlighted Card (with left border)
interface HighlightedCardProps extends BaseCardProps {
  borderColor?: string;
}

export function HighlightedCard({
  children,
  className = '',
  borderColor = '#78BE20',
  onClick,
  style,
}: HighlightedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        paddingLeft: '28px', // Extra space for border
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Left Border */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: borderColor,
          borderRadius: '12px 0 0 12px',
        }}
      />
      {children}
    </div>
  );
}

// AI Suggestion Card
export function AISuggestionCard({ children, className = '', onClick, style }: BaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'rgba(206, 220, 0, 0.10)',
        border: '1px dashed #CEDC00',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// KPI Card
interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: 'green' | 'amber';
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  icon,
  iconBgColor = 'green',
  className = '',
  onClick,
}: KPICardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const iconBgColors = {
    green: 'rgba(120, 190, 32, 0.15)',
    amber: 'rgba(245, 158, 11, 0.15)',
  };

  const iconColors = {
    green: '#78BE20',
    amber: '#F59E0B',
  };

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {/* Icon Circle */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: iconBgColors[iconBgColor],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: iconColors[iconBgColor],
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Label */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 400,
            color: '#6B7280',
            lineHeight: 1.5,
          }}
        >
          {label}
        </span>

        {/* Value */}
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#001022',
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// Compact Card (smaller padding for lists)
export function CompactCard({ children, className = '', onClick }: BaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}