// ========================================
// Analysis Historical Curve
// ========================================
// Curva de referência histórica de preço.

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PricingAnalysisDecisionContext } from '../../types/pricingAnalysis';

interface Props {
  context: PricingAnalysisDecisionContext;
}

export function AnalysisHistoricalCurve({ context }: Props) {
  const { currentPrice, proposedPrice, historicalContext, pracaName } = context;
  const avg = historicalContext.localAverage ?? currentPrice;

  // Generate mock historical data points
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();

  const data = months.map((month, i) => {
    const factor = 0.95 + ((i % 4) * 0.03) + (Math.sin(i * 0.5) * 0.02);
    return {
      month,
      historico: Math.round(avg * factor * 100) / 100,
      atual: i === currentMonth ? currentPrice : null,
      proposto: i === currentMonth ? proposedPrice : null,
    };
  });

  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        Curva Histórica — {pracaName}
      </h4>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{ backgroundColor: '#FFF', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{label}</p>
                    {payload.map((entry: any) => (
                      entry.value != null && (
                        <p key={entry.dataKey} style={{ fontSize: '12px', color: entry.color }}>
                          {entry.name}: R$ {Number(entry.value).toFixed(2)}
                        </p>
                      )
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={avg} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="historico" stroke="#94A3B8" strokeWidth={2} dot={false} name="Histórico" />
          <Line type="monotone" dataKey="atual" stroke="#78BE20" strokeWidth={0} dot={{ r: 6, fill: '#78BE20' }} name="Atual" connectNulls={false} />
          <Line type="monotone" dataKey="proposto" stroke="#3B82F6" strokeWidth={0} dot={{ r: 6, fill: '#3B82F6', stroke: '#FFF', strokeWidth: 2 }} name="Proposto" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
        <LegendItem color="#94A3B8" label="Histórico" />
        <LegendItem color="#78BE20" label="Preço Atual" />
        <LegendItem color="#3B82F6" label="Preço Proposto" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
      <span style={{ fontSize: '11px', color: '#6B7280' }}>{label}</span>
    </div>
  );
}
