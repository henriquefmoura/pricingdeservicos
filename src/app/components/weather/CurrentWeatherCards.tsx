// ========================================
// Current Weather Cards
// ========================================

import type { WeatherCurrent } from '../../types/weather';
import {
  Thermometer,
  ThermometerSun,
  CloudRain,
  Wind,
  Clock,
} from 'lucide-react';
import {
  getWeatherInfo,
  formatTemperature,
  formatPrecipitation,
  formatWindSpeed,
  formatTime,
} from '../../utils/weatherMapper';
import { useResponsive } from '../../hooks/useResponsive';

interface CurrentWeatherCardsProps {
  current: WeatherCurrent;
  city: string;
  historicalDelta: number | null;
}

interface WeatherCardData {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ElementType;
  iconColor: string;
  highlight?: boolean;
}

export function CurrentWeatherCards({ current, city, historicalDelta }: CurrentWeatherCardsProps) {
  const weatherInfo = getWeatherInfo(current.weatherCode);
  const { isMobile } = useResponsive();

  const cards: WeatherCardData[] = [
    {
      label: 'Temperatura',
      value: formatTemperature(current.temperature),
      sublabel: weatherInfo.label,
      icon: Thermometer,
      iconColor: '#EF4444',
      highlight: true,
    },
    {
      label: 'Sensação Térmica',
      value: formatTemperature(current.apparentTemperature),
      icon: ThermometerSun,
      iconColor: '#F97316',
    },
    {
      label: 'Precipitação',
      value: formatPrecipitation(current.precipitation),
      icon: CloudRain,
      iconColor: '#3B82F6',
    },
    {
      label: 'Vento',
      value: formatWindSpeed(current.windSpeed),
      icon: Wind,
      iconColor: '#6366F1',
    },
    {
      label: 'Leitura',
      value: formatTime(current.time),
      sublabel: city,
      icon: Clock,
      iconColor: '#8B5CF6',
    },
  ];

  return (
    <div>
      {/* Condition banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '28px' }}>{weatherInfo.icon}</span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: '#475569',
          }}
        >
          {weatherInfo.label}
        </span>
        {historicalDelta != null && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '13px',
              fontWeight: 600,
              color: historicalDelta > 0 ? '#DC2626' : historicalDelta < 0 ? '#2563EB' : '#64748B',
              backgroundColor:
                historicalDelta > 0 ? '#FEF2F2' : historicalDelta < 0 ? '#EFF6FF' : '#F8FAFC',
              padding: '4px 12px',
              borderRadius: '100px',
            }}
          >
            {historicalDelta > 0 ? '+' : ''}
            {historicalDelta.toFixed(1)}°C vs média
          </span>
        )}
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '130px' : '170px'}, 1fr))`,
          gap: '12px',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                border: card.highlight ? '2px solid #78BE20' : '1px solid #F1F5F9',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: card.iconColor + '14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} style={{ color: card.iconColor }} />
                </div>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                  {card.label}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: card.highlight ? (isMobile ? '22px' : '28px') : (isMobile ? '18px' : '22px'),
                  fontWeight: 700,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                {card.value}
              </p>

              {card.sublabel && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  {card.sublabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
