// ========================================
// Analysis Offer Pressure
// ========================================
// Bloco de concorrência / oferta local.

import React from 'react';
import { Building2, Users, AlertTriangle, Shield } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';
import { formatNumber } from '../../utils/pricingAnalysisMappers';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisOfferPressure({ context }: Props) {
  const { marketContext, pracaName } = context;
  const level = marketContext.offerPressure ?? 'media';
  const config = getLevelConfig(level);

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Concorrência / Oferta Local
        </h4>
        <span style={{
          padding: '3px 10px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
        }}>
          Pressão {config.label}
        </span>
      </div>

      {/* Visual gauge */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          <GaugeBar active={level === 'baixa' || level === 'media' || level === 'alta'} color="#059669" />
          <GaugeBar active={level === 'media' || level === 'alta'} color="#D97706" />
          <GaugeBar active={level === 'alta'} color="#DC2626" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Baixa</span>
          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Média</span>
          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Alta</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} style={{ color: '#8B5CF6' }} />
          <div>
            <p style={{ fontSize: '10px', color: '#9CA3AF' }}>Empresas</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>{formatNumber(marketContext.relatedCompanies)}</p>
          </div>
        </div>
        <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: '#F59E0B' }} />
          <div>
            <p style={{ fontSize: '10px', color: '#9CA3AF' }}>MEIs</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>{formatNumber(marketContext.relatedMEIs)}</p>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div style={{
        padding: '10px 14px',
        borderRadius: '8px',
        backgroundColor: config.bg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}>
        {level === 'alta' ? (
          <AlertTriangle size={14} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <Shield size={14} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
        )}
        <p style={{ fontSize: '12px', color: config.color, lineHeight: 1.4 }}>
          {getInsightText(level, pracaName)}
        </p>
      </div>
    </div>
  );
}

function GaugeBar({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{
      flex: 1,
      height: '8px',
      borderRadius: '4px',
      backgroundColor: active ? color : '#E5E7EB',
      transition: 'background-color 0.3s ease',
    }} />
  );
}

function getLevelConfig(level: 'baixa' | 'media' | 'alta') {
  switch (level) {
    case 'alta':
      return { label: 'Alta', color: '#DC2626', bg: '#FEF2F2' };
    case 'baixa':
      return { label: 'Baixa', color: '#059669', bg: '#ECFDF5' };
    default:
      return { label: 'Média', color: '#D97706', bg: '#FFFBEB' };
  }
}

function getInsightText(level: 'baixa' | 'media' | 'alta', pracaName: string): string {
  switch (level) {
    case 'alta':
      return `A pressão de oferta local parece elevada em ${pracaName}. O volume de prestadores pode limitar espaço para aumento de preço.`;
    case 'baixa':
      return `A oferta local é baixa em ${pracaName}. Isso pode sustentar melhor posicionamento de preço.`;
    default:
      return `A concentração de oferta em ${pracaName} é moderada. Monitorar tendência de mercado local.`;
  }
}
