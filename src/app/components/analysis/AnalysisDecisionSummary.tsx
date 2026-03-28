// ========================================
// Analysis Decision Summary
// ========================================
// Bloco principal: ação sugerida, confiança, semáforo visual, resumo executivo.

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, ChevronRight } from 'lucide-react';
import type { PricingAnalysisDecisionContext, RecommendationAction } from '../../types/pricingAnalysis';
import { formatCurrency, formatPercent } from '../../utils/pricingAnalysisMappers';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisDecisionSummary({ context }: Props) {
  const { recommendation, priceDelta, priceDeltaPercent, currentPrice, proposedPrice } = context;
  const actionConfig = getActionConfig(recommendation.action);

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        border: `2px solid ${actionConfig.borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
        {/* Semaphore */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: actionConfig.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {actionConfig.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: actionConfig.textColor }}>
              {actionConfig.label}
            </h3>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: actionConfig.bgColor,
                color: actionConfig.textColor,
              }}
            >
              {recommendation.confidence}% confiança
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, marginBottom: '16px' }}>
            {recommendation.summary}
          </p>

          {/* Price info row */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <PriceBlock label="Preço Atual" value={formatCurrency(currentPrice)} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={20} style={{ color: '#9CA3AF' }} />
            </div>
            <PriceBlock label="Preço Proposto" value={formatCurrency(proposedPrice)} highlight={actionConfig.textColor} />
            <PriceBlock
              label="Variação"
              value={`${formatCurrency(Math.abs(priceDelta))} (${formatPercent(priceDeltaPercent)})`}
              highlight={priceDelta > 0 ? '#059669' : priceDelta < 0 ? '#DC2626' : '#6B7280'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: '2px' }}>
        {label}
      </p>
      <p style={{ fontSize: '16px', fontWeight: 700, color: highlight ?? '#001022', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  );
}

function getActionConfig(action: RecommendationAction) {
  switch (action) {
    case 'aumentar':
      return {
        label: 'Recomendação: Aumentar',
        icon: <TrendingUp size={28} style={{ color: '#059669' }} />,
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        textColor: '#059669',
      };
    case 'manter':
      return {
        label: 'Recomendação: Manter',
        icon: <Minus size={28} style={{ color: '#2563EB' }} />,
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        textColor: '#2563EB',
      };
    case 'reduzir':
      return {
        label: 'Recomendação: Reduzir',
        icon: <TrendingDown size={28} style={{ color: '#DC2626' }} />,
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        textColor: '#DC2626',
      };
    case 'revisar':
      return {
        label: 'Recomendação: Revisar',
        icon: <AlertCircle size={28} style={{ color: '#D97706' }} />,
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        textColor: '#D97706',
      };
  }
}
