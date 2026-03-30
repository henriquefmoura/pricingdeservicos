import React, { useEffect } from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import { UserActivityRanking } from './UserActivityRanking';
import { PricingVolumeChart } from './PricingVolumeChart';
import { ApprovalVsRejectionChart } from './ApprovalVsRejectionChart';
import { PricingConsistencyView } from './PricingConsistencyView';
import {
  BarChart3,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const COLORS = {
  primary: '#78BE20',
  dark: '#001022',
  gray: '#6B7280',
  warning: '#F59E0B',
  error: '#DA291C',
  success: '#16A34A',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: '1 1 0',
  minWidth: '200px',
};

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
}

function StatCard({ icon, iconBg, iconColor, value, label, trend }: StatCardProps) {
  return (
    <div style={statCardStyle}>
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: iconColor,
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <h3
          aria-label={`${label}: ${value}`}
          style={{ fontSize: '24px', fontWeight: 700, color: COLORS.dark, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', margin: 0 }}
        >
          {value}
        </h3>
        <span style={{ fontSize: '13px', fontWeight: 400, color: COLORS.gray, lineHeight: 1.4 }}>
          {label}
        </span>
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '12px',
              fontWeight: 600,
              color: trend.positive ? COLORS.success : COLORS.error,
              marginTop: '2px',
            }}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

export function PricingGovernanceDashboard() {
  const initializeMockData = useGovernanceStore((s) => s.initializeMockData);
  const getUserMetrics = useGovernanceStore((s) => s.getUserMetrics);
  const getPlazaMetrics = useGovernanceStore((s) => s.getPlazaMetrics);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  const userMetrics = getUserMetrics();
  const plazaMetrics = getPlazaMetrics();

  const totalPricings = plazaMetrics.reduce((sum, p) => sum + p.totalPricingsReceived, 0);
  const activePlazas = plazaMetrics.filter((p) => p.activeUsers > 0).length;

  const totalApproved = plazaMetrics.reduce((sum, p) => sum + p.totalApproved, 0);
  const totalDecided = totalApproved + plazaMetrics.reduce((sum, p) => sum + p.totalRejected, 0);
  const approvalRate = totalDecided > 0 ? Math.round((totalApproved / totalDecided) * 100) : 0;

  const adminsWithTime = userMetrics.filter((u) => u.role === 'admin' && u.avgDecisionTimeMinutes > 0);
  const avgDecisionTime =
    adminsWithTime.length > 0
      ? Math.round(adminsWithTime.reduce((sum, u) => sum + u.avgDecisionTimeMinutes, 0) / adminsWithTime.length)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.dark, margin: 0 }}>
          Governança de Precificação
        </h2>
        <p style={{ fontSize: '14px', color: COLORS.gray, margin: '4px 0 0 0' }}>
          Visão consolidada de atividades, aprovações e consistência
        </p>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <StatCard
          icon={<BarChart3 size={20} />}
          iconBg="rgba(120, 190, 32, 0.15)"
          iconColor={COLORS.primary}
          value={totalPricings}
          label="Total Precificações"
          trend={{ value: '+12% mês', positive: true }}
        />
        <StatCard
          icon={<MapPin size={20} />}
          iconBg="rgba(59, 130, 246, 0.12)"
          iconColor="#3B82F6"
          value={activePlazas}
          label="Praças Ativas"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          iconBg={approvalRate >= 70 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)'}
          iconColor={approvalRate >= 70 ? COLORS.success : COLORS.warning}
          value={`${approvalRate}%`}
          label="Taxa de Aprovação"
          trend={approvalRate >= 70 ? { value: 'Saudável', positive: true } : { value: 'Atenção', positive: false }}
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="rgba(245, 158, 11, 0.12)"
          iconColor={COLORS.warning}
          value={`${avgDecisionTime} min`}
          label="Tempo Médio de Decisão"
          trend={avgDecisionTime <= 30 ? { value: 'Dentro da meta', positive: true } : { value: 'Acima da meta', positive: false }}
        />
      </div>

      {/* Row 1: User ranking + Volume chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <UserActivityRanking />
        <PricingVolumeChart />
      </div>

      {/* Row 2: Approval vs Rejection + Consistency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <ApprovalVsRejectionChart />
        <PricingConsistencyView />
      </div>
    </div>
  );
}
