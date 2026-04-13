import React, { useState, InputHTMLAttributes, forwardRef } from 'react';

interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
}

// Standard Input
export const Input = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, error, helperText, disabled, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Label */}
        {label && (
          <label
            style={{
              color: '#374151',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            height: '40px',
            padding: '0 12px',
            borderRadius: '8px',
            border: `1.5px solid ${
              error ? '#DA291C' : isFocused ? '#78BE20' : '#D1D5DB'
            }`,
            backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
            fontSize: '14px',
            fontWeight: 400,
            color: disabled ? '#9CA3AF' : '#001022',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isFocused && !error ? '0 0 0 3px rgba(120, 190, 32, 0.20)' : 'none',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          {...props}
        />

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <span
            style={{
              fontSize: '12px',
              color: error ? '#DA291C' : '#6B7280',
            }}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Currency Input with Margin Pill
interface CurrencyInputProps extends BaseInputProps {
  value: string;
  onValueChange: (value: string) => void;
  showMargin?: boolean;
  costPrice?: number; // Preço de custo para calcular margem
}

export function CurrencyInput({
  label,
  error,
  helperText,
  disabled,
  value,
  onValueChange,
  showMargin = false,
  costPrice,
  className,
  ...props
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Calcular margem se habilitado
  const margin = showMargin && costPrice && value
    ? ((parseFloat(value.replace(',', '.')) - costPrice) / parseFloat(value.replace(',', '.'))) * 100
    : null;

  const getMarginStyle = (margin: number) => {
    if (margin > 30) {
      return { bg: '#D1FAE5', text: '#065F46' };
    } else if (margin >= 15) {
      return { bg: '#FEF3C7', text: '#92400E' };
    } else {
      return { bg: '#FEE2E2', text: '#991B1B' };
    }
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label && (
          <label
            style={{
              color: '#1F2937',
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            {label}
          </label>
        )}

        {/* Live Margin Pill */}
        {showMargin && margin !== null && !isNaN(margin) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '100px',
              backgroundColor: getMarginStyle(margin).bg,
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getMarginStyle(margin).text,
              }}
            >
              Margem: {margin.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* R$ Prefix */}
        <div
          style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#4B5563',
              fontWeight: 600,
            }}
          >
            R$
          </span>
          <div
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: '#D1D5DB',
            }}
          />
        </div>

        {/* Input */}
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            height: '44px',
            width: '100%',
            paddingLeft: '52px', // Space for R$ prefix
            paddingRight: '12px',
            borderRadius: '8px',
            border: `2px solid ${
              error ? '#DA291C' : isFocused ? '#78BE20' : '#9CA3AF'
            }`,
            backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
            fontSize: '15px',
            fontWeight: 500,
            color: disabled ? '#9CA3AF' : '#001022',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isFocused && !error ? '0 0 0 3px rgba(120, 190, 32, 0.20)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          {...props}
        />
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <span
          style={{
            fontSize: '12px',
            color: error ? '#DA291C' : '#6B7280',
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}