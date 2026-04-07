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
  Legend,
} from 'recharts';
import { Search, AlertTriangle } from 'lucide-react';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
};

function usageColor(usage: number, max: number): string {
  const ratio = max > 0 ? usage / max : 0;
  if (ratio >= 0.7) return '#16A34A';
  if (ratio >= 0.4) return '#0EA5E9';
  if (ratio >= 0.2) return '#F59E0B';
  return '#DA291C';
}

export function PricingConsistencyView() {
  const getUserMetrics = useGovernanceStore((s) => s.getUserMetrics);
  const getPlazaMetrics = useGovernanceStore((s) => s.getPlazaMetrics);
  const userMetrics = getUserMetrics();
  const plazaMetrics = getPlazaMetrics();

  // Build per-plaza market research usage
  const plazaResearch = React.useMemo(() => {
    const map = new Map<string, { totalResearch: number; totalPricings: number; userCount: number }>();
    for (const u of userMetrics) {
      const entry = map.get(u.plaza) || { totalResearch: 0, totalPricings: 0, userCount: 0 };
      entry.totalResearch += u.marketResearchUsage;
      entry.totalPricings += u.totalPricesSet;
      entry.userCount++;
      map.set(u.plaza, entry);
    }
    return plazaMetrics
      .map((p) => {
        const entry = map.get(p.plaza);
        const totalResearch = entry ? entry.totalResearch : 0;
        const totalPricings = entry ? entry.totalPricings : 0;
        const avgPerUser = entry && entry.userCount > 0 ? Math.round(totalResearch / entry.userCount) : 0;
        const researchRate = totalPricings > 0 ? Math.round((totalResearch / totalPricings) * 100) : 0;
        return {
          plaza: p.plaza,
          totalResearch,
          avgPerUser,
          researchRate,
          activeUsers: p.activeUsers,
        };
      })
      .sort((a, b) => b.totalResearch - a.totalResearch);
  }, [plazaMetrics, userMetrics]);

  const maxResearch = Math.max(...plazaResearch.map((p) => p.totalResearch), 1);
  const lowUsagePlazas = plazaResearch.filter((p) => p.totalResearch > 0 && p.totalResearch / maxResearch < 0.3);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Search size={18} color="#0EA5E9" />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: 0 }}>
          Pesquisa de Mercado por Praça
        </h3>
      </div>

      {/* Alert banner */}
      {lowUsagePlazas.length > 0 && (
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
            {lowUsagePlazas.length === 1
              ? `A praça ${lowUsagePlazas[0].plaza} tem uso baixo de pesquisa de mercado.`
              : `${lowUsagePlazas.length} praças com uso baixo de pesquisa de mercado: ${lowUsagePlazas.map((p) => p.plaza).join(', ')}.`}
          </span>
        </div>
      )}

      {/* Horizontal bar chart */}
      <div style={{ width: '100%', height: Math.max(200, plazaResearch.length * 38 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={plazaResearch}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              allowDecimals={false}
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
              formatter={(value: number, name: string) => {
                if (name === 'Pesquisas') return [value, 'Total de Pesquisas'];
                return [value, name];
              }}
              labelFormatter={(label) => `Praça: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="totalResearch" name="Pesquisas" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {plazaResearch.map((entry) => (
                <Cell key={entry.plaza} fill={usageColor(entry.totalResearch, maxResearch)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap',
        }}
      >
        {plazaResearch.map((p) => (
          <div
            key={p.plaza}
            style={{
              flex: '1 1 120px',
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
              {p.plaza}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0EA5E9' }}>
              {p.totalResearch}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
              {p.researchRate}% por precificação
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Alto uso (≥70%)', color: '#16A34A' },
          { label: 'Bom (40–69%)', color: '#0EA5E9' },
          { label: 'Moderado (20–39%)', color: '#F59E0B' },
          { label: 'Baixo (<20%)', color: '#DA291C' },
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
