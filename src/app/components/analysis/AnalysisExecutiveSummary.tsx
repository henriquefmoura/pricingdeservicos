// ========================================
// Analysis Executive Summary
// ========================================
// Resumo executivo em linguagem de negócio.

import React from 'react';
import { FileText } from 'lucide-react';

interface Props {
  summary: string;
  serviceName: string;
  pracaName: string;
}

export function AnalysisExecutiveSummary({ summary, serviceName, pracaName }: Props) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #001022 0%, #0A2540 100%)',
      color: '#FFFFFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FileText size={16} style={{ color: '#78BE20' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#78BE20', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Resumo Executivo
        </h4>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          {serviceName} • {pracaName}
        </span>
      </div>

      <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
        {summary}
      </p>
    </div>
  );
}
