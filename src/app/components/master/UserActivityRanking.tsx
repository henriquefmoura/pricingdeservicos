import React from 'react';
import { useGovernanceStore, UserGovernanceMetrics } from '../../store/governanceStore';
import { Crown, User } from 'lucide-react';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
};

function consistencyColor(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#F59E0B';
  return '#DA291C';
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const headerStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#6B7280',
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid #E5E7EB',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  color: '#001022',
  padding: '10px 12px',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

interface RankingTableProps {
  title: string;
  users: UserGovernanceMetrics[];
  roleIcon: React.ReactNode;
  roleBadgeBg: string;
  roleBadgeColor: string;
  roleLabel: string;
  accentColor: string;
}

function RankingTable({ title, users, roleIcon, roleBadgeBg, roleBadgeColor, roleLabel, accentColor }: RankingTableProps) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: roleBadgeBg,
            color: roleBadgeColor,
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {roleIcon}
          {roleLabel}
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: 0 }}>
          {title}
        </h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>#</th>
              <th style={headerStyle}>Usuário</th>
              <th style={headerStyle}>Praça</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Acessos</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Precificações</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Pesq. Mercado</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Aprovações</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Rejeições</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Consistência</th>
              <th style={headerStyle}>Último Acesso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.userId}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <td style={{ ...cellStyle, fontWeight: 700, color: accentColor, width: '40px' }}>
                  {idx + 1}
                </td>
                <td style={cellStyle}>
                  <span style={{ fontWeight: 600 }}>{user.userName}</span>
                </td>
                <td style={cellStyle}>{user.plaza}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600, color: '#6366F1' }}>
                  {user.totalLogins}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>
                  {user.totalPricesSet}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600, color: '#0EA5E9' }}>
                  {user.marketResearchUsage}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600, color: '#16A34A' }}>
                  {user.totalApprovals}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600, color: '#DA291C' }}>
                  {user.totalRejections}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      backgroundColor: consistencyColor(user.consistencyScore),
                      minWidth: '40px',
                    }}
                  >
                    {user.consistencyScore}%
                  </span>
                </td>
                <td style={{ ...cellStyle, color: '#6B7280', fontSize: '13px' }}>
                  {formatDate(user.lastActivity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UserActivityRanking() {
  const getTopUsers = useGovernanceStore((s) => s.getTopUsers);
  const allUsers = getTopUsers(50);

  const adminUsers = allUsers.filter((u) => u.role === 'admin');
  const regularUsers = allUsers.filter((u) => u.role === 'user');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <RankingTable
        title="Ranking de Atividade — Administradores"
        users={adminUsers}
        roleIcon={<Crown size={12} aria-hidden="true" />}
        roleBadgeBg="rgba(120, 190, 32, 0.15)"
        roleBadgeColor="#78BE20"
        roleLabel="Admins"
        accentColor="#78BE20"
      />
      <RankingTable
        title="Ranking de Atividade — Usuários"
        users={regularUsers}
        roleIcon={<User size={12} aria-hidden="true" />}
        roleBadgeBg="rgba(59, 130, 246, 0.12)"
        roleBadgeColor="#3B82F6"
        roleLabel="Usuários"
        accentColor="#3B82F6"
      />
    </div>
  );
}
