import React, { useEffect, useState } from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import { useApprovalStore } from '../../store/approvalStore';
import { UserActivityRanking } from './UserActivityRanking';
import { ApprovalVsRejectionChart } from './ApprovalVsRejectionChart';
import { PricingConsistencyView } from './PricingConsistencyView';
import { KpiDetailPanel, KpiKey } from './KpiDetailPanel';
import { useResponsive } from '../../hooks/useResponsive';
import {
  BarChart3,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Search,
  LogIn,
  FileText,
  Brain,
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
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: '1 1 auto',
  minWidth: '0',
};

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

function StatCard({ icon, iconBg, iconColor, value, label, trend, onClick }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...statCardStyle,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: hovered && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && onClick
          ? '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)'
          : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        border: hovered && onClick ? '1px solid #78BE20' : '1px solid transparent',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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

const detailTableHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid #E5E7EB',
  whiteSpace: 'nowrap',
};

const detailTableCellStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 400,
  color: '#001022',
  padding: '10px 12px',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

export function PricingGovernanceDashboard() {
  const initializeMockData = useGovernanceStore((s) => s.initializeMockData);
  const getUserMetrics = useGovernanceStore((s) => s.getUserMetrics);
  const getPlazaMetrics = useGovernanceStore((s) => s.getPlazaMetrics);
  const activityLogs = useGovernanceStore((s) => s.activityLogs);
  const getAdjustmentLog = useApprovalStore((s) => s.getAdjustmentLog);
  const { gridCols, isMobile, gap: responsiveGap } = useResponsive();

  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  const userMetrics = getUserMetrics();
  const plazaMetrics = getPlazaMetrics();
  const adjustmentLog = getAdjustmentLog();
  const adjustmentLogReversed = adjustmentLog.slice().reverse();

  const totalPricings = plazaMetrics.reduce((sum, p) => sum + p.totalPricingsReceived, 0);
  const activePlazas = plazaMetrics.filter((p) => p.activeUsers > 0).length;

  const totalApproved = plazaMetrics.reduce((sum, p) => sum + p.totalApproved, 0);
  const totalRejected = plazaMetrics.reduce((sum, p) => sum + p.totalRejected, 0);
  const totalDecided = totalApproved + totalRejected;
  const approvalRate = totalDecided > 0 ? Math.round((totalApproved / totalDecided) * 100) : 0;

  const adminsWithTime = userMetrics.filter((u) => u.role === 'admin' && u.avgDecisionTimeMinutes > 0);
  const avgDecisionTime =
    adminsWithTime.length > 0
      ? Math.round(adminsWithTime.reduce((sum, u) => sum + u.avgDecisionTimeMinutes, 0) / adminsWithTime.length)
      : 0;

  const totalLogins = userMetrics.reduce((sum, u) => sum + u.totalLogins, 0);
  const totalResearch = userMetrics.reduce((sum, u) => sum + u.marketResearchUsage, 0);
  const totalUsers = userMetrics.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${responsiveGap(24)}px` }}>
      {/* Header */}
      <div
        className="rounded-xl p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Acompanhamento Precificação</h2>
            <p className="text-white/80 text-sm mt-1">
              Acompanhamento do processo de precificação — atividade dos usuários, volume e qualidade
            </p>
          </div>
        </div>
      </div>

      {/* Summary stat cards - Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols(4)}, 1fr)`, gap: `${responsiveGap(16)}px` }}>
        <StatCard
          icon={<BarChart3 size={20} />}
          iconBg="rgba(120, 190, 32, 0.15)"
          iconColor={COLORS.primary}
          value={totalPricings}
          label="Códigos Precificados"
          trend={{ value: '+12% mês', positive: true }}
          onClick={() => setActiveKpi('codigosPrecificados')}
        />
        <StatCard
          icon={<MapPin size={20} />}
          iconBg="rgba(59, 130, 246, 0.12)"
          iconColor="#3B82F6"
          value={activePlazas}
          label="Praças Ativas"
          onClick={() => setActiveKpi('pracasAtivas')}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          iconBg={approvalRate >= 70 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)'}
          iconColor={approvalRate >= 70 ? COLORS.success : COLORS.warning}
          value={`${approvalRate}%`}
          label="Taxa de Aprovação"
          trend={approvalRate >= 70 ? { value: 'Saudável', positive: true } : { value: 'Atenção', positive: false }}
          onClick={() => setActiveKpi('taxaAprovacao')}
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="rgba(245, 158, 11, 0.12)"
          iconColor={COLORS.warning}
          value={`${avgDecisionTime} min`}
          label="Tempo Médio de Decisão"
          trend={avgDecisionTime <= 30 ? { value: 'Dentro da meta', positive: true } : { value: 'Acima da meta', positive: false }}
          onClick={() => setActiveKpi('tempoDecisao')}
        />
      </div>

      {/* Summary stat cards - Row 2: Process-focused metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols(4)}, 1fr)`, gap: `${responsiveGap(16)}px` }}>
        <StatCard
          icon={<LogIn size={20} />}
          iconBg="rgba(99, 102, 241, 0.12)"
          iconColor="#6366F1"
          value={totalLogins}
          label="Total de Acessos"
          onClick={() => setActiveKpi('totalAcessos')}
        />
        <StatCard
          icon={<Users size={20} />}
          iconBg="rgba(120, 190, 32, 0.12)"
          iconColor={COLORS.primary}
          value={totalUsers}
          label="Usuários Ativos"
          onClick={() => setActiveKpi('usuariosAtivos')}
        />
        <StatCard
          icon={<Search size={20} />}
          iconBg="rgba(14, 165, 233, 0.12)"
          iconColor="#0EA5E9"
          value={totalResearch}
          label="Pesquisas de Mercado"
          onClick={() => setActiveKpi('pesquisasMercado')}
        />
        <StatCard
          icon={<FileText size={20} />}
          iconBg="rgba(168, 85, 247, 0.12)"
          iconColor="#A855F7"
          value={totalDecided}
          label="Decisões Tomadas"
          onClick={() => setActiveKpi('decisoesTomadas')}
        />
      </div>

      {/* KPI Detail Drill-down */}
      {activeKpi && (
        <KpiDetailPanel
          kpiKey={activeKpi}
          onClose={() => setActiveKpi(null)}
          userMetrics={userMetrics}
          plazaMetrics={plazaMetrics}
          activityLogs={activityLogs}
        />
      )}

      {/* User ranking */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <UserActivityRanking />
      </div>

      {/* Row 2: Approval vs Rejection + Market Research */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ApprovalVsRejectionChart />
        <PricingConsistencyView />
      </div>

      {/* ML Training Data: Suggested vs Adjusted Prices */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
          borderTop: '4px solid #6366F1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Brain size={20} color="#6366F1" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.dark, margin: 0 }}>
            Base de Dados para ML — Variações de Preço Ajustado
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: COLORS.gray, margin: '0 0 16px 0' }}>
          Comparativo entre o preço sugerido pelo sistema e o preço ajustado pelo usuário após rejeição. Esses dados alimentam o aprendizado de máquina para calibração automática de preços.
        </p>

        {adjustmentLog.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px dashed #D1D5DB',
            }}
          >
            <Brain size={40} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', margin: '0 0 4px 0' }}>
              Nenhum ajuste registrado ainda
            </p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
              Quando usuários rejeitarem e ajustarem preços, os dados aparecerão aqui
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={detailTableHeaderStyle}>Código</th>
                  <th style={detailTableHeaderStyle}>Serviço</th>
                  <th style={detailTableHeaderStyle}>Praça</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Rep. Sugerido</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Venda Sugerida</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Margem Sugerida</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Rep. Ajustado</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Venda Ajustada</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'right' }}>Margem Ajustada</th>
                  <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Variação</th>
                  <th style={detailTableHeaderStyle}>Ajustado por</th>
                  <th style={detailTableHeaderStyle}>Data</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentLogReversed.map((record, idx) => (
                  <tr
                    key={record.id}
                    style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}
                  >
                    <td style={{ ...detailTableCellStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                      {record.codigo}
                    </td>
                    <td style={detailTableCellStyle}>{record.descricao}</td>
                    <td style={detailTableCellStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#3B82F6',
                        }}
                      >
                        {record.plaza}
                      </span>
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', color: '#6B7280' }}>
                      R$ {record.suggestedRepasse.toFixed(2)}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', color: '#6B7280' }}>
                      R$ {record.suggestedVenda.toFixed(2)}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', color: '#6B7280' }}>
                      {record.suggestedMargem.toFixed(1)}%
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', fontWeight: 600 }}>
                      R$ {record.adjustedRepasse.toFixed(2)}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', fontWeight: 600 }}>
                      R$ {record.adjustedVenda.toFixed(2)}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'right', fontWeight: 600 }}>
                      {record.adjustedMargem.toFixed(1)}%
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor:
                            record.variationPercent > 0
                              ? 'rgba(22, 163, 74, 0.12)'
                              : record.variationPercent < 0
                              ? 'rgba(218, 41, 28, 0.12)'
                              : 'rgba(107, 114, 128, 0.12)',
                          color:
                            record.variationPercent > 0
                              ? COLORS.success
                              : record.variationPercent < 0
                              ? COLORS.error
                              : COLORS.gray,
                        }}
                      >
                        {record.variationPercent > 0 ? (
                          <TrendingUp size={11} />
                        ) : record.variationPercent < 0 ? (
                          <TrendingDown size={11} />
                        ) : null}
                        {record.variationPercent > 0 ? '+' : ''}
                        {record.variationPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td style={detailTableCellStyle}>{record.adjustedBy}</td>
                    <td style={{ ...detailTableCellStyle, color: '#6B7280', fontSize: '12px' }}>
                      {new Date(record.adjustedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
