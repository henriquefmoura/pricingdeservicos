import React, { useEffect } from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
import { useApprovalStore } from '../../store/approvalStore';
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
  const getAdjustmentLog = useApprovalStore((s) => s.getAdjustmentLog);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        className="rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px' }}>
            <BarChart3 size={24} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.015em' }}>
              Acompanhamento Precificação
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
              Acompanhamento do processo de precificação — atividade dos usuários, volume e qualidade
            </p>
          </div>
        </div>
      </div>

      {/* Summary stat cards - Row 1 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <StatCard
          icon={<BarChart3 size={20} />}
          iconBg="rgba(120, 190, 32, 0.15)"
          iconColor={COLORS.primary}
          value={totalPricings}
          label="Códigos Precificados"
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

      {/* Summary stat cards - Row 2: Process-focused metrics */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <StatCard
          icon={<LogIn size={20} />}
          iconBg="rgba(99, 102, 241, 0.12)"
          iconColor="#6366F1"
          value={totalLogins}
          label="Total de Acessos"
        />
        <StatCard
          icon={<Users size={20} />}
          iconBg="rgba(120, 190, 32, 0.12)"
          iconColor={COLORS.primary}
          value={totalUsers}
          label="Usuários Ativos"
        />
        <StatCard
          icon={<Search size={20} />}
          iconBg="rgba(14, 165, 233, 0.12)"
          iconColor="#0EA5E9"
          value={totalResearch}
          label="Pesquisas de Mercado"
        />
        <StatCard
          icon={<FileText size={20} />}
          iconBg="rgba(168, 85, 247, 0.12)"
          iconColor="#A855F7"
          value={totalDecided}
          label="Decisões Tomadas"
        />
      </div>

      {/* Row 1: User ranking + Volume chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <UserActivityRanking />
        <PricingVolumeChart />
      </div>

      {/* Row 2: Approval vs Rejection + Consistency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ApprovalVsRejectionChart />
        <PricingConsistencyView />
      </div>

      {/* Row 3: Detailed per-user pricing process table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.dark, margin: '0 0 4px 0' }}>
          Detalhamento por Usuário — Processo de Precificação
        </h3>
        <p style={{ fontSize: '13px', color: COLORS.gray, margin: '0 0 16px 0' }}>
          Função, praça, acessos, códigos precificados, pesquisas de mercado, aprovações, rejeições e consistência
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={detailTableHeaderStyle}>Usuário</th>
                <th style={detailTableHeaderStyle}>Função</th>
                <th style={detailTableHeaderStyle}>Praça</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Acessos</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Códigos Precificados</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Pesquisas de Mercado</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Aprovações</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Rejeições</th>
                <th style={{ ...detailTableHeaderStyle, textAlign: 'center' }}>Consistência</th>
              </tr>
            </thead>
            <tbody>
              {userMetrics
                .sort((a, b) => b.totalPricesSet - a.totalPricesSet)
                .map((user, idx) => (
                  <tr
                    key={user.userId}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                    }}
                  >
                    <td style={detailTableCellStyle}>
                      <span style={{ fontWeight: 600 }}>{user.userName}</span>
                    </td>
                    <td style={detailTableCellStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: user.role === 'admin' ? 'rgba(120, 190, 32, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                          color: user.role === 'admin' ? '#78BE20' : '#3B82F6',
                        }}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td style={detailTableCellStyle}>{user.plaza}</td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center', fontWeight: 600 }}>
                      {user.totalLogins}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center', fontWeight: 600, color: COLORS.primary }}>
                      {user.totalPricesSet}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center', fontWeight: 600, color: '#0EA5E9' }}>
                      {user.marketResearchUsage}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                      {user.totalApprovals}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                      {user.totalRejections}
                    </td>
                    <td style={{ ...detailTableCellStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          backgroundColor:
                            user.consistencyScore >= 80
                              ? COLORS.success
                              : user.consistencyScore >= 60
                              ? COLORS.warning
                              : COLORS.error,
                          minWidth: '40px',
                        }}
                      >
                        {user.consistencyScore}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML Training Data: Suggested vs Adjusted Prices */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
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
