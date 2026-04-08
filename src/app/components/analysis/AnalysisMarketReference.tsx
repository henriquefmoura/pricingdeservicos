// ========================================
// Analysis Market Reference — Competitor Context
// ========================================
// Exibe referência de mercado com dados de concorrência dentro da seção de Análises.
// Mostra faixa de preço, mediana, fontes, data da coleta e links clicáveis.

import { ExternalLink, TrendingUp, AlertCircle, Calendar, Shield } from 'lucide-react';
import type { CompetitorContext } from '../../types/pricingAnalysis';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  competitor: CompetitorContext;
  currentPrice?: number;
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AnalysisMarketReference({ competitor, currentPrice }: Props) {
  const { isMobile } = useResponsive();

  if (!competitor.enabled) {
    return (
      <div style={{
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <TrendingUp size={16} style={{ color: '#6B7280' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Referência de Mercado
          </h4>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          Sem dados de concorrência disponíveis. Acesse a seção Concorrência para analisar preços do mercado.
        </p>
      </div>
    );
  }

  const positionLabel = currentPrice && competitor.median
    ? currentPrice > competitor.median * 1.1
      ? 'acima'
      : currentPrice < competitor.median * 0.9
        ? 'abaixo'
        : 'dentro'
    : null;

  const positionColor = positionLabel === 'acima' ? '#EF4444' : positionLabel === 'abaixo' ? '#3B82F6' : '#10B981';

  // Unique sources (deduplicate by domain)
  const uniqueSources = competitor.sources
    ? [...new Map(competitor.sources.map((s) => [extractDomain(s.url), s])).values()].slice(0, 5)
    : [];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={14} style={{ color: '#FFF' }} />
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Referência de Mercado
          </h4>
        </div>
        {competitor.confidenceLevel && (
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
            backgroundColor: competitor.confidenceLevel === 'alta' ? '#DCFCE7' :
              competitor.confidenceLevel === 'media' ? '#FEF3C7' : '#FEE2E2',
            color: competitor.confidenceLevel === 'alta' ? '#166534' :
              competitor.confidenceLevel === 'media' ? '#92400E' : '#991B1B',
          }}>
            <Shield size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'text-bottom' }} />
            Confiança {competitor.confidenceLevel}
          </span>
        )}
      </div>

      {/* Price range */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Mínimo</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>
            {competitor.min != null ? fmtBRL(competitor.min) : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Mediana</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#3B82F6' }}>
            {competitor.median != null ? fmtBRL(competitor.median) : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Média</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>
            {competitor.average != null ? fmtBRL(competitor.average) : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Máximo</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>
            {competitor.max != null ? fmtBRL(competitor.max) : '—'}
          </p>
        </div>
      </div>

      {/* Position indicator */}
      {positionLabel && currentPrice && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          backgroundColor: positionLabel === 'dentro' ? '#F0FDF4' : positionLabel === 'acima' ? '#FEF2F2' : '#EFF6FF',
          marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <AlertCircle size={14} style={{ color: positionColor }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: positionColor }}>
            Seu preço ({fmtBRL(currentPrice)}) está{' '}
            <strong>{positionLabel === 'dentro' ? 'dentro da faixa' : positionLabel === 'acima' ? 'acima da mediana' : 'abaixo da mediana'}</strong>
            {competitor.median != null && ` (mediana: ${fmtBRL(competitor.median)})`}
          </span>
        </div>
      )}

      {/* Sample info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Baseado em {competitor.sampleSize ?? 0} referências
        </span>
        {competitor.lastUpdated && (
          <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={10} />
            {formatDate(competitor.lastUpdated)}
          </span>
        )}
      </div>

      {/* Sources */}
      {uniqueSources.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>Fontes:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {uniqueSources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: '#F3F4F6', color: '#4B5563',
                  fontSize: '11px', textDecoration: 'none',
                }}
                className="hover:bg-gray-200 transition-colors"
                title={`Coletado em ${formatDate(src.capturedAt)}`}
              >
                <ExternalLink size={10} />
                {extractDomain(src.url)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
