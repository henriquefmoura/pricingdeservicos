import React from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
};

interface DayBucket {
  date: string;
  label: string;
  price_set: number;
  price_approved: number;
  price_rejected: number;
}

export function PricingVolumeChart() {
  const activityLogs = useGovernanceStore((s) => s.activityLogs);

  const data: DayBucket[] = React.useMemo(() => {
    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, DayBucket>();

    for (let d = 0; d < 30; d++) {
      const dt = new Date(now - d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      const label = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      buckets.set(key, { date: key, label, price_set: 0, price_approved: 0, price_rejected: 0 });
    }

    for (const log of activityLogs) {
      const ts = new Date(log.timestamp).getTime();
      if (ts < cutoff) continue;
      const key = new Date(log.timestamp).toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (log.action === 'price_set') bucket.price_set++;
      else if (log.action === 'price_approved') bucket.price_approved++;
      else if (log.action === 'price_rejected') bucket.price_rejected++;
    }

    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [activityLogs]);

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: '0 0 16px 0' }}>
        Volume de Precificação (30 dias)
      </h3>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              interval="preserveStartEnd"
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
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="price_set"
              name="Precificações"
              fill="#78BE20"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              dataKey="price_approved"
              name="Aprovadas"
              fill="#3B82F6"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              dataKey="price_rejected"
              name="Rejeitadas"
              fill="#DA291C"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
