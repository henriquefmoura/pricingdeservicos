import React from 'react';
import {
  BarChart3,
  MapPin,
  CheckCircle,
  Clock,
  LogIn,
  Users,
  Search,
  FileText,
  X,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from 'lucide-react';
import type { UserGovernanceMetrics, PlazaGovernanceMetrics, UserActivityLog } from '../../store/governanceStore';

// ─── Types ───────────────────────────────────────────────────────────
export type KpiKey =
  | 'codigosPrecificados'
  | 'pracasAtivas'
  | 'taxaAprovacao'
  | 'tempoDecisao'
  | 'totalAcessos'
  | 'usuariosAtivos'
  | 'pesquisasMercado'
  | 'decisoesTomadas';

interface KpiDetailPanelProps {
  kpiKey: KpiKey;
  onClose: () => void;
  userMetrics: UserGovernanceMetrics[];
  plazaMetrics: PlazaGovernanceMetrics[];
  activityLogs: UserActivityLog[];
}

// ─── Style constants ─────────────────────────────────────────────────
const COLORS = {
  primary: '#78BE20',
  dark: '#001022',
  gray: '#6B7280',
  warning: '#F59E0B',
  error: '#DA291C',
  success: '#16A34A',
};

const thStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid #E5E7EB',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 400,
  color: '#001022',
  padding: '10px 12px',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

// ─── KPI metadata ────────────────────────────────────────────────────
const KPI_META: Record<KpiKey, { title: string; description: string; icon: React.ReactNode; color: string }> = {
  codigosPrecificados: {
    title: 'Códigos Precificados',
    description: 'Detalhamento dos códigos precificados por praça e usuário, com variações de preço e status',
    icon: <BarChart3 size={22} />,
    color: COLORS.primary,
  },
  pracasAtivas: {
    title: 'Praças Ativas',
    description: 'Detalhamento por praça: usuários, volumes, taxas de aprovação e tempos de decisão',
    icon: <MapPin size={22} />,
    color: '#3B82F6',
  },
  taxaAprovacao: {
    title: 'Taxa de Aprovação',
    description: 'Aprovações e rejeições por praça e por usuário, incluindo taxas e tendências',
    icon: <CheckCircle size={22} />,
    color: COLORS.success,
  },
  tempoDecisao: {
    title: 'Tempo Médio de Decisão',
    description: 'Tempo médio de decisão por usuário Admin e por praça',
    icon: <Clock size={22} />,
    color: COLORS.warning,
  },
  totalAcessos: {
    title: 'Total de Acessos',
    description: 'Histórico de acessos ao sistema por usuário e praça',
    icon: <LogIn size={22} />,
    color: '#6366F1',
  },
  usuariosAtivos: {
    title: 'Usuários Ativos',
    description: 'Lista completa de usuários com atividade, última interação e consistência',
    icon: <Users size={22} />,
    color: COLORS.primary,
  },
  pesquisasMercado: {
    title: 'Pesquisas de Mercado',
    description: 'Pesquisas de mercado realizadas por usuário e praça',
    icon: <Search size={22} />,
    color: '#0EA5E9',
  },
  decisoesTomadas: {
    title: 'Decisões Tomadas',
    description: 'Log de decisões (aprovações e rejeições) com detalhes por praça e usuário',
    icon: <FileText size={22} />,
    color: '#A855F7',
  },
};

// ─── Helper: plaza badge ─────────────────────────────────────────────
function PlazaBadge({ plaza }: { plaza: string }) {
  return (
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
      {plaza}
    </span>
  );
}

function RoleBadge({ role }: { role: 'admin' | 'user' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: role === 'admin' ? 'rgba(120, 190, 32, 0.15)' : 'rgba(59, 130, 246, 0.12)',
        color: role === 'admin' ? '#78BE20' : '#3B82F6',
      }}
    >
      {role === 'admin' ? 'Admin' : 'Usuário'}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.error;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#FFFFFF',
        backgroundColor: color,
        minWidth: '40px',
        textAlign: 'center',
      }}
    >
      {score}%
    </span>
  );
}

// ─── Detail renderers ────────────────────────────────────────────────

function CodigosPrecificadosDetail({ userMetrics, plazaMetrics, activityLogs }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose'>) {
  // Get price_set logs with details
  const pricingLogs = activityLogs
    .filter((l) => l.action === 'price_set')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group by plaza
  const byPlaza = new Map<string, { count: number; users: Set<string> }>();
  for (const log of pricingLogs) {
    if (!byPlaza.has(log.plaza)) byPlaza.set(log.plaza, { count: 0, users: new Set() });
    const entry = byPlaza.get(log.plaza)!;
    entry.count++;
    entry.users.add(log.userName);
  }

  // Extract code from details
  const parseCode = (details?: string) => {
    if (!details) return '—';
    const match = details.match(/([A-Z]{3}-\d{3})/);
    return match ? match[1] : '—';
  };
  const parseService = (details?: string) => {
    if (!details) return '—';
    const match = details.match(/(?:Precificou\s+[A-Z]{3}-\d{3}\s+)(.*)/);
    return match ? match[1] : details;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary by plaza */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Resumo por Praça
        </h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Array.from(byPlaza.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .map(([plaza, data]) => (
              <div
                key={plaza}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E5E7EB',
                  minWidth: '140px',
                  flex: '1 1 140px',
                }}
              >
                <PlazaBadge plaza={plaza} />
                <p style={{ fontSize: '24px', fontWeight: 700, color: COLORS.dark, margin: '8px 0 2px' }}>
                  {data.count}
                </p>
                <p style={{ fontSize: '12px', color: COLORS.gray, margin: 0 }}>
                  códigos · {data.users.size} usuário{data.users.size > 1 ? 's' : ''}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Detailed table */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Últimas Precificações
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Código</th>
                <th style={thStyle}>Serviço</th>
                <th style={thStyle}>Praça</th>
                <th style={thStyle}>Responsável</th>
                <th style={thStyle}>Função</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {pricingLogs.slice(0, 50).map((log, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                    {parseCode(log.details)}
                  </td>
                  <td style={tdStyle}>{parseService(log.details)}</td>
                  <td style={tdStyle}><PlazaBadge plaza={log.plaza} /></td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.userName}</td>
                  <td style={tdStyle}><RoleBadge role={log.userRole} /></td>
                  <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-user breakdown */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Precificações por Usuário
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Função</th>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Códigos Precificados</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aprovações</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Rejeições</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Taxa Rejeição</th>
              </tr>
            </thead>
            <tbody>
              {userMetrics
                .filter((u) => u.totalPricesSet > 0)
                .sort((a, b) => b.totalPricesSet - a.totalPricesSet)
                .map((user, idx) => {
                  const rejRate = user.totalPricesSet > 0
                    ? Math.round((user.totalRejections / user.totalPricesSet) * 100)
                    : 0;
                  return (
                    <tr key={user.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{user.userName}</td>
                      <td style={tdStyle}><RoleBadge role={user.role} /></td>
                      <td style={tdStyle}><PlazaBadge plaza={user.plaza} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: COLORS.primary }}>
                        {user.totalPricesSet}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                        {user.totalApprovals}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                        {user.totalRejections}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: rejRate <= 15 ? 'rgba(22, 163, 74, 0.12)' : rejRate <= 30 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(218, 41, 28, 0.12)',
                            color: rejRate <= 15 ? COLORS.success : rejRate <= 30 ? COLORS.warning : COLORS.error,
                          }}
                        >
                          {rejRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PracasAtivasDetail({ plazaMetrics, userMetrics }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose' | 'activityLogs'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Praça</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Usuários Ativos</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Códigos Recebidos</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Aprovados</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Rejeitados</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Pendentes</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Taxa Aprovação</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Tempo Decisão</th>
            </tr>
          </thead>
          <tbody>
            {plazaMetrics
              .sort((a, b) => b.totalPricingsReceived - a.totalPricingsReceived)
              .map((plaza, idx) => (
                <tr key={plaza.plaza} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    <PlazaBadge plaza={plaza.plaza} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{plaza.activeUsers}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.dark }}>
                    {plaza.totalPricingsReceived}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                    {plaza.totalApproved}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                    {plaza.totalRejected}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.warning }}>
                    {plaza.totalPending}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: plaza.approvalRate >= 70 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: plaza.approvalRate >= 70 ? COLORS.success : COLORS.warning,
                      }}
                    >
                      {plaza.approvalRate}%
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: COLORS.gray }}>
                    {plaza.avgDecisionTime > 0 ? `${plaza.avgDecisionTime} min` : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Users in each plaza */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Usuários por Praça
        </h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {plazaMetrics
            .filter((p) => p.activeUsers > 0)
            .sort((a, b) => b.activeUsers - a.activeUsers)
            .map((plaza) => {
              const plazaUsers = userMetrics.filter((u) => u.plaza === plaza.plaza);
              return (
                <div
                  key={plaza.plaza}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E5E7EB',
                    minWidth: '220px',
                    flex: '1 1 220px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <PlazaBadge plaza={plaza.plaza} />
                    <span style={{ fontSize: '12px', color: COLORS.gray }}>
                      {plazaUsers.length} usuário{plazaUsers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {plazaUsers.map((u) => (
                    <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <RoleBadge role={u.role} />
                      <span style={{ fontSize: '13px', color: COLORS.dark }}>{u.userName}</span>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function TaxaAprovacaoDetail({ plazaMetrics, userMetrics, activityLogs }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose'>) {
  const totalApproved = plazaMetrics.reduce((s, p) => s + p.totalApproved, 0);
  const totalRejected = plazaMetrics.reduce((s, p) => s + p.totalRejected, 0);
  const totalDecided = totalApproved + totalRejected;

  // Recent approval/rejection logs
  const decisionLogs = activityLogs
    .filter((l) => l.action === 'price_approved' || l.action === 'price_rejected')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overall summary */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(22, 163, 74, 0.08)', flex: '1 1 200px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: 700, color: COLORS.success, margin: '0 0 4px' }}>{totalApproved}</p>
          <p style={{ fontSize: '13px', color: COLORS.gray, margin: 0 }}>Aprovações</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(218, 41, 28, 0.08)', flex: '1 1 200px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: 700, color: COLORS.error, margin: '0 0 4px' }}>{totalRejected}</p>
          <p style={{ fontSize: '13px', color: COLORS.gray, margin: 0 }}>Rejeições</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(120, 190, 32, 0.08)', flex: '1 1 200px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', fontWeight: 700, color: COLORS.primary, margin: '0 0 4px' }}>
            {totalDecided > 0 ? Math.round((totalApproved / totalDecided) * 100) : 0}%
          </p>
          <p style={{ fontSize: '13px', color: COLORS.gray, margin: 0 }}>Taxa de Aprovação</p>
        </div>
      </div>

      {/* Per-plaza breakdown */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Taxa de Aprovação por Praça
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aprovados</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Rejeitados</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Taxa</th>
                <th style={thStyle}>Barra</th>
              </tr>
            </thead>
            <tbody>
              {plazaMetrics
                .filter((p) => p.totalApproved + p.totalRejected > 0)
                .sort((a, b) => b.approvalRate - a.approvalRate)
                .map((plaza, idx) => {
                  const total = plaza.totalApproved + plaza.totalRejected;
                  return (
                    <tr key={plaza.plaza} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}><PlazaBadge plaza={plaza.plaza} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                        {plaza.totalApproved}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                        {plaza.totalRejected}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                        {plaza.approvalRate}%
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#E5E7EB', width: '120px' }}>
                          <div style={{ width: `${(plaza.totalApproved / total) * 100}%`, backgroundColor: COLORS.success }} />
                          <div style={{ width: `${(plaza.totalRejected / total) * 100}%`, backgroundColor: COLORS.error }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent decisions */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Últimas Decisões
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Detalhes</th>
                <th style={thStyle}>Responsável</th>
                <th style={thStyle}>Praça</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {decisionLogs.slice(0, 30).map((log, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: log.action === 'price_approved' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(218, 41, 28, 0.12)',
                        color: log.action === 'price_approved' ? COLORS.success : COLORS.error,
                      }}
                    >
                      {log.action === 'price_approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </td>
                  <td style={tdStyle}>{log.details || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.userName}</td>
                  <td style={tdStyle}><PlazaBadge plaza={log.plaza} /></td>
                  <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TempoDecisaoDetail({ userMetrics, plazaMetrics }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose' | 'activityLogs'>) {
  const admins = userMetrics.filter((u) => u.role === 'admin' && u.avgDecisionTimeMinutes > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Per-admin breakdown */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Tempo de Decisão por Admin
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Admin</th>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Tempo Médio</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aprovações</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Rejeições</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Barra</th>
              </tr>
            </thead>
            <tbody>
              {admins
                .sort((a, b) => a.avgDecisionTimeMinutes - b.avgDecisionTimeMinutes)
                .map((admin, idx) => {
                  const isOk = admin.avgDecisionTimeMinutes <= 30;
                  return (
                    <tr key={admin.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{admin.userName}</td>
                      <td style={tdStyle}><PlazaBadge plaza={admin.plaza} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: isOk ? COLORS.success : COLORS.warning }}>
                        {admin.avgDecisionTimeMinutes} min
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                        {admin.totalApprovals}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                        {admin.totalRejections}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: isOk ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isOk ? COLORS.success : COLORS.warning,
                          }}
                        >
                          {isOk ? 'Dentro da meta' : 'Acima da meta'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ width: '100px', height: '8px', borderRadius: '4px', backgroundColor: '#E5E7EB' }}>
                          <div
                            style={{
                              width: `${Math.min(100, (admin.avgDecisionTimeMinutes / 60) * 100)}%`,
                              height: '100%',
                              borderRadius: '4px',
                              backgroundColor: isOk ? COLORS.success : COLORS.warning,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-plaza summary */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Tempo Médio por Praça
        </h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {plazaMetrics
            .filter((p) => p.avgDecisionTime > 0)
            .sort((a, b) => a.avgDecisionTime - b.avgDecisionTime)
            .map((plaza) => {
              const isOk = plaza.avgDecisionTime <= 30;
              return (
                <div
                  key={plaza.plaza}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: `1px solid ${isOk ? 'rgba(22, 163, 74, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    minWidth: '120px',
                    flex: '1 1 120px',
                    textAlign: 'center',
                  }}
                >
                  <PlazaBadge plaza={plaza.plaza} />
                  <p style={{ fontSize: '24px', fontWeight: 700, color: isOk ? COLORS.success : COLORS.warning, margin: '8px 0 2px' }}>
                    {plaza.avgDecisionTime} min
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: isOk ? COLORS.success : COLORS.warning, margin: 0 }}>
                    {isOk ? 'Dentro da meta' : 'Acima da meta'}
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function TotalAcessosDetail({ userMetrics, activityLogs }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose' | 'plazaMetrics'>) {
  const loginLogs = activityLogs
    .filter((l) => l.action === 'login')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Per-user logins */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Acessos por Usuário
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Função</th>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Total de Acessos</th>
                <th style={thStyle}>Última Atividade</th>
              </tr>
            </thead>
            <tbody>
              {userMetrics
                .sort((a, b) => b.totalLogins - a.totalLogins)
                .map((user, idx) => (
                  <tr key={user.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{user.userName}</td>
                    <td style={tdStyle}><RoleBadge role={user.role} /></td>
                    <td style={tdStyle}><PlazaBadge plaza={user.plaza} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#6366F1' }}>
                      {user.totalLogins}
                    </td>
                    <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                      {new Date(user.lastActivity).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent logins */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Últimos Acessos
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Praça</th>
                <th style={thStyle}>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.slice(0, 30).map((log, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.userName}</td>
                  <td style={tdStyle}><PlazaBadge plaza={log.plaza} /></td>
                  <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsuariosAtivosDetail({ userMetrics }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose' | 'plazaMetrics' | 'activityLogs'>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Usuário</th>
            <th style={thStyle}>Função</th>
            <th style={thStyle}>Praça</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Acessos</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Precificações</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Pesquisas</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Aprovações</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Rejeições</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Consistência</th>
            <th style={thStyle}>Última Atividade</th>
          </tr>
        </thead>
        <tbody>
          {userMetrics
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
            .map((user, idx) => (
              <tr key={user.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{user.userName}</td>
                <td style={tdStyle}><RoleBadge role={user.role} /></td>
                <td style={tdStyle}><PlazaBadge plaza={user.plaza} /></td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{user.totalLogins}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.primary }}>
                  {user.totalPricesSet}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#0EA5E9' }}>
                  {user.marketResearchUsage}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                  {user.totalApprovals}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                  {user.totalRejections}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <ScoreBadge score={user.consistencyScore} />
                </td>
                <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                  {new Date(user.lastActivity).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function PesquisasMercadoDetail({ userMetrics, activityLogs }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose' | 'plazaMetrics'>) {
  const researchLogs = activityLogs
    .filter((l) => l.action === 'market_research')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Per-user research */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Pesquisas por Usuário
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Função</th>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Total Pesquisas</th>
              </tr>
            </thead>
            <tbody>
              {userMetrics
                .filter((u) => u.marketResearchUsage > 0)
                .sort((a, b) => b.marketResearchUsage - a.marketResearchUsage)
                .map((user, idx) => (
                  <tr key={user.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{user.userName}</td>
                    <td style={tdStyle}><RoleBadge role={user.role} /></td>
                    <td style={tdStyle}><PlazaBadge plaza={user.plaza} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#0EA5E9' }}>
                      {user.marketResearchUsage}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent research entries */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Últimas Pesquisas
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Descrição</th>
                <th style={thStyle}>Responsável</th>
                <th style={thStyle}>Função</th>
                <th style={thStyle}>Praça</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {researchLogs.slice(0, 40).map((log, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={tdStyle}>{log.details || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.userName}</td>
                  <td style={tdStyle}><RoleBadge role={log.userRole} /></td>
                  <td style={tdStyle}><PlazaBadge plaza={log.plaza} /></td>
                  <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DecisoesTomadasDetail({ userMetrics, plazaMetrics, activityLogs }: Omit<KpiDetailPanelProps, 'kpiKey' | 'onClose'>) {
  const decisionLogs = activityLogs
    .filter((l) => l.action === 'price_approved' || l.action === 'price_rejected')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Per-user decision counts
  const decisionUsers = userMetrics
    .filter((u) => u.totalApprovals + u.totalRejections > 0)
    .sort((a, b) => (b.totalApprovals + b.totalRejections) - (a.totalApprovals + a.totalRejections));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Per-user summary */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Decisões por Usuário
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Usuário</th>
                <th style={thStyle}>Praça</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aprovações</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Rejeições</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Taxa Aprovação</th>
              </tr>
            </thead>
            <tbody>
              {decisionUsers.map((user, idx) => {
                const total = user.totalApprovals + user.totalRejections;
                const rate = total > 0 ? Math.round((user.totalApprovals / total) * 100) : 0;
                return (
                  <tr key={user.userId} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{user.userName}</td>
                    <td style={tdStyle}><PlazaBadge plaza={user.plaza} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                      {user.totalApprovals}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: COLORS.error }}>
                      {user.totalRejections}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{total}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: rate >= 70 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: rate >= 70 ? COLORS.success : COLORS.warning,
                        }}
                      >
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision log */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.dark, margin: '0 0 12px 0' }}>
          Log de Decisões
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Detalhes</th>
                <th style={thStyle}>Responsável</th>
                <th style={thStyle}>Praça</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {decisionLogs.slice(0, 50).map((log, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: log.action === 'price_approved' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(218, 41, 28, 0.12)',
                        color: log.action === 'price_approved' ? COLORS.success : COLORS.error,
                      }}
                    >
                      {log.action === 'price_approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </td>
                  <td style={tdStyle}>{log.details || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{log.userName}</td>
                  <td style={tdStyle}><PlazaBadge plaza={log.plaza} /></td>
                  <td style={{ ...tdStyle, color: COLORS.gray, fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel Component ────────────────────────────────────────────
export function KpiDetailPanel({ kpiKey, onClose, userMetrics, plazaMetrics, activityLogs }: KpiDetailPanelProps) {
  const meta = KPI_META[kpiKey];

  const renderContent = () => {
    switch (kpiKey) {
      case 'codigosPrecificados':
        return <CodigosPrecificadosDetail userMetrics={userMetrics} plazaMetrics={plazaMetrics} activityLogs={activityLogs} />;
      case 'pracasAtivas':
        return <PracasAtivasDetail plazaMetrics={plazaMetrics} userMetrics={userMetrics} />;
      case 'taxaAprovacao':
        return <TaxaAprovacaoDetail plazaMetrics={plazaMetrics} userMetrics={userMetrics} activityLogs={activityLogs} />;
      case 'tempoDecisao':
        return <TempoDecisaoDetail userMetrics={userMetrics} plazaMetrics={plazaMetrics} />;
      case 'totalAcessos':
        return <TotalAcessosDetail userMetrics={userMetrics} activityLogs={activityLogs} />;
      case 'usuariosAtivos':
        return <UsuariosAtivosDetail userMetrics={userMetrics} />;
      case 'pesquisasMercado':
        return <PesquisasMercadoDetail userMetrics={userMetrics} activityLogs={activityLogs} />;
      case 'decisoesTomadas':
        return <DecisoesTomadasDetail userMetrics={userMetrics} plazaMetrics={plazaMetrics} activityLogs={activityLogs} />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Detail header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            title="Voltar"
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <ArrowLeft size={18} color={COLORS.gray} />
          </button>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: `${meta.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.color,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.dark, margin: 0 }}>
              {meta.title}
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.gray, margin: '2px 0 0' }}>
              {meta.description}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <X size={20} color={COLORS.gray} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
