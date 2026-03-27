// ========================================
// Pricing Climate Chart
// ========================================
// Gráfico com curva histórica + previsão + indicadores de sazonalidade.

import type { ChartDataPoint, SeasonalityLevel } from '../../types/pricingClimate';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface PricingClimateChartProps {
  historicalCurve: ChartDataPoint[];
  forecastCurve: ChartDataPoint[];
  seasonalityLevel: SeasonalityLevel;
  historicalAverage?: number | null;
}

const SEASONALITY_COLORS: Record<SeasonalityLevel, string> = {
  alta: '#16A34A',
  neutra: '#D97706',
  baixa: '#DC2626',
};

export function PricingClimateChart({
  historicalCurve,
  forecastCurve,
  seasonalityLevel,
  historicalAverage,
}: PricingClimateChartProps) {
  if (historicalCurve.length === 0 && forecastCurve.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '13px',
        }}
      >
        Sem dados disponíveis para gráfico.
      </div>
    );
  }

  // Combina dados históricos e previsão para exibir em um único gráfico
  const combinedData = buildCombinedData(historicalCurve, forecastCurve);

  // Limitar a exibição dos últimos N pontos históricos para não poluir
  const maxHistoricalPoints = 30;
  const trimmedData =
    combinedData.length > maxHistoricalPoints + forecastCurve.length
      ? combinedData.slice(combinedData.length - maxHistoricalPoints - forecastCurve.length)
      : combinedData;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
          Curva Climática — Histórico & Previsão
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: `${SEASONALITY_COLORS[seasonalityLevel]}15`,
            color: SEASONALITY_COLORS[seasonalityLevel],
          }}
        >
          Sazonalidade: {seasonalityLevel}
        </span>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trimmedData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}°`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: string) => {
                if (value == null) return ['--', name];
                const numValue = Number(value);
                const labels: Record<string, string> = {
                  historical: 'Histórico',
                  forecast: 'Previsão',
                  average: 'Média histórica',
                };
                return [
                  isNaN(numValue) ? '--' : `${numValue.toFixed(1)}°C`,
                  labels[name] ?? name,
                ];
              }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  historical: 'Histórico',
                  forecast: 'Previsão',
                  average: 'Média',
                };
                return labels[value] ?? value;
              }}
              wrapperStyle={{ fontSize: '11px' }}
            />

            {/* Histórico */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#78BE20"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
            />

            {/* Previsão */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: '#3B82F6' }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />

            {/* Área previsão */}
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="none"
              fill="#3B82F6"
              fillOpacity={0.08}
              connectNulls={false}
            />

            {/* Média histórica */}
            {historicalAverage != null && (
              <ReferenceLine
                y={historicalAverage}
                stroke="#94A3B8"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ----------------------------------------
// Helper
// ----------------------------------------

interface CombinedPoint {
  date: string;
  dateLabel: string;
  historical: number | null;
  forecast: number | null;
  average: number | null;
}

function buildCombinedData(
  historical: ChartDataPoint[],
  forecast: ChartDataPoint[]
): CombinedPoint[] {
  const result: CombinedPoint[] = [];

  for (const h of historical) {
    result.push({
      date: h.date,
      dateLabel: formatShortDate(h.date),
      historical: h.value,
      forecast: null,
      average: null,
    });
  }

  for (const f of forecast) {
    result.push({
      date: f.date,
      dateLabel: formatShortDate(f.date),
      historical: null,
      forecast: f.value,
      average: null,
    });
  }

  // Ordenar por data
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

function formatShortDate(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
