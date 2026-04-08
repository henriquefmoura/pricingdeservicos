// ========================================
// Analysis Price Context
// ========================================
// Bloco de preço: atual, proposto, variação, comparação com média e faixa.

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';
import { formatCurrency, formatPercent } from '../../utils/pricingAnalysisMappers';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisPriceContext({ context }: Props) {
  const { isMobile } = useResponsive();
  const { currentPrice, proposedPrice, priceDelta, priceDeltaPercent, historicalContext } = context;
  const isIncrease = priceDelta > 0;
  const isDecrease = priceDelta < 0;
  const arrow = isIncrease ? <ArrowUpRight size={16} /> : isDecrease ? <ArrowDownRight size={16} /> : <Minus size={16} />;
  const deltaColor = isIncrease ? '#059669' : isDecrease ? '#DC2626' : '#6B7280';

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        Contexto de Preço
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <MetricCard label="Preço Atual" value={formatCurrency(currentPrice)} />
        <MetricCard label="Preço Proposto" value={formatCurrency(proposedPrice)} highlight={deltaColor} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <MetricCard
          label="Variação Absoluta"
          value={formatCurrency(Math.abs(priceDelta))}
          prefix={priceDelta > 0 ? '+' : priceDelta < 0 ? '-' : ''}
          highlight={deltaColor}
          icon={arrow}
        />
        <MetricCard
          label="Variação Percentual"
          value={formatPercent(priceDeltaPercent)}
          highlight={deltaColor}
        />
      </div>

      {/* Historical comparison */}
      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
          <MiniMetric label="Média Local" value={formatCurrency(historicalContext.localAverage)} />
          <MiniMetric label="Tendência" value={getTrendLabel(historicalContext.localTrend)} />
          <MiniMetric label="Posição" value={getPositionLabel(historicalContext.pricePosition)} color={getPositionColor(historicalContext.pricePosition)} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, prefix, highlight, icon }: {
  label: string;
  value: string;
  prefix?: string;
  highlight?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon && <span style={{ color: highlight ?? '#001022' }}>{icon}</span>}
        <p style={{ fontSize: '18px', fontWeight: 700, color: highlight ?? '#001022', fontVariantNumeric: 'tabular-nums' }}>
          {prefix}{value}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 600, color: color ?? '#374151' }}>{value}</p>
    </div>
  );
}

function getTrendLabel(trend?: 'subindo' | 'estavel' | 'caindo'): string {
  switch (trend) {
    case 'subindo': return '↑ Subindo';
    case 'caindo': return '↓ Caindo';
    default: return '→ Estável';
  }
}

function getPositionLabel(pos?: 'abaixo' | 'dentro' | 'acima'): string {
  switch (pos) {
    case 'abaixo': return 'Abaixo da média';
    case 'acima': return 'Acima da média';
    default: return 'Dentro da faixa';
  }
}

function getPositionColor(pos?: 'abaixo' | 'dentro' | 'acima'): string {
  switch (pos) {
    case 'abaixo': return '#2563EB';
    case 'acima': return '#DC2626';
    default: return '#059669';
  }
}
