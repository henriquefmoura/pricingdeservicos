// ========================================
// Analysis Climate Context
// ========================================
// Bloco de clima: temperatura, sensação, precipitação, previsão, impacto.

import React from 'react';
import { Thermometer, Droplets, Wind, Cloud, Sun, CloudRain } from 'lucide-react';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisClimateContext({ context }: Props) {
  const { climateContext } = context;

  if (!climateContext.enabled) {
    return (
      <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
          Clima e Impacto
        </h4>
        <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
          Dados climáticos não disponíveis para esta praça.
        </p>
      </div>
    );
  }

  const signalConfig = getSignalConfig(climateContext.forecastSignal);
  const impactConfig = getImpactConfig(climateContext.climateImpactLevel);

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Clima e Impacto
        </h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: signalConfig.bg,
            color: signalConfig.text,
          }}>
            {signalConfig.label}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: impactConfig.bg,
            color: impactConfig.text,
          }}>
            Impacto {impactConfig.label}
          </span>
        </div>
      </div>

      {/* Current weather */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <WeatherMetric
          icon={<Thermometer size={16} style={{ color: '#EF4444' }} />}
          label="Temperatura"
          value={climateContext.currentTemperature != null ? `${climateContext.currentTemperature.toFixed(1)}°C` : 'N/D'}
        />
        <WeatherMetric
          icon={<Droplets size={16} style={{ color: '#3B82F6' }} />}
          label="Precipitação"
          value={climateContext.precipitation != null ? `${climateContext.precipitation.toFixed(1)} mm` : 'N/D'}
        />
        <WeatherMetric
          icon={<Wind size={16} style={{ color: '#6B7280' }} />}
          label="Vento"
          value={climateContext.windSpeed != null ? `${climateContext.windSpeed.toFixed(1)} km/h` : 'N/D'}
        />
      </div>

      {/* Weather summary */}
      {climateContext.weatherSummary && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: signalConfig.bg, marginBottom: '12px' }}>
          <p style={{ fontSize: '13px', color: signalConfig.text, fontWeight: 500 }}>
            {climateContext.weatherSummary}
          </p>
        </div>
      )}

      {/* Forecast mini */}
      {climateContext.forecastDays && climateContext.forecastDays.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px' }}>
            PREVISÃO PRÓXIMOS DIAS
          </p>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {climateContext.forecastDays.slice(0, 5).map((day) => (
              <div
                key={day.date}
                style={{
                  flex: '1 0 auto',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB',
                  textAlign: 'center',
                  minWidth: '64px',
                }}
              >
                <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '4px' }}>
                  {formatShortDate(day.date)}
                </p>
                <ForecastIcon code={day.weatherCode} />
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>
                  {day.tempMax != null ? `${Math.round(day.tempMax)}°` : '-'} / {day.tempMin != null ? `${Math.round(day.tempMin)}°` : '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
      {icon}
      <div>
        <p style={{ fontSize: '10px', color: '#9CA3AF' }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{value}</p>
      </div>
    </div>
  );
}

function ForecastIcon({ code }: { code: number | null }) {
  if (code == null) return <Cloud size={16} style={{ color: '#9CA3AF' }} />;
  if (code <= 3) return <Sun size={16} style={{ color: '#F59E0B' }} />;
  if (code <= 49) return <Cloud size={16} style={{ color: '#6B7280' }} />;
  return <CloudRain size={16} style={{ color: '#3B82F6' }} />;
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  } catch {
    return dateStr;
  }
}

function getSignalConfig(signal?: 'favoravel' | 'neutro' | 'desfavoravel') {
  switch (signal) {
    case 'favoravel':
      return { label: 'Clima Favorável', bg: '#ECFDF5', text: '#059669' };
    case 'desfavoravel':
      return { label: 'Clima Desfavorável', bg: '#FEF2F2', text: '#DC2626' };
    default:
      return { label: 'Clima Neutro', bg: '#F3F4F6', text: '#6B7280' };
  }
}

function getImpactConfig(level?: 'baixo' | 'medio' | 'alto') {
  switch (level) {
    case 'alto':
      return { label: 'Alto', bg: '#FEF2F2', text: '#DC2626' };
    case 'medio':
      return { label: 'Médio', bg: '#FFFBEB', text: '#D97706' };
    default:
      return { label: 'Baixo', bg: '#F3F4F6', text: '#6B7280' };
  }
}
