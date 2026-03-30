import React from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
};

const COLORS = {
  approved: '#78BE20',
  rejected: '#DA291C',
  pending: '#F59E0B',
};

export function ApprovalVsRejectionChart() {
  const getPlazaMetrics = useGovernanceStore((s) => s.getPlazaMetrics);
  const plazaMetrics = getPlazaMetrics();

  const totals = React.useMemo(() => {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    for (const p of plazaMetrics) {
      approved += p.totalApproved;
      rejected += p.totalRejected;
      pending += p.totalPending;
    }
    const decided = approved + rejected;
    const rate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
    return { approved, rejected, pending, rate };
  }, [plazaMetrics]);

  const pieData = [
    { name: 'Aprovadas', value: totals.approved },
    { name: 'Rejeitadas', value: totals.rejected },
    { name: 'Pendentes', value: totals.pending },
  ];

  const barData = plazaMetrics
    .filter((p) => p.totalApproved + p.totalRejected > 0)
    .map((p) => ({
      plaza: p.plaza,
      approved: p.totalApproved,
      rejected: p.totalRejected,
      pending: p.totalPending,
    }));

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: '0 0 16px 0' }}>
        Aprovações vs Rejeições
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        {/* Donut chart */}
        <div style={{ width: 180, height: 180, position: 'relative', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={COLORS.approved} />
                <Cell fill={COLORS.rejected} />
                <Cell fill={COLORS.pending} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#001022', lineHeight: 1.1 }}>
              {totals.rate}%
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Aprovação</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Aprovadas', value: totals.approved, color: COLORS.approved },
            { label: 'Rejeitadas', value: totals.rejected, color: COLORS.rejected },
            { label: 'Pendentes', value: totals.pending, color: COLORS.pending },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>{item.label}:</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#001022' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-plaza breakdown bar chart */}
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: '0 0 12px 0' }}>
        Por Praça
      </h4>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="plaza"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="approved" name="Aprovadas" fill={COLORS.approved} stackId="stack" maxBarSize={28} />
            <Bar dataKey="rejected" name="Rejeitadas" fill={COLORS.rejected} stackId="stack" maxBarSize={28} />
            <Bar
              dataKey="pending"
              name="Pendentes"
              fill={COLORS.pending}
              stackId="stack"
              maxBarSize={28}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
