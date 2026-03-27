// ========================================
// Climate Forecast Mini Panel
// ========================================

import type { WeatherSummary } from '../../types/weather';
import type { ClimateSignal } from '../../types/pricingClimate';
import { getWeatherInfo } from '../../utils/weatherMapper';
import { CloudSun, Droplets, Wind, Thermometer } from 'lucide-react';

interface ClimateForecastMiniPanelProps {
  weather: WeatherSummary;
  forecastSignal?: ClimateSignal;
}

const SIGNAL_CONFIG: Record<ClimateSignal, { label: string; color: string; bg: string }> = {
  favoravel: { label: 'Previsão favorável', color: '#166534', bg: '#DCFCE7' },
  neutro: { label: 'Previsão neutra', color: '#854D0E', bg: '#FEF9C3' },
  desfavoravel: { label: 'Previsão desfavorável', color: '#991B1B', bg: '#FEE2E2' },
};

export function ClimateForecastMiniPanel({
  weather,
  forecastSignal = 'neutro',
}: ClimateForecastMiniPanelProps) {
  const weatherInfo = getWeatherInfo(weather.current.weatherCode);
  const signalConfig = SIGNAL_CONFIG[forecastSignal];

  const forecastDays = weather.forecast.slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid #E2E8F0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudSun size={16} style={{ color: '#64748B' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
            Clima Atual & Previsão
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: signalConfig.bg,
            color: signalConfig.color,
          }}
        >
          {signalConfig.label}
        </span>
      </div>

      {/* Current conditions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 12px',
          borderRadius: '8px',
          backgroundColor: '#F8FAFC',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '24px' }}>{weatherInfo.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
            {weatherInfo.label}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            {weather.current.temperature != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Thermometer size={12} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {weather.current.temperature.toFixed(1)}°C
                </span>
              </div>
            )}
            {weather.current.precipitation != null && weather.current.precipitation > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplets size={12} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {weather.current.precipitation.toFixed(1)} mm
                </span>
              </div>
            )}
            {weather.current.windSpeed != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wind size={12} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {weather.current.windSpeed.toFixed(0)} km/h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forecast mini */}
      {forecastDays.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
          {forecastDays.map((day) => {
            const dayInfo = getWeatherInfo(day.weatherCode);
            const dateStr = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'short',
            });

            return (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'capitalize' }}>
                  {dateStr}
                </div>
                <div style={{ fontSize: '16px', margin: '2px 0' }}>{dayInfo.icon}</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  {day.max != null ? `${day.max.toFixed(0)}°` : '--'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
