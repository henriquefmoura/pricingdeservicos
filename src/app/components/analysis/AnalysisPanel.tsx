// ========================================
// Analysis Panel — Main Integration Component
// ========================================
// Painel principal de Inteligência de Mercado para Pricing.
// Consolida todos os blocos de análise em uma experiência unificada.
// Agora integrado com dados de concorrência, CNAE e contexto unificado.

import React from 'react';
import { RefreshCw, Brain } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';
import type { CompetitorContext, CnaeContext } from '../../types/pricingAnalysis';
import { useResponsive } from '../../hooks/useResponsive';

import { AnalysisDecisionSummary } from './AnalysisDecisionSummary';
import { AnalysisPriceContext } from './AnalysisPriceContext';
import { AnalysisClimateContext } from './AnalysisClimateContext';
import { AnalysisMarketContext } from './AnalysisMarketContext';
import { AnalysisTerritorialContext } from './AnalysisTerritorialContext';
import { AnalysisSeasonalityContext } from './AnalysisSeasonalityContext';
import { AnalysisOfferPressure } from './AnalysisOfferPressure';
import { AnalysisAlertsPanel } from './AnalysisAlertsPanel';
import { AnalysisExecutiveSummary } from './AnalysisExecutiveSummary';
import { AnalysisComparisonChart } from './AnalysisComparisonChart';
import { AnalysisForecastPanel } from './AnalysisForecastPanel';
import { AnalysisHistoricalCurve } from './AnalysisHistoricalCurve';
import { AnalysisInsightBadges } from './AnalysisInsightBadges';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { AnalysisErrorState } from './AnalysisErrorState';
import { AnalysisMarketReference } from './AnalysisMarketReference';
import { AnalysisCnaeContext } from './AnalysisCnaeContext';

interface Props {
  context: PricingAnalysisDecisionContext | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  competitorContext?: CompetitorContext;
  cnaeContext?: CnaeContext | null;
}

export function AnalysisPanel({ context, loading, error, onRefresh, competitorContext, cnaeContext }: Props) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <div style={{ marginTop: '24px' }}>
        <SectionHeader />
        <AnalysisSkeleton />
      </div>
    );
  }

  if (error && !context) {
    return (
      <div style={{ marginTop: '24px' }}>
        <SectionHeader />
        <AnalysisErrorState message={error} onRetry={onRefresh} />
      </div>
    );
  }

  if (!context) {
    return null;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <SectionHeader onRefresh={onRefresh} />

      {/* Partial error banner */}
      {error && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#92400E',
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Decision Summary */}
        <AnalysisDecisionSummary context={context} />

        {/* Insight badges */}
        <AnalysisInsightBadges
          action={context.recommendation.action}
          confidence={context.recommendation.confidence}
          seasonality={context.seasonalityContext.level}
          forecastSignal={context.climateContext.forecastSignal}
          offerPressure={context.marketContext.offerPressure}
        />

        {/* 2. Historical and Price Context */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <AnalysisPriceContext context={context} />
          <AnalysisComparisonChart context={context} />
        </div>

        {/* Historical curve */}
        <AnalysisHistoricalCurve context={context} />

        {/* 3. Climate and Seasonality */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <AnalysisClimateContext context={context} />
          <AnalysisSeasonalityContext context={context} />
        </div>

        {/* Forecast */}
        {context.climateContext.forecastDays && context.climateContext.forecastDays.length > 0 && (
          <AnalysisForecastPanel
            forecastDays={context.climateContext.forecastDays}
            forecastSignal={context.climateContext.forecastSignal}
          />
        )}

        {/* 4. Market and Territory */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <AnalysisMarketContext context={context} />
          <AnalysisTerritorialContext context={context} />
        </div>

        {/* 4.5 CNAE Context */}
        {cnaeContext && <AnalysisCnaeContext cnae={cnaeContext} />}

        {/* 5. Offer Pressure */}
        <AnalysisOfferPressure context={context} />

        {/* 5.5 Market Reference (Competitor Data) */}
        {competitorContext && (
          <AnalysisMarketReference
            competitor={competitorContext}
            currentPrice={context.currentPrice}
          />
        )}

        {/* 6. Alerts and Justifications */}
        <AnalysisAlertsPanel
          alerts={context.alerts}
          positiveSignals={context.positiveSignals}
          negativeSignals={context.negativeSignals}
        />

        {/* 7. Executive Summary */}
        <AnalysisExecutiveSummary
          summary={context.executiveSummary}
          serviceName={context.serviceName}
          pracaName={context.pracaName}
        />
      </div>
    </div>
  );
}

function SectionHeader({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #78BE20 0%, #5A9E10 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Brain size={20} style={{ color: '#FFFFFF' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022' }}>
            Inteligência de Mercado para Pricing
          </h3>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>
            Contexto de mercado e decisão
          </p>
        </div>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            backgroundColor: '#FFFFFF',
            color: '#6B7280',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      )}
    </div>
  );
}
