// ========================================
// Forecast Panel — Próximos Dias
// ========================================

import type { WeatherDailyForecast } from '../../types/weather';
import {
  getWeatherInfo,
  formatTemperature,
  formatPrecipitation,
  formatDateShort,
} from '../../utils/weatherMapper';

interface ForecastPanelProps {
  forecast: WeatherDailyForecast[];
}

export function ForecastPanel({ forecast }: ForecastPanelProps) {
  if (forecast.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #F1F5F9',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '14px',
        }}
      >
        Sem dados de previsão disponíveis.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #F1F5F9',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#1E293B',
          margin: '0 0 20px',
        }}
      >
        Previsão dos Próximos Dias
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(forecast.length, 7)}, 1fr)`,
          gap: '8px',
        }}
      >
        {forecast.slice(0, 7).map((day) => {
          const info = getWeatherInfo(day.weatherCode);

          return (
            <div
              key={day.date}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 8px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              {/* Date */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748B',
                  textTransform: 'capitalize',
                }}
              >
                {formatDateShort(day.date)}
              </span>

              {/* Icon */}
              <span style={{ fontSize: '24px' }}>{info.icon}</span>

              {/* Max / Min */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                >
                  {formatTemperature(day.max)}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#94A3B8',
                  }}
                >
                  {formatTemperature(day.min)}
                </span>
              </div>

              {/* Rain */}
              {day.precipitationSum != null && day.precipitationSum > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#3B82F6',
                    fontWeight: 500,
                  }}
                >
                  💧 {formatPrecipitation(day.precipitationSum)}
                </span>
              )}

              {/* Condition */}
              <span
                style={{
                  fontSize: '10px',
                  color: '#94A3B8',
                  textAlign: 'center',
                  lineHeight: '1.3',
                }}
              >
                {info.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
