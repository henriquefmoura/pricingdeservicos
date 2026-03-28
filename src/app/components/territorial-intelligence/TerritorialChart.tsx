// ========================================
// Territorial Chart — Recharts
// ========================================

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TerritorialInsightSummary } from '../../types/territorial';

const METRICS = {
  income: { key: 'income' as const, label: 'Renda (R$)', color: '#78BE20' },
  population: { key: 'population' as const, label: 'População', color: '#3B82F6' },
  companies: { key: 'relatedCompanies' as const, label: 'Empresas', color: '#6366F1' },
  meis: { key: 'relatedMEIs' as const, label: 'MEIs', color: '#F59E0B' },
};

interface Props {
  cities: TerritorialInsightSummary[];
  metric: keyof typeof METRICS;
  title?: string;
}

export function TerritorialChart({ cities, metric, title }: Props) {
  const cfg = METRICS[metric];
  const data = cities
    .filter((c) => c[cfg.key] != null)
    .map((c) => ({ name: c.city.length > 15 ? c.city.substring(0, 15) + '…' : c.city, fullName: c.city, value: c[cfg.key] as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (!data.length) return <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-400">Dados insuficientes.</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {title && <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [metric === 'income' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value.toLocaleString('pt-BR'), cfg.label]} />
          <Legend />
          <Bar dataKey="value" name={cfg.label} fill={cfg.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
