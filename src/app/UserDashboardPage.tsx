import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Tabs } from './components/Tabs';
import { CurrencyInput } from './components/Input';
import { Check, X, ArrowRight, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useApprovalStore } from './store/approvalStore';
import { SharedAnalysisPanel } from './components/shared/SharedAnalysisPanel';
import { toast } from 'sonner';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    approvals,
    approvePrice,
    rejectPrice,
    getPendingApprovals,
    getRejectedApprovals,
    initializeMockData,
    applyRejectedPrice,
  } = useApprovalStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'analysis'>('pending');
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editRepasseValue, setEditRepasseValue] = useState('');
  const [editVendaValue, setEditVendaValue] = useState('');

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role === 'master') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize mock data
  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  // Get approvals for user's plaza
  const pendingItems = useMemo(() => {
    return getPendingApprovals(user?.plaza);
  }, [approvals, user?.plaza, getPendingApprovals]);

  const rejectedItems = useMemo(() => {
    return getRejectedApprovals(user?.plaza);
  }, [approvals, user?.plaza, getRejectedApprovals]);

  const approvedItems = useMemo(() => {
    return approvals.filter(
      (a) => a.status === 'approved' && (!user?.plaza || a.plaza === user.plaza)
    );
  }, [approvals, user?.plaza]);

  const handleApprove = (id: string) => {
    approvePrice(id, user?.name || 'Usuário', '');
    toast.success('Preço aprovado com sucesso!');
    setExpandedComment(null);
  };

  const handleRejectWithNewPrice = (id: string) => {
    // Direct reject → open inline new price editor
    setExpandedComment(expandedComment === id ? null : id);
    setEditingPrice(id);
    const found = pendingItems.find((i) => i.id === id) || rejectedItems.find((i) => i.id === id);
    if (found) {
      setEditRepasseValue(found.proposedRepasse.toFixed(2));
      setEditVendaValue(found.proposedVenda.toFixed(2));
    }
  };

  const handleConfirmRejection = (id: string) => {
    const repasse = parseFloat(editRepasseValue);
    const venda = parseFloat(editVendaValue);
    if (isNaN(repasse) || isNaN(venda)) {
      toast.error('Valores inválidos');
      return;
    }
    if (repasse >= venda) {
      toast.error('Venda deve ser maior que repasse');
      return;
    }
    // Reject with new suggested price
    rejectPrice(id, user?.name || 'Usuário', `Novo preço sugerido: R$ ${venda.toFixed(2)}`);
    applyRejectedPrice(id, repasse, venda);
    toast.success('Preço rejeitado e novo valor sugerido com sucesso!');
    setEditingPrice(null);
    setExpandedComment(null);
  };

  const handleDefineNewPrice = (id: string) => {
    setEditingPrice(id);
    const item = rejectedItems.find((i) => i.id === id);
    if (item) {
      setEditRepasseValue(item.proposedRepasse.toFixed(2));
      setEditVendaValue(item.proposedVenda.toFixed(2));
    }
  };

  const handleSaveNewPrice = (id: string) => {
    const repasse = parseFloat(editRepasseValue);
    const venda = parseFloat(editVendaValue);
    if (isNaN(repasse) || isNaN(venda)) {
      toast.error('Valores inválidos');
      return;
    }
    if (repasse >= venda) {
      toast.error('Venda deve ser maior que repasse');
      return;
    }
    applyRejectedPrice(id, repasse, venda);
    toast.success('Novo preço aplicado com sucesso!');
    setEditingPrice(null);
  };

  const filteredItems =
    activeTab === 'pending'
      ? pendingItems
      : activeTab === 'rejected'
      ? rejectedItems
      : activeTab === 'approved'
      ? approvedItems
      : [];

  if (!isAuthenticated || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="Dashboard" title="Validação de Preços" subtitle={`Aprove, rejeite ou sugira novos preços para a praça ${user?.plaza || ''}`}>
      {/* Tab Bar */}
      <Tabs
        tabs={[
          { id: 'pending', label: 'Pendentes', count: pendingItems.length },
          { id: 'approved', label: 'Aprovados', count: approvedItems.length },
          { id: 'rejected', label: 'Rejeitados', count: rejectedItems.length },
          { id: 'analysis', label: 'Análise de Mercado' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        style={{ marginBottom: '24px' }}
      />

      {activeTab === 'analysis' ? (
        <SharedAnalysisPanel userPlaza={user?.plaza} userRole="user" />
      ) : (
      <>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: activeTab === 'pending' ? '2px solid #F59E0B' : '2px solid transparent',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#001022' }}>{pendingItems.length}</p>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>aguardando aprovação</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: activeTab === 'approved' ? '2px solid #78BE20' : '2px solid transparent',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(120, 190, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={20} style={{ color: '#78BE20' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#001022' }}>{approvedItems.length}</p>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>aprovados</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: activeTab === 'rejected' ? '2px solid #DA291C' : '2px solid transparent',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(218, 41, 28, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircle size={20} style={{ color: '#DA291C' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#001022' }}>{rejectedItems.length}</p>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>rejeitados</p>
          </div>
        </div>
      </div>

      {/* Approval Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px' }}>
        {filteredItems.map((item) => {
          const isRejected = item.status === 'rejected';
          const isApproved = item.status === 'approved';
          const isEditing = editingPrice === item.id;
          const showComment = expandedComment === item.id;

          return (
            <div
              key={item.id}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: isRejected ? '4px solid #DA291C' : isApproved ? '4px solid #78BE20' : 'none',
                paddingLeft: isRejected || isApproved ? '16px' : '20px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: isRejected || isApproved ? '1fr 1fr' : '1fr 1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* LEFT - Service Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#E0F2FE',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#0369A1',
                      }}
                    >
                      {item.grupo}
                    </span>
                    {item.isNewService && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#DBEAFE',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#1E40AF',
                        }}
                      >
                        Novo
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>
                    {item.descricao}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>{item.codigo}</span>
                    <ArrowRight size={14} style={{ color: '#9CA3AF' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#001022' }}>
                      Praça {item.plaza}
                    </span>
                  </div>
                </div>

                {/* CENTER - Price Details (pending only) */}
                {!isRejected && !isApproved && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
                      Solicitado por {item.requestedBy}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {item.currentVenda > 0 && (
                        <>
                          <span style={{ fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                            R$ {item.currentVenda.toFixed(2)}
                          </span>
                          <ArrowRight size={16} style={{ color: '#9CA3AF' }} />
                        </>
                      )}
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#001022' }}>
                        R$ {item.proposedVenda.toFixed(2)}
                      </span>
                      {!item.isNewService && item.variation !== 0 && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: item.variation > 0 ? '#D1FAE5' : '#FEE2E2',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: item.variation > 0 ? '#065F46' : '#991B1B',
                          }}
                        >
                          {item.variation > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                      <span>Repasse: R$ {item.proposedRepasse.toFixed(2)}</span>
                      <span>Margem: {item.proposedMargem.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* REJECTED/APPROVED Info */}
                {(isRejected || isApproved) && (
                  <div>
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isRejected ? '#DA291C' : '#16A34A',
                        marginBottom: '8px',
                      }}
                    >
                      {isRejected ? 'Rejeitado' : 'Aprovado'} por {item.reviewedBy || 'você'}
                    </p>
                    {item.comments && (
                      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                        Motivo: {item.comments}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#001022' }}>
                      <span>Repasse: <span style={{ fontWeight: 700 }}>R$ {item.proposedRepasse.toFixed(2)}</span></span>
                      <span>Venda: <span style={{ fontWeight: 700 }}>R$ {item.proposedVenda.toFixed(2)}</span></span>
                      <span>Margem: <span style={{ fontWeight: 700 }}>{item.proposedMargem.toFixed(1)}%</span></span>
                    </div>
                  </div>
                )}

                {/* ACTIONS - Pending */}
                {!isRejected && !isApproved && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={() => handleApprove(item.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#78BE20',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Check size={16} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectWithNewPrice(item.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1.5px solid #DA291C',
                        backgroundColor: '#FFFFFF',
                        color: '#DA291C',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <X size={16} />
                      Rejeitar e Sugerir Preço
                    </button>
                  </div>
                )}

                {/* REJECTED - Define New Price */}
                {isRejected && !isEditing && (
                  <button
                    onClick={() => handleDefineNewPrice(item.id)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#78BE20',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      alignSelf: 'start',
                    }}
                  >
                    Definir Novo Preço
                  </button>
                )}
              </div>

              {/* Inline New Price Form (shown on reject) */}
              {showComment && !isRejected && !isApproved && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                    Sugira um novo preço:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto auto', gap: '16px', alignItems: 'end' }}>
                    <CurrencyInput
                      label="Repasse (R$)"
                      value={editRepasseValue}
                      onValueChange={setEditRepasseValue}
                      placeholder="0,00"
                    />
                    <div style={{ paddingBottom: '8px' }}>
                      {(() => {
                        const venda = parseFloat(editVendaValue.replace(',', '.'));
                        const repasse = parseFloat(editRepasseValue.replace(',', '.'));
                        const margin = ((venda - repasse) / venda) * 100;
                        if (isNaN(margin)) return null;
                        const getMarginStyle = (m: number) => {
                          if (m > 30) return { bg: '#D1FAE5', text: '#065F46' };
                          if (m >= 15) return { bg: '#FEF3C7', text: '#92400E' };
                          return { bg: '#FEE2E2', text: '#991B1B' };
                        };
                        const s = getMarginStyle(margin);
                        return (
                          <div style={{ padding: '8px 14px', borderRadius: '100px', backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: s.text }}>
                              {margin.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <CurrencyInput
                      label="Venda (R$)"
                      value={editVendaValue}
                      onValueChange={setEditVendaValue}
                      placeholder="0,00"
                    />
                    <button
                      onClick={() => handleConfirmRejection(item.id)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#DA291C',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginBottom: '8px',
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => { setExpandedComment(null); setEditingPrice(null); }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FFFFFF',
                        color: '#6B7280',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginBottom: '8px',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Price Edit Form */}
              {isEditing && isRejected && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '16px', alignItems: 'end' }}>
                    <CurrencyInput
                      label="Repasse (R$)"
                      value={editRepasseValue}
                      onValueChange={setEditRepasseValue}
                      placeholder="0,00"
                    />
                    <div style={{ paddingBottom: '8px' }}>
                      {(() => {
                        const venda = parseFloat(editVendaValue.replace(',', '.'));
                        const repasse = parseFloat(editRepasseValue.replace(',', '.'));
                        const margin = ((venda - repasse) / venda) * 100;
                        if (isNaN(margin)) return null;
                        const getMarginStyle = (m: number) => {
                          if (m > 30) return { bg: '#D1FAE5', text: '#065F46' };
                          if (m >= 15) return { bg: '#FEF3C7', text: '#92400E' };
                          return { bg: '#FEE2E2', text: '#991B1B' };
                        };
                        const s = getMarginStyle(margin);
                        return (
                          <div style={{ padding: '8px 14px', borderRadius: '100px', backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: s.text }}>
                              {margin.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <CurrencyInput
                      label="Venda (R$)"
                      value={editVendaValue}
                      onValueChange={setEditVendaValue}
                      placeholder="0,00"
                    />
                    <button
                      onClick={() => handleSaveNewPrice(item.id)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#78BE20',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginBottom: '8px',
                      }}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty States */}
      {filteredItems.length === 0 && (
        <div
          style={{
            padding: '60px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: activeTab === 'pending' ? '#F0FDF4' : activeTab === 'rejected' ? '#FEF2F2' : '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeTab === 'pending' && <CheckCircle size={32} style={{ color: '#78BE20' }} />}
            {activeTab === 'approved' && <CheckCircle size={32} style={{ color: '#78BE20' }} />}
            {activeTab === 'rejected' && <XCircle size={32} style={{ color: '#DA291C' }} />}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>
            {activeTab === 'pending' ? 'Nenhuma aprovação pendente' : activeTab === 'approved' ? 'Nenhuma aprovação ainda' : 'Nenhuma rejeição'}
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {activeTab === 'pending'
              ? 'Todas as alterações de preço foram revisadas'
              : activeTab === 'approved'
              ? 'Aprove preços na aba Pendentes'
              : 'Nenhum preço foi rejeitado ainda'}
          </p>
        </div>
      )}
      </>
      )}
    </AppLayout>
  );
}
