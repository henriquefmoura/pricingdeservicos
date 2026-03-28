// ========================================
// Analysis Market Context
// ========================================
// Bloco de mercado: renda, população, porte, perfil socioeconômico.

import React from 'react';
import { Users, DollarSign, Building2, Briefcase } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';
import { formatNumber, formatCurrency } from '../../utils/pricingAnalysisMappers';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisMarketContext({ context }: Props) {
  const { marketContext } = context;

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        Mercado e Território
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <MarketMetric
          icon={<DollarSign size={16} style={{ color: '#059669' }} />}
          label="Renda"
          value={marketContext.income != null ? formatCurrency(marketContext.income) : 'N/D'}
          badge={marketContext.incomeLevel ? getIncomeBadge(marketContext.incomeLevel) : undefined}
        />
        <MarketMetric
          icon={<Users size={16} style={{ color: '#3B82F6' }} />}
          label="População"
          value={formatNumber(marketContext.population)}
          badge={marketContext.municipalitySize ? getSizeBadge(marketContext.municipalitySize) : undefined}
        />
        <MarketMetric
          icon={<Building2 size={16} style={{ color: '#8B5CF6' }} />}
          label="Empresas Relacionadas"
          value={formatNumber(marketContext.relatedCompanies)}
        />
        <MarketMetric
          icon={<Briefcase size={16} style={{ color: '#F59E0B' }} />}
          label="MEIs Relacionados"
          value={formatNumber(marketContext.relatedMEIs)}
        />
      </div>

      {/* Profile badge */}
      {marketContext.pricingProfile && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: getProfileBg(marketContext.pricingProfile),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>Perfil de Pricing</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: getProfileColor(marketContext.pricingProfile) }}>
              {getProfileLabel(marketContext.pricingProfile)}
            </p>
          </div>
          {marketContext.offerPressure && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: getPressureBg(marketContext.offerPressure),
              color: getPressureColor(marketContext.offerPressure),
            }}>
              Oferta {marketContext.offerPressure}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MarketMetric({ icon, label, value, badge }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: { label: string; color: string; bg: string };
}) {
  return (
    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        {icon}
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>{label}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        {badge && (
          <span style={{ padding: '1px 6px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

function getIncomeBadge(level: 'baixa' | 'media' | 'alta') {
  switch (level) {
    case 'alta': return { label: 'Alta', color: '#059669', bg: '#ECFDF5' };
    case 'baixa': return { label: 'Baixa', color: '#DC2626', bg: '#FEF2F2' };
    default: return { label: 'Média', color: '#6B7280', bg: '#F3F4F6' };
  }
}

function getSizeBadge(size: 'pequeno' | 'medio' | 'grande' | 'metropole') {
  switch (size) {
    case 'metropole': return { label: 'Metrópole', color: '#7C3AED', bg: '#F5F3FF' };
    case 'grande': return { label: 'Grande', color: '#2563EB', bg: '#EFF6FF' };
    case 'pequeno': return { label: 'Pequeno', color: '#9CA3AF', bg: '#F3F4F6' };
    default: return { label: 'Médio', color: '#6B7280', bg: '#F3F4F6' };
  }
}

function getProfileLabel(profile: string): string {
  switch (profile) {
    case 'premium': return 'Premium';
    case 'equilibrado': return 'Equilibrado';
    case 'sensivel_preco': return 'Sensível a Preço';
    case 'competitivo': return 'Competitivo';
    case 'expansao': return 'Expansão';
    case 'alto_risco': return 'Alto Risco';
    default: return profile;
  }
}

function getProfileBg(profile: string): string {
  switch (profile) {
    case 'premium': return '#ECFDF5';
    case 'sensivel_preco':
    case 'alto_risco': return '#FEF2F2';
    case 'competitivo': return '#FFFBEB';
    default: return '#F9FAFB';
  }
}

function getProfileColor(profile: string): string {
  switch (profile) {
    case 'premium': return '#059669';
    case 'sensivel_preco':
    case 'alto_risco': return '#DC2626';
    case 'competitivo': return '#D97706';
    default: return '#374151';
  }
}

function getPressureBg(p: 'baixa' | 'media' | 'alta'): string {
  switch (p) {
    case 'baixa': return '#ECFDF5';
    case 'alta': return '#FEF2F2';
    default: return '#F3F4F6';
  }
}

function getPressureColor(p: 'baixa' | 'media' | 'alta'): string {
  switch (p) {
    case 'baixa': return '#059669';
    case 'alta': return '#DC2626';
    default: return '#6B7280';
  }
}
