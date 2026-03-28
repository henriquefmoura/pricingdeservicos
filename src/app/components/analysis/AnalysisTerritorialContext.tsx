// ========================================
// Analysis Territorial Context
// ========================================
// Bloco de contexto territorial (renda vs estado, concentração, sinais).

import React from 'react';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisTerritorialContext({ context }: Props) {
  const { pracaName, marketContext } = context;

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MapPin size={16} style={{ color: '#8B5CF6' }} />
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Contexto Territorial — {pracaName}
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <TerritorialRow
          label="Nível de Renda"
          value={formatLevel(marketContext.incomeLevel)}
          signal={marketContext.incomeLevel === 'alta' ? 'positive' : marketContext.incomeLevel === 'baixa' ? 'negative' : 'neutral'}
        />
        <TerritorialRow
          label="Porte do Município"
          value={formatSize(marketContext.municipalitySize)}
          signal="neutral"
        />
        <TerritorialRow
          label="Pressão de Oferta"
          value={formatLevel(marketContext.offerPressure)}
          signal={marketContext.offerPressure === 'baixa' ? 'positive' : marketContext.offerPressure === 'alta' ? 'negative' : 'neutral'}
        />
        <TerritorialRow
          label="Perfil de Pricing"
          value={formatProfile(marketContext.pricingProfile)}
          signal={
            marketContext.pricingProfile === 'premium' || marketContext.pricingProfile === 'expansao'
              ? 'positive'
              : marketContext.pricingProfile === 'sensivel_preco' || marketContext.pricingProfile === 'alto_risco'
              ? 'negative'
              : 'neutral'
          }
        />
      </div>
    </div>
  );
}

function TerritorialRow({ label, value, signal }: {
  label: string;
  value: string;
  signal: 'positive' | 'negative' | 'neutral';
}) {
  const config = {
    positive: { color: '#059669', bg: '#ECFDF5', icon: <TrendingUp size={12} style={{ color: '#059669' }} /> },
    negative: { color: '#DC2626', bg: '#FEF2F2', icon: <TrendingDown size={12} style={{ color: '#DC2626' }} /> },
    neutral: { color: '#6B7280', bg: '#F3F4F6', icon: null },
  }[signal];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: config.bg,
    }}>
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {config.icon}
        <span style={{ fontSize: '13px', fontWeight: 600, color: config.color }}>{value}</span>
      </div>
    </div>
  );
}

function formatLevel(level?: 'baixa' | 'media' | 'alta'): string {
  switch (level) {
    case 'alta': return 'Alta';
    case 'baixa': return 'Baixa';
    default: return 'Média';
  }
}

function formatSize(size?: 'pequeno' | 'medio' | 'grande' | 'metropole'): string {
  switch (size) {
    case 'metropole': return 'Metrópole';
    case 'grande': return 'Grande';
    case 'pequeno': return 'Pequeno';
    default: return 'Médio';
  }
}

function formatProfile(profile?: string): string {
  switch (profile) {
    case 'premium': return 'Premium';
    case 'equilibrado': return 'Equilibrado';
    case 'sensivel_preco': return 'Sensível a Preço';
    case 'competitivo': return 'Competitivo';
    case 'expansao': return 'Expansão';
    case 'alto_risco': return 'Alto Risco';
    default: return 'Não classificado';
  }
}
