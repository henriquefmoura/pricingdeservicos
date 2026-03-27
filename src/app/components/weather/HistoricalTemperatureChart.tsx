// ========================================
// Historical Temperature Chart
// ========================================

import type { WeatherHistoricalDaily } from '../../types/weather';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatDateShort } from '../../utils/weatherMapper';

interface HistoricalTemperatureChartProps {
  historical: WeatherHistoricalDaily[];
  historicalAverage: number | null;
}

export function HistoricalTemperatureChart({
  historical,
  historicalAverage,
}: HistoricalTemperatureChartProps) {
  if (historical.length === 0) {
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
        Sem dados históricos disponíveis para o período selecionado.
      </div>
    );
  }

  const chartData = historical.map((d) => ({
    date: formatDateShort(d.date),
    rawDate: d.date,
    mean: d.mean,
    max: d.max,
    min: d.min,
    average: historicalAverage,
  }));

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #F1F5F9',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1E293B',
            margin: 0,
          }}
        >
          Histórico de Temperatura
        </h3>

        {historicalAverage != null && (
          <span
            style={{
              fontSize: '13px',
              color: '#64748B',
              backgroundColor: '#F8FAFC',
              padding: '4px 12px',
              borderRadius: '6px',
            }}
          >
            Média do período: <strong>{historicalAverage.toFixed(1)}°C</strong>
          </span>
        )}
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}°`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '13px',
              }}
              formatter={(value: unknown, name: string) => {
                if (value == null) return ['--', name];
                const numValue = Number(value);
                const labels: Record<string, string> = {
                  max: 'Máxima',
                  min: 'Mínima',
                  mean: 'Média',
                  average: 'Média do período',
                };
                return [
                  isNaN(numValue) ? '--' : `${numValue.toFixed(1)}°C`,
                  labels[name] ?? name,
                ];
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  max: 'Máxima',
                  min: 'Mínima',
                  mean: 'Média',
                  average: 'Média do período',
                };
                return labels[value] ?? value;
              }}
            />

            <Line
              type="monotone"
              dataKey="max"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="mean"
              stroke="#78BE20"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {historicalAverage != null && (
              <Line
                type="monotone"
                dataKey="average"
                stroke="#94A3B8"
                strokeWidth={1}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
