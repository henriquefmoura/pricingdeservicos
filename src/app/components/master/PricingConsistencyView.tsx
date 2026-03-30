import React from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
};

function getAlertMessage(plazas: { plaza: string }[]): string {
  if (plazas.length === 1) {
    return `A praça ${plazas[0].plaza} precisa de atenção — consistência abaixo de 70%.`;
  }
  return `${plazas.length} praças precisam de atenção — consistência abaixo de 70%: ${plazas.map((p) => p.plaza).join(', ')}.`;
}

function scoreColor(score: number): string {
  if (score >= 85) return '#16A34A';
  if (score >= 70) return '#78BE20';
  if (score >= 55) return '#F59E0B';
  return '#DA291C';
}

export function PricingConsistencyView() {
  const getPlazaMetrics = useGovernanceStore((s) => s.getPlazaMetrics);
  const getUserMetrics = useGovernanceStore((s) => s.getUserMetrics);
  const plazaMetrics = getPlazaMetrics();
  const userMetrics = getUserMetrics();

  // Build per-plaza average consistency from user metrics
  const plazaConsistency = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const u of userMetrics) {
      const entry = map.get(u.plaza) || { total: 0, count: 0 };
      entry.total += u.consistencyScore;
      entry.count++;
      map.set(u.plaza, entry);
    }
    return plazaMetrics
      .map((p) => {
        const entry = map.get(p.plaza);
        const avgScore = entry && entry.count > 0 ? Math.round(entry.total / entry.count) : 0;
        return { plaza: p.plaza, score: avgScore, users: p.activeUsers };
      })
      .sort((a, b) => b.score - a.score);
  }, [plazaMetrics, userMetrics]);

  const alertPlazas = plazaConsistency.filter((p) => p.score < 70);

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: '0 0 16px 0' }}>
        Consistência de Precificação
      </h3>

      {/* Alert banner */}
      {alertPlazas.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.10)',
            border: '1px solid rgba(245, 158, 11, 0.30)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={16} color="#F59E0B" />
          <span style={{ fontSize: '13px', color: '#92400E' }}>
            {getAlertMessage(alertPlazas)}
          </span>
        </div>
      )}

      {/* Horizontal bar chart */}
      <div style={{ width: '100%', height: Math.max(200, plazaConsistency.length * 38 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={plazaConsistency}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              type="category"
              dataKey="plaza"
              tick={{ fontSize: 13, fill: '#001022', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              formatter={(value: number) => [`${value}%`, 'Consistência']}
              labelFormatter={(label) => `Praça: ${label}`}
            />
            <Bar dataKey="score" name="Consistência" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {plazaConsistency.map((entry) => (
                <Cell key={entry.plaza} fill={scoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Excelente (≥85)', color: '#16A34A' },
          { label: 'Bom (70–84)', color: '#78BE20' },
          { label: 'Atenção (55–69)', color: '#F59E0B' },
          { label: 'Crítico (<55)', color: '#DA291C' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '2px',
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', color: '#6B7280' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
