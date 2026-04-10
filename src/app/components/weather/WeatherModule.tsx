// ========================================
// Weather Module — Componente Principal
// ========================================

import { useWeather } from '../../hooks/useWeather';
import { CitySelector } from './CitySelector';
import { CurrentWeatherCards } from './CurrentWeatherCards';
import { ForecastPanel } from './ForecastPanel';
import { HistoricalTemperatureChart } from './HistoricalTemperatureChart';
import { ClimateInsightBox } from './ClimateInsightBox';
import { OperationalRiskBadge } from './OperationalRiskBadge';
import { WeatherSkeleton } from './WeatherSkeleton';
import { CloudOff, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface WeatherModuleProps {
  /** Cidade inicial (opcional) */
  initialCity?: string;
  /** Coordenadas pré-definidas (opcional) */
  latitude?: number;
  longitude?: number;
}

export function WeatherModule({ initialCity, latitude, longitude }: WeatherModuleProps) {
  const {
    loading,
    error,
    summary,
    selectedCity,
    selectedPreset,
    customStartDate,
    customEndDate,
    setSelectedCity,
    setSelectedPreset,
    setCustomStartDate,
    setCustomEndDate,
    fetchWeather,
    refresh,
  } = useWeather({
    initialCity,
    latitude,
    longitude,
    autoFetch: !!initialCity,
  });
  const { isMobile, gap } = useResponsive();

  const handleCitySelect = (city: string, lat?: number, lon?: number) => {
    setSelectedCity(city);
    if (lat != null && lon != null) {
      // Coordenadas conhecidas — serão passadas via onSearch
    }
  };

  const handleSearch = (city: string, lat?: number, lon?: number) => {
    fetchWeather(city, lat, lon);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap(24)}px` }}>
      {/* Header */}
      <div
        className="rounded-xl p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <div className="bg-white/20 p-3 rounded-lg" style={{ flexShrink: 0 }}>
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="text-2xl font-bold tracking-tight">
                🌤️ Clima da Praça
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Condições climáticas e impacto operacional
              </p>
            </div>
          </div>

          {summary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <OperationalRiskBadge risk={summary.operationalRisk} />
              <button
                onClick={refresh}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* City Selector */}
      <CitySelector
        selectedCity={selectedCity}
        selectedPreset={selectedPreset}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        loading={loading}
        onCitySelect={handleCitySelect}
        onPresetChange={setSelectedPreset}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
        onSearch={handleSearch}
      />

      {/* Loading */}
      {loading && !summary && <WeatherSkeleton />}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '20px 24px',
            backgroundColor: '#FEF2F2',
            borderRadius: '12px',
            borderLeft: '4px solid #FCA5A5',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#991B1B',
              }}
            >
              Erro ao carregar dados
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#7F1D1D',
              }}
            >
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !summary && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '32px 16px' : '60px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
          }}
        >
          <CloudOff size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#64748B',
              margin: '0 0 8px',
            }}
          >
            Nenhuma praça selecionada
          </h3>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
            Selecione uma praça na lista acima ou busque por uma cidade para visualizar as condições
            climáticas.
          </p>
        </div>
      )}

      {/* Data */}
      {summary && (
        <>
          {/* Current Weather Cards */}
          <CurrentWeatherCards
            current={summary.current}
            city={summary.city}
            historicalDelta={summary.currentVsHistoricalDelta}
          />

          {/* Forecast */}
          <ForecastPanel forecast={summary.forecast} />

          {/* Historical Chart */}
          <HistoricalTemperatureChart
            historical={summary.historical}
            historicalAverage={summary.historicalAverageTemperature}
          />

          {/* Insights */}
          <ClimateInsightBox insights={summary.insights} />
        </>
      )}
    </div>
  );
}
