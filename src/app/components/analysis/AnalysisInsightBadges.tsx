// ========================================
// Analysis Insight Badges
// ========================================
import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { RecommendationAction } from '../../types/pricingAnalysis';

interface Props {
  action: RecommendationAction;
  confidence: number;
  seasonality: 'alta' | 'neutra' | 'baixa';
  forecastSignal?: 'favoravel' | 'neutro' | 'desfavoravel';
  offerPressure?: 'baixa' | 'media' | 'alta';
}

export function AnalysisInsightBadges({ action, confidence, seasonality, forecastSignal, offerPressure }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge
        label={getActionLabel(action)}
        color={getActionColor(action)}
        icon={getActionIcon(action)}
      />
      <Badge
        label={`Confiança ${confidence}%`}
        color={confidence >= 70 ? '#059669' : confidence >= 50 ? '#D97706' : '#DC2626'}
        icon={<Info size={12} />}
      />
      <Badge
        label={`Sazonalidade ${seasonality}`}
        color={seasonality === 'alta' ? '#059669' : seasonality === 'baixa' ? '#DC2626' : '#6B7280'}
        icon={seasonality === 'alta' ? <TrendingUp size={12} /> : seasonality === 'baixa' ? <TrendingDown size={12} /> : <Minus size={12} />}
      />
      {forecastSignal && (
        <Badge
          label={`Clima ${forecastSignal}`}
          color={forecastSignal === 'favoravel' ? '#059669' : forecastSignal === 'desfavoravel' ? '#DC2626' : '#6B7280'}
          icon={forecastSignal === 'favoravel' ? <CheckCircle size={12} /> : forecastSignal === 'desfavoravel' ? <AlertCircle size={12} /> : <Minus size={12} />}
        />
      )}
      {offerPressure && (
        <Badge
          label={`Oferta ${offerPressure}`}
          color={offerPressure === 'baixa' ? '#059669' : offerPressure === 'alta' ? '#DC2626' : '#6B7280'}
        />
      )}
    </div>
  );
}

function Badge({ label, color, icon }: { label: string; color: string; icon?: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#FFFFFF',
        backgroundColor: color,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function getActionLabel(action: RecommendationAction): string {
  switch (action) {
    case 'aumentar': return 'Aumentar';
    case 'manter': return 'Manter';
    case 'reduzir': return 'Reduzir';
    case 'revisar': return 'Revisar';
  }
}

function getActionColor(action: RecommendationAction): string {
  switch (action) {
    case 'aumentar': return '#059669';
    case 'manter': return '#2563EB';
    case 'reduzir': return '#DC2626';
    case 'revisar': return '#D97706';
  }
}

function getActionIcon(action: RecommendationAction): React.ReactNode {
  switch (action) {
    case 'aumentar': return <TrendingUp size={12} />;
    case 'manter': return <Minus size={12} />;
    case 'reduzir': return <TrendingDown size={12} />;
    case 'revisar': return <AlertCircle size={12} />;
  }
}
