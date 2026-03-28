// ========================================
// Analysis Error State
// ========================================
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function AnalysisErrorState({ message, onRetry }: Props) {
  return (
    <div
      style={{
        padding: '32px',
        borderRadius: '12px',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={40} style={{ color: '#EF4444', marginBottom: '16px' }} />
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
        Erro na análise
      </h3>
      <p style={{ fontSize: '14px', color: '#B91C1C', marginBottom: '16px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #FECACA',
            backgroundColor: '#FFFFFF',
            color: '#B91C1C',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
