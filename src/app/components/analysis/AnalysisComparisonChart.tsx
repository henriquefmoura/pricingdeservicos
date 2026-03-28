// ========================================
// Analysis Comparison Chart
// ========================================
// Gráfico de comparação de preço entre praças.

import React from 'react';
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
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisComparisonChart({ context }: Props) {
  const { currentPrice, proposedPrice, pracaName, historicalContext } = context;
  const avg = historicalContext.localAverage ?? currentPrice;

  // Build comparison data
  const data = [
    { name: 'Mínimo', value: Math.round(avg * 0.85 * 100) / 100, fill: '#94A3B8' },
    { name: 'Média', value: Math.round(avg * 100) / 100, fill: '#6B7280' },
    { name: 'Atual', value: currentPrice, fill: '#78BE20' },
    { name: 'Proposto', value: proposedPrice, fill: proposedPrice > currentPrice ? '#059669' : proposedPrice < currentPrice ? '#DC2626' : '#3B82F6' },
    { name: 'Máximo', value: Math.round(avg * 1.15 * 100) / 100, fill: '#94A3B8' },
  ];

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        Posição de Preço — {pracaName}
      </h4>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div style={{ backgroundColor: '#FFF', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{d.name}</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: d.fill }}>
                      R$ {d.value.toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={avg} stroke="#9CA3AF" strokeDasharray="3 3" label={{ value: 'Média', fill: '#9CA3AF', fontSize: 10 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
