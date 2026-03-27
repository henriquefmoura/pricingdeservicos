// ========================================
// Pricing Impact Summary
// ========================================

import type { PricingDecisionSupportOutput } from '../../types/pricingClimate';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface PricingImpactSummaryProps {
  output: PricingDecisionSupportOutput;
}

export function PricingImpactSummary({ output }: PricingImpactSummaryProps) {
  const { summary } = output;
  const isIncrease = summary.priceDelta > 0;
  const isDecrease = summary.priceDelta < 0;

  const deltaColor = isIncrease ? '#16A34A' : isDecrease ? '#DC2626' : '#64748B';
  const DeltaIcon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '12px' }}>
        Impacto da Alteração
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {/* Preço atual */}
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Atual</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
            R$ {summary.currentPrice.toFixed(2)}
          </div>
        </div>

        <ArrowRight size={20} style={{ color: '#94A3B8', flexShrink: 0 }} />

        {/* Preço proposto */}
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: `2px solid ${deltaColor}20`,
          }}
        >
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Proposto</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: deltaColor }}>
            R$ {summary.proposedPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Delta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px',
          borderRadius: '6px',
          backgroundColor: `${deltaColor}10`,
        }}
      >
        <DeltaIcon size={14} style={{ color: deltaColor }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: deltaColor }}>
          {isIncrease ? '+' : ''}R$ {summary.priceDelta.toFixed(2)}
        </span>
        <span style={{ fontSize: '12px', color: deltaColor, opacity: 0.8 }}>
          ({isIncrease ? '+' : ''}{summary.priceDeltaPercent.toFixed(1)}%)
        </span>
      </div>

      {/* Faixa sugerida */}
      {output.recommendation.suggestedPriceRange && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
          }}
        >
          <div style={{ fontSize: '11px', color: '#166534', marginBottom: '2px', fontWeight: 500 }}>
            Faixa sugerida pelo motor
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
            R$ {output.recommendation.suggestedPriceRange.min.toFixed(2)} — R${' '}
            {output.recommendation.suggestedPriceRange.max.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
