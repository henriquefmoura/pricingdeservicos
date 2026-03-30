import React from 'react';
import { useGovernanceStore } from '../../store/governanceStore';
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

export function UserActivityRanking() {
  const getTopUsers = useGovernanceStore((s) => s.getTopUsers);
  const users = getTopUsers(15);

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

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#001022', margin: '0 0 16px 0' }}>
        Ranking de Atividade por Usuário
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>#</th>
              <th style={headerStyle}>Usuário</th>
              <th style={headerStyle}>Praça</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Precificações</th>
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
                <td style={{ ...cellStyle, fontWeight: 700, color: '#6B7280', width: '40px' }}>
                  {idx + 1}
                </td>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{user.userName}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: user.role === 'admin' ? 'rgba(120, 190, 32, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                        color: user.role === 'admin' ? '#78BE20' : '#3B82F6',
                      }}
                    >
                      {user.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </div>
                </td>
                <td style={cellStyle}>{user.plaza}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>
                  {user.totalPricesSet}
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
