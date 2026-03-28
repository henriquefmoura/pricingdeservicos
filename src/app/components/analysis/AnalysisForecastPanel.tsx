// ========================================
// Analysis Forecast Panel
// ========================================
// Previsão dos próximos dias com impacto no pricing.

import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import type { ClimateForecastDay } from '../../types/pricingAnalysis';

interface Props {
  forecastDays: ClimateForecastDay[];
  forecastSignal?: 'favoravel' | 'neutro' | 'desfavoravel';
}

export function AnalysisForecastPanel({ forecastDays, forecastSignal }: Props) {
  if (!forecastDays || forecastDays.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Previsão dos Próximos Dias
        </h4>
        {forecastSignal && (
          <span style={{
            padding: '3px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 600,
            ...getSignalStyle(forecastSignal),
          }}>
            {getSignalLabel(forecastSignal)}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(forecastDays.length, 7)}, 1fr)`, gap: '8px' }}>
        {forecastDays.slice(0, 7).map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day }: { day: ClimateForecastDay }) {
  const WeatherIcon = getWeatherIcon(day.weatherCode);

  return (
    <div style={{
      padding: '12px 8px',
      borderRadius: '10px',
      backgroundColor: '#F9FAFB',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>
        {formatDayName(day.date)}
      </p>
      <WeatherIcon size={22} style={{ color: getWeatherColor(day.weatherCode) }} />
      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
          {day.tempMax != null ? `${Math.round(day.tempMax)}°` : '-'}
        </p>
        <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
          {day.tempMin != null ? `${Math.round(day.tempMin)}°` : '-'}
        </p>
      </div>
      {day.precipitationSum != null && day.precipitationSum > 0 && (
        <p style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 600 }}>
          {day.precipitationSum.toFixed(1)}mm
        </p>
      )}
    </div>
  );
}

function getWeatherIcon(code: number | null): typeof Sun {
  if (code == null) return Cloud;
  if (code <= 3) return Sun;
  if (code <= 49) return Cloud;
  if (code <= 69) return CloudRain;
  return CloudSnow;
}

function getWeatherColor(code: number | null): string {
  if (code == null) return '#9CA3AF';
  if (code <= 3) return '#F59E0B';
  if (code <= 49) return '#6B7280';
  if (code <= 69) return '#3B82F6';
  return '#93C5FD';
}

function formatDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }).replace('.', '');
  } catch {
    return dateStr;
  }
}

function getSignalStyle(signal: 'favoravel' | 'neutro' | 'desfavoravel') {
  switch (signal) {
    case 'favoravel': return { backgroundColor: '#ECFDF5', color: '#059669' };
    case 'desfavoravel': return { backgroundColor: '#FEF2F2', color: '#DC2626' };
    default: return { backgroundColor: '#F3F4F6', color: '#6B7280' };
  }
}

function getSignalLabel(signal: 'favoravel' | 'neutro' | 'desfavoravel'): string {
  switch (signal) {
    case 'favoravel': return 'Previsão favorável';
    case 'desfavoravel': return 'Previsão desfavorável';
    default: return 'Previsão neutra';
  }
}
