// ========================================
// Pricing Climate Advisor — Main Component
// ========================================
// Painel lateral "Inteligência Climática e Sazonal" que exibe
// todas as informações do motor de recomendação.

import type { PricingDecisionSupportOutput } from '../../types/pricingClimate';
import type { WeatherSummary } from '../../types/weather';
import type { ServiceClimateSensitivity } from '../../types/pricingClimate';

import { SeasonalityBadge } from './SeasonalityBadge';
import { SensitivityBadge } from './SensitivityBadge';
import { PricingClimateAlerts } from './PricingClimateAlerts';
import { PricingClimateRecommendationCard } from './PricingClimateRecommendationCard';
import { ClimateForecastMiniPanel } from './ClimateForecastMiniPanel';
import { PricingImpactSummary } from './PricingImpactSummary';
import { PricingClimateChart } from './PricingClimateChart';
import { Brain, RefreshCw, Loader2 } from 'lucide-react';

interface PricingClimateAdvisorProps {
  output: PricingDecisionSupportOutput | null;
  weather: WeatherSummary | null;
  sensitivity: ServiceClimateSensitivity;
  loading: boolean;
  computing: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function PricingClimateAdvisor({
  output,
  weather,
  sensitivity,
  loading,
  computing,
  error,
  onRefresh,
}: PricingClimateAdvisorProps) {
  // Estado de carregamento
  if (loading) {
    return (
      <div style={containerStyle}>
        <Header onRefresh={onRefresh} />
        <div style={loadingStyle}>
          <Loader2 size={24} style={{ color: '#78BE20', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
            Carregando dados climáticos da praça...
          </span>
        </div>
        <style>{spinKeyframes}</style>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div style={containerStyle}>
        <Header onRefresh={onRefresh} />
        <div style={errorStyle}>
          <span style={{ fontSize: '13px', color: '#DC2626' }}>{error}</span>
          {onRefresh && (
            <button onClick={onRefresh} style={retryButtonStyle}>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sem dados
  if (!output || !weather) {
    return (
      <div style={containerStyle}>
        <Header onRefresh={onRefresh} />
        <div style={emptyStyle}>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>
            Edite o preço para ativar o motor de recomendação climática.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Header onRefresh={onRefresh} computing={computing} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
          <SeasonalityBadge
            level={output.climateContext.seasonalityLevel}
            score={output.recommendation.confidence}
          />
          <SensitivityBadge
            level={output.climateContext.sensitivityLevel}
            drivers={output.climateContext.relevantDrivers}
            compact
          />
        </div>

        {/* Recomendação principal */}
        <PricingClimateRecommendationCard recommendation={output.recommendation} />

        {/* Impacto da alteração */}
        <PricingImpactSummary output={output} />

        {/* Alertas */}
        {output.recommendation.alerts.length > 0 && (
          <div>
            <div style={sectionLabelStyle}>Alertas Executivos</div>
            <PricingClimateAlerts alerts={output.recommendation.alerts} />
          </div>
        )}

        {/* Mini painel climático */}
        <ClimateForecastMiniPanel
          weather={weather}
          forecastSignal={output.climateContext.forecastSignal}
        />

        {/* Gráfico */}
        <PricingClimateChart
          historicalCurve={output.chartData.historicalCurve}
          forecastCurve={output.chartData.forecastCurve}
          seasonalityLevel={output.climateContext.seasonalityLevel}
          historicalAverage={weather.historicalAverageTemperature}
        />

        {/* Mensagens adicionais */}
        {output.messages.length > 0 && (
          <div>
            <div style={sectionLabelStyle}>Análise Detalhada</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {output.messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#475569',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    borderLeft: '3px solid #78BE20',
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------
// Header Subcomponent
// ----------------------------------------

function Header({ onRefresh, computing }: { onRefresh?: () => void; computing?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: '#78BE2015',
          }}
        >
          <Brain size={16} style={{ color: '#78BE20' }} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
            Inteligência Climática e Sazonal
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            Motor de recomendação de pricing
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {computing && (
          <Loader2
            size={14}
            style={{ color: '#78BE20', animation: 'spin 1s linear infinite' }}
          />
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            title="Atualizar dados climáticos"
          >
            <RefreshCw size={14} style={{ color: '#64748B' }} />
          </button>
        )}
      </div>
      <style>{spinKeyframes}</style>
    </div>
  );
}

// ----------------------------------------
// Styles
// ----------------------------------------

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  maxWidth: '440px',
  width: '100%',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '8px',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
};

const errorStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '24px 20px',
  textAlign: 'center',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  textAlign: 'center',
};

const retryButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '6px',
  border: '1px solid #E2E8F0',
  backgroundColor: '#FFFFFF',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
};

const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
