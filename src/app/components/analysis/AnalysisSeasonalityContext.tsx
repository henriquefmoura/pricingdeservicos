// ========================================
// Analysis Seasonality Context
// ========================================
// Bloco de sazonalidade: nível atual, leitura, recomendação contextual.

import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisSeasonalityContext({ context }: Props) {
  const { seasonalityContext } = context;
  const config = getLevelConfig(seasonalityContext.level);

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: '#8B5CF6' }} />
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sazonalidade
          </h4>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
        }}>
          {config.label}
        </span>
      </div>

      {/* Visual indicator */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {config.icon}
          <span style={{ fontSize: '24px', fontWeight: 700, color: config.color }}>
            {seasonalityContext.score ?? 50}
          </span>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>/ 100</span>
        </div>
        {/* Bar */}
        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${seasonalityContext.score ?? 50}%`,
            borderRadius: '3px',
            backgroundColor: config.color,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Period label */}
      {seasonalityContext.currentPeriodLabel && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#F9FAFB', marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>
            Período: <strong>{seasonalityContext.currentPeriodLabel}</strong>
          </p>
        </div>
      )}

      {/* Explanation */}
      {seasonalityContext.explanation && (
        <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
          {seasonalityContext.explanation}
        </p>
      )}
    </div>
  );
}

function getLevelConfig(level: 'alta' | 'neutra' | 'baixa') {
  switch (level) {
    case 'alta':
      return {
        label: 'Alta Sazonalidade',
        color: '#059669',
        bg: '#ECFDF5',
        icon: <TrendingUp size={20} style={{ color: '#059669' }} />,
      };
    case 'baixa':
      return {
        label: 'Baixa Sazonalidade',
        color: '#DC2626',
        bg: '#FEF2F2',
        icon: <TrendingDown size={20} style={{ color: '#DC2626' }} />,
      };
    default:
      return {
        label: 'Sazonalidade Neutra',
        color: '#6B7280',
        bg: '#F3F4F6',
        icon: <Minus size={20} style={{ color: '#6B7280' }} />,
      };
  }
}
