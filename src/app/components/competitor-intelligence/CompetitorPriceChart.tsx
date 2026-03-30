// ========================================
// Competitor Price Chart
// ========================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { CompetitorPriceSummary, NormalizedPrice, PricePosition } from '../../types/competitor';

interface Props {
  summary: CompetitorPriceSummary;
  prices: NormalizedPrice[];
  position: PricePosition | null;
}

function fmtBRL(n: number) {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

/**
 * Creates histogram-like data for price distribution.
 */
function buildDistribution(prices: NormalizedPrice[], bucketCount: number = 6) {
  if (prices.length === 0) return [];

  const values = prices.map((p) => p.value).sort((a, b) => a - b);
  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min || 1;
  const bucketSize = range / bucketCount;

  const buckets: { label: string; count: number; from: number; to: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const from = min + i * bucketSize;
    const to = from + bucketSize;
    const count = values.filter((v) => v >= from && (i === bucketCount - 1 ? v <= to : v < to)).length;
    buckets.push({
      label: fmtBRL(Math.round(from)),
      count,
      from,
      to,
    });
  }

  return buckets;
}

export function CompetitorPriceChart({ summary, prices, position }: Props) {
  const data = buildDistribution(prices);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Distribuição de Preços
        </h3>
        {position && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {position.positionLabel}
          </span>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} ocorrências`, 'Frequência']}
              labelFormatter={(label: string) => `Faixa: ${label}`}
            />

            {/* Median reference line */}
            <ReferenceLine
              x={fmtBRL(Math.round(summary.median))}
              stroke="#78BE20"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Mediana', position: 'top', fontSize: 11, fill: '#78BE20' }}
            />

            {/* User price reference line */}
            {position && (
              <ReferenceLine
                x={fmtBRL(Math.round(position.userPrice))}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ value: 'Seu preço', position: 'top', fontSize: 11, fill: '#3B82F6' }}
              />
            )}

            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {(() => {
                const maxCount = Math.max(...data.map(d => d.count));
                return data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.count > 0 ? '#78BE20' : '#e2e8f0'}
                    fillOpacity={0.7 + (maxCount > 0 ? (entry.count / maxCount) * 0.3 : 0)}
                  />
                ));
              })()}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#78BE20]" style={{ borderTop: '2px dashed #78BE20' }} />
          <span className="text-xs text-gray-500">Mediana ({fmtBRL(summary.median)})</span>
        </div>
        {position && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5" style={{ borderTop: '2px dashed #3B82F6' }} />
            <span className="text-xs text-gray-500">Seu preço ({fmtBRL(position.userPrice)})</span>
          </div>
        )}
      </div>
    </div>
  );
}
