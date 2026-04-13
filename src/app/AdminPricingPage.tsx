import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AISuggestionCard, Card } from './components/Card';
import { CurrencyInput, Input } from './components/Input';
import { ServiceTypeBadge, ServiceType } from './components/ServiceTypeBadge';
import { StatusBadge, BadgeStatus } from './components/StatusBadge';
import { Search, Sparkles, Send, Save, Lightbulb, TrendingUp, CheckCircle2, AlertCircle, AlertTriangle, BarChart2, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { usePricingCodesStore, PricingCode, UNGROUPED_KEY } from './store/pricingCodesStore';
import { useMarketResearchStore } from './store/marketResearchStore';
import { useApprovalStore } from './store/approvalStore';
import { useCorrelationStore } from './store/correlationStore';
import { useReplicationConfigStore } from './store/replicationConfigStore';
import { toast } from 'sonner';

interface PriceInput {
  repasse: string;
  venda: string;
}

export default function AdminPricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { codes, updateCodePrice, initializeMockCodes } = usePricingCodesStore();
  const { getResearchByCode, getSuggestedPrice, initializeMockResearches } = useMarketResearchStore();
  const { addApproval } = useApprovalStore();
  const { getSimilarPlazas, initializeMockData: initCorrelation } = useCorrelationStore();
  const { getTargetPlazasForReplicator, isPlazaReplicator } = useReplicationConfigStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [priceInputs, setPriceInputs] = useState<Record<string, PriceInput>>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pendentes' | 'precificados'>('pendentes');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role === 'user') {
      navigate('/dashboard');
    } else if (user.role === 'master') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize mock data
  useEffect(() => {
    initializeMockCodes();
    initCorrelation();
    initializeMockResearches();
  }, [initializeMockCodes, initCorrelation, initializeMockResearches]);

  // Filter codes relevant to admin's plaza
  const relevantCodes = useMemo(() => {
    return codes.filter((code) => {
      if (user?.plaza && code.prices?.[user.plaza]) return false;
      return code.status === 'pendente' || code.status === 'em_andamento';
    });
  }, [codes, user?.plaza]);

  const filteredCodes = useMemo(() => {
    if (!searchTerm) return relevantCodes;
    return relevantCodes.filter(
      (code) =>
        code.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.codigoAvulso || '').includes(searchTerm) ||
        (code.codigoAtrelado || '').includes(searchTerm)
    );
  }, [relevantCodes, searchTerm]);

  const pricedCodes = useMemo(() => {
    return codes.filter((code) => user?.plaza && !!code.prices?.[user.plaza]);
  }, [codes, user?.plaza]);

  const filteredPricedCodes = useMemo(() => {
    if (!searchTerm) return pricedCodes;
    return pricedCodes.filter(
      (code) =>
        code.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.codigoAvulso || '').includes(searchTerm) ||
        (code.codigoAtrelado || '').includes(searchTerm)
    );
  }, [pricedCodes, searchTerm]);

  const completedByMe = pricedCodes.length;

  const handleReportPricingError = (code: PricingCode) => {
    if (!user || !user.plaza) {
      toast.error('Não foi possível abrir o chamado. Verifique sua autenticação.');
      return;
    }
    const price = code.prices?.[user.plaza];
    const margem = price ? ((price.venda - price.repasse) / price.venda) * 100 : 0;
    const codeLabel = code.codigoAvulso || code.codigoAtrelado || '-';
    const subject = `Erro no preenchimento — ${codeLabel} · ${code.descricao}`;
    const messageBody = [
      `Solicito revisão do serviço precificado:`,
      code.codigoAvulso ? `• Cód. Avulso: ${code.codigoAvulso}` : '',
      code.codigoAtrelado ? `• Cód. Atrelado: ${code.codigoAtrelado}` : '',
      `• Serviço: ${code.descricao}`,
      `• Tipo: ${code.tipo}`,
      `• Unidade: ${code.unidade}`,
      price ? `• Repasse: R$ ${price.repasse.toFixed(2)}` : '',
      price ? `• Venda: R$ ${price.venda.toFixed(2)}` : '',
      price ? `• Margem: ${margem.toFixed(2)}%` : '',
      `• Praça: ${user.plaza}`,
      '',
      `Motivo: `,
    ].filter(Boolean).join('\n');

    // Navigate to support page with pre-filled data; confirmation popup will be shown there
    navigate('/admin-support', {
      state: {
        pendingTicket: {
          subject,
          message: messageBody,
        },
      },
    });
  };

  const getServiceTypeStyles = (tipo: string) => {
    switch (tipo) {
      case 'Serviço': return { bg: '#D1FAE5', color: '#065F46' };
      case 'Visita Técnica': return { bg: '#FEF3C7', color: '#92400E' };
      case 'Inst + Pague -': return { bg: '#FEF3C7', color: '#92400E' };
      case 'Emergencial': return { bg: '#FEE2E2', color: '#991B1B' };
      case 'Complementar': return { bg: '#F3F4F6', color: '#374151' };
      case 'Deslocamento': return { bg: '#F3F4F6', color: '#374151' };
      default: return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  const handlePriceChange = (codeId: string, field: 'repasse' | 'venda', value: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [codeId]: {
        ...prev[codeId],
        [field]: value,
      },
    }));
  };

  const calculateMargem = (codeId: string) => {
    const input = priceInputs[codeId];
    if (!input || !input.repasse || !input.venda) return null;
    const repasse = parseFloat(input.repasse);
    const venda = parseFloat(input.venda);
    if (isNaN(repasse) || isNaN(venda) || venda === 0) return null;
    return ((venda - repasse) / venda) * 100;
  };

  // Group codes by grupoServico
  const groupCodes = (codesToGroup: PricingCode[]) => {
    const grouped = codesToGroup.reduce<Record<string, PricingCode[]>>((acc, code) => {
      const group = code.grupoServico || UNGROUPED_KEY;
      if (!acc[group]) acc[group] = [];
      acc[group].push(code);
      return acc;
    }, {});

    const groupNames = Object.keys(grouped).sort((a, b) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return a.localeCompare(b);
    });

    const hasGroups = groupNames.some((g) => g !== UNGROUPED_KEY);

    return { grouped, groupNames, hasGroups };
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleSavePrice = (code: PricingCode) => {
    if (!user?.plaza) {
      toast.error('Erro: Praça do usuário não identificada');
      return;
    }

    const input = priceInputs[code.id];
    if (!input || !input.repasse || !input.venda) {
      toast.error('Por favor, preencha todos os campos de preço');
      return;
    }

    const repasse = parseFloat(input.repasse);
    const venda = parseFloat(input.venda);

    if (isNaN(repasse) || isNaN(venda)) {
      toast.error('Por favor, insira valores numéricos válidos');
      return;
    }

    if (repasse >= venda) {
      toast.error('O valor de venda deve ser maior que o repasse');
      return;
    }

    const margem = ((venda - repasse) / venda) * 100;

    // Save directly to admin's plaza
    updateCodePrice(code.id, user.plaza, repasse, venda, user.name);

    // Replication logic
    let targetPlazas: string[] = [];

    if (isPlazaReplicator(user.plaza)) {
      targetPlazas = getTargetPlazasForReplicator(user.plaza);
    } else {
      targetPlazas = getSimilarPlazas(user.plaza);
    }

    if (targetPlazas.length > 0) {
      targetPlazas.forEach((plaza) => {
        const currentPrice = code.prices?.[plaza];
        const currentVenda = currentPrice?.venda || 0;
        const currentRepasse = currentPrice?.repasse || 0;
        const currentMargem = currentPrice ? ((currentPrice.venda - currentPrice.repasse) / currentPrice.venda) * 100 : 0;
        const variation = currentVenda === 0 ? 0 : ((venda - currentVenda) / currentVenda) * 100;

        addApproval({
          codigo: code.codigoAvulso || code.codigoAtrelado || '-',
          descricao: code.descricao,
          grupo: code.tipo,
          plaza: plaza,
          currentRepasse: currentRepasse,
          currentVenda: currentVenda,
          currentMargem: currentMargem,
          proposedRepasse: repasse,
          proposedVenda: venda,
          proposedMargem: margem,
          variation: variation,
          isNewService: currentVenda === 0,
          requestedBy: `Admin ${user.plaza}`,
        });
      });

      const replicationSource = isPlazaReplicator(user.plaza) ? 'configuração do Master' : 'análise de correlação';
      toast.success(`Preço aplicado e replicado!`, {
        description: `Preço de ${code.descricao} aplicado em ${user.plaza} e enviado para aprovação em ${targetPlazas.length} praça(s) via ${replicationSource}: ${targetPlazas.join(', ')}`,
      });
    } else {
      toast.success(`Preço aplicado!`, {
        description: `Preço de ${code.descricao} aplicado em ${user.plaza}`,
      });
    }

    setPriceInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[code.id];
      return newInputs;
    });
    setEditingCode(null);
  };

  if (!isAuthenticated || !user || user.role === 'master' || user.role === 'user') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="Admin" title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Page header banner */}
            <div
              className="rounded-xl p-6 text-white shadow-lg"
              style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Precificação
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    {`Defina preços de repasse e venda para praça ${user?.plaza || ''}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Top bar: Stats + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveView('pendentes')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: activeView === 'pendentes' ? '0 0 0 2px #F59E0B' : '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.1s',
                }}
              >
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#F59E0B', lineHeight: 1, margin: 0 }}>{relevantCodes.length}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Pendentes</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('precificados')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: activeView === 'precificados' ? '0 0 0 2px #78BE20' : '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.1s',
                }}
              >
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#78BE20', lineHeight: 1, margin: 0 }}>{completedByMe}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Precificados</p>
              </button>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
                />
                <Input
                  placeholder="Buscar código ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '36px', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Service cards — Pendentes view */}
            {activeView === 'pendentes' && (
              <>
                {filteredCodes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(120,190,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <TrendingUp size={36} style={{ color: '#78BE20' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>Nenhum código pendente</h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', maxWidth: '400px' }}>
                      Todos os códigos já foram precificados para a praça {user?.plaza}
                    </p>
                  </div>
                ) : (
                  (() => {
                    const { grouped, groupNames, hasGroups } = groupCodes(filteredCodes);

                    const renderPendingCard = (code: PricingCode) => {
                      const margem = calculateMargem(code.id);
                      const codeRef = code.codigoAvulso || code.codigoAtrelado || '';
                      const research = getResearchByCode(codeRef);
                      const prestadorPrices = code.prices ? Object.values(code.prices).map((p) => p.venda) : [];
                      const suggestedPrice = getSuggestedPrice(codeRef, prestadorPrices);
                      const tipoStyles = getServiceTypeStyles(code.tipo);

                      return (
                        <div
                          key={code.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '20px',
                          }}
                        >
                          {/* Horizontal layout: left info + right inputs */}
                          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                            {/* LEFT: service identity + AI suggestion + competitor prices */}
                            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Service name + badges */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: '5px', backgroundColor: tipoStyles.bg, fontSize: '11px', fontWeight: 600, color: tipoStyles.color }}>
                                    {code.tipo}
                                  </span>
                                  {code.codigoAtrelado && (
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                                      Atr: {code.codigoAtrelado}
                                    </span>
                                  )}
                                  {code.codigoAvulso && (
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                                      Avl: {code.codigoAvulso}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563', fontWeight: 600 }}>
                                    {code.unidade}
                                  </span>
                                  <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#FEF3C7', borderRadius: '5px', color: '#92400E', fontWeight: 600 }}>
                                    Prazo: {code.prazo}
                                  </span>
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#001022', margin: 0 }}>{code.descricao}</p>
                              </div>

                              {/* AI Suggestion */}
                              {suggestedPrice && (
                                <AISuggestionCard>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#CEDC00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Sparkles size={17} style={{ color: '#001022' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '2px' }}>Sugestão de IA</p>
                                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#001022', marginBottom: '8px' }}>R$ {suggestedPrice.toFixed(2)}</p>
                                      <button
                                        onClick={() => {
                                          setPriceInputs((prev) => ({ ...prev, [code.id]: { ...prev[code.id], venda: suggestedPrice.toFixed(2) } }));
                                          toast.success('Preço sugerido aplicado ao campo de venda');
                                        }}
                                        style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #CEDC00', backgroundColor: 'transparent', color: '#001022', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      >
                                        <Lightbulb size={12} />
                                        Usar sugestão
                                      </button>
                                    </div>
                                  </div>
                                </AISuggestionCard>
                              )}

                              {/* Competitor prices */}
                              {research && research.precosConcorrentes.length > 0 && (
                                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Preços de concorrentes</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {research.precosConcorrentes.map((comp) => (
                                      <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', color: '#6B7280' }}>{comp.concorrente}:</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#001022' }}>R$ {comp.preco.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* RIGHT: pricing inputs + alerts */}
                            <div style={{ flex: '2 1 340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                              {/* Inputs row */}
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '10px' }}>
                                <div style={{ flex: '1 1 120px' }}>
                                  <CurrencyInput
                                    label="Repasse (R$)"
                                    value={priceInputs[code.id]?.repasse || ''}
                                    onValueChange={(v) => handlePriceChange(code.id, 'repasse', v)}
                                    placeholder="0.00"
                                  />
                                </div>

                                {margem !== null && (
                                  <div style={{ paddingBottom: '8px', flexShrink: 0 }}>
                                    {(() => {
                                      const getMarginStyle = (m: number) => m > 30 ? { bg: '#D1FAE5', text: '#065F46' } : m >= 15 ? { bg: '#FEF3C7', text: '#92400E' } : { bg: '#FEE2E2', text: '#991B1B' };
                                      const s = getMarginStyle(margem);
                                      return (
                                        <div style={{ padding: '7px 12px', borderRadius: '100px', backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: s.text }}>Margem: {margem.toFixed(1)}%</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                <div style={{ flex: '1 1 120px' }}>
                                  <CurrencyInput
                                    label="Venda (R$)"
                                    value={priceInputs[code.id]?.venda || ''}
                                    onValueChange={(v) => handlePriceChange(code.id, 'venda', v)}
                                    placeholder="0.00"
                                  />
                                </div>

                                <button
                                  onClick={() => handleSavePrice(code)}
                                  disabled={!priceInputs[code.id]?.repasse || !priceInputs[code.id]?.venda}
                                  style={{
                                    padding: '11px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: priceInputs[code.id]?.repasse && priceInputs[code.id]?.venda ? '#78BE20' : '#D1D5DB',
                                    color: '#FFFFFF',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: priceInputs[code.id]?.repasse && priceInputs[code.id]?.venda ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    flexShrink: 0,
                                    marginBottom: '8px',
                                  }}
                                >
                                  <Save size={15} />
                                  Salvar
                                </button>
                              </div>

                              {/* Margin alert */}
                              {margem !== null && (
                                <div>
                                  {margem < 10 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                                      <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                                      <span style={{ fontSize: '12px', color: '#991B1B' }}>Atenção: Margem abaixo de 10%, pode não ser rentável.</span>
                                    </div>
                                  )}
                                  {margem >= 10 && margem < 15 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                      <AlertCircle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
                                      <span style={{ fontSize: '12px', color: '#92400E' }}>Margem entre 10-15%, dentro do aceitável mas pode ser otimizada.</span>
                                    </div>
                                  )}
                                  {margem >= 15 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#D1FAE5', border: '1px solid #86EFAC' }}>
                                      <CheckCircle2 size={15} style={{ color: '#16A34A', flexShrink: 0 }} />
                                      <span style={{ fontSize: '12px', color: '#065F46' }}>Excelente! Margem acima de 15%, dentro do ideal.</span>
                                    </div>
                                  )}
                                </div>
                              )}


                            </div>
                          </div>
                        </div>
                      );
                    };

                    if (!hasGroups) {
                      return filteredCodes.map((code) => renderPendingCard(code));
                    }

                    return groupNames.map((groupName) => {
                      const codesInGroup = grouped[groupName];
                      const isUngrouped = groupName === UNGROUPED_KEY;
                      const displayName = isUngrouped ? 'Sem Grupo' : groupName;
                      const isCollapsed = !expandedGroups[`pending-${groupName}`];

                      return (
                        <div key={groupName} style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #E5E7EB' }}>
                          <button
                            onClick={() => toggleGroup(`pending-${groupName}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '24px 28px',
                              backgroundColor: '#F9FAFB',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                            aria-label={`Grupo ${displayName}, ${codesInGroup.length} serviço(s)`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <FolderOpen size={28} style={{ color: '#4F46E5' }} />
                              <span style={{ fontWeight: 700, fontSize: '22px', color: '#111827' }}>{displayName}</span>
                              <span style={{
                                padding: '4px 14px',
                                borderRadius: '14px',
                                border: '1px solid #D1D5DB',
                                fontSize: '15px',
                                color: '#6B7280',
                                fontWeight: 500,
                              }}>
                                {codesInGroup.length} serviço(s)
                              </span>
                            </div>
                            <ChevronDown
                              size={24}
                              style={{
                                color: '#6B7280',
                                transition: 'transform 0.2s',
                                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                              }}
                            />
                          </button>
                          {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                              {codesInGroup.map((code) => renderPendingCard(code))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </>
            )}

            {/* Service cards — Precificados view */}
            {activeView === 'precificados' && (
              <>
                {filteredPricedCodes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(120,190,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <CheckCircle2 size={36} style={{ color: '#78BE20' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>Nenhum código precificado</h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', maxWidth: '400px' }}>
                      Nenhum código foi precificado para a praça {user?.plaza} ainda
                    </p>
                  </div>
                ) : (
                  (() => {
                    const { grouped, groupNames, hasGroups } = groupCodes(filteredPricedCodes);

                    const renderPricedCard = (code: PricingCode) => {
                      const priceData = user?.plaza ? code.prices?.[user.plaza] : null;
                      const tipoStyles = getServiceTypeStyles(code.tipo);
                      const margem = priceData ? ((priceData.venda - priceData.repasse) / priceData.venda) * 100 : 0;
                      const getMarginStyle = (m: number) => m > 30 ? { bg: '#D1FAE5', text: '#065F46' } : m >= 15 ? { bg: '#FEF3C7', text: '#92400E' } : { bg: '#FEE2E2', text: '#991B1B' };
                      const marginStyle = getMarginStyle(margem);

                      return (
                        <div
                          key={code.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '20px',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* LEFT: service identity */}
                            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: '5px', backgroundColor: tipoStyles.bg, fontSize: '11px', fontWeight: 600, color: tipoStyles.color }}>
                                    {code.tipo}
                                  </span>
                                  {code.codigoAtrelado && (
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                                      Atr: {code.codigoAtrelado}
                                    </span>
                                  )}
                                  {code.codigoAvulso && (
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                                      Avl: {code.codigoAvulso}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563', fontWeight: 600 }}>
                                    {code.unidade}
                                  </span>
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#001022', margin: 0 }}>{code.descricao}</p>
                              </div>
                            </div>

                            {/* RIGHT: saved price details */}
                            {priceData && (
                              <div style={{ flex: '2 1 340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '10px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Repasse</span>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#001022' }}>R$ {priceData.repasse.toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Venda</span>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#001022' }}>R$ {priceData.venda.toFixed(2)}</span>
                                  </div>
                                  <div style={{ padding: '7px 12px', borderRadius: '100px', backgroundColor: marginStyle.bg }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: marginStyle.text }}>Margem: {margem.toFixed(1)}%</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                                    <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                                    <span style={{ fontSize: '12px', color: '#065F46', fontWeight: 600 }}>Precificado</span>
                                  </div>
                                </div>
                                {priceData.preenchidoPor && (
                                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                                    Definido por: {priceData.preenchidoPor}
                                  </p>
                                )}
                                <button
                                  onClick={() => handleReportPricingError(code)}
                                  title="Reportar erro no preenchimento"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #FECACA',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    alignSelf: 'flex-start',
                                    marginTop: '4px',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                >
                                  <AlertTriangle size={14} />
                                  Suporte
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    };

                    if (!hasGroups) {
                      return filteredPricedCodes.map((code) => renderPricedCard(code));
                    }

                    return groupNames.map((groupName) => {
                      const codesInGroup = grouped[groupName];
                      const isUngrouped = groupName === UNGROUPED_KEY;
                      const displayName = isUngrouped ? 'Sem Grupo' : groupName;
                      const isCollapsed = !expandedGroups[`priced-${groupName}`];

                      return (
                        <div key={groupName} style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #D1FAE5' }}>
                          <button
                            onClick={() => toggleGroup(`priced-${groupName}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '24px 28px',
                              backgroundColor: '#F0FDF4',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DCFCE7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F0FDF4'; }}
                            aria-label={`Grupo ${displayName}, ${codesInGroup.length} serviço(s)`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <FolderOpen size={28} style={{ color: '#16A34A' }} />
                              <span style={{ fontWeight: 700, fontSize: '22px', color: '#111827' }}>{displayName}</span>
                              <span style={{
                                padding: '4px 14px',
                                borderRadius: '14px',
                                border: '1px solid #BBF7D0',
                                fontSize: '15px',
                                color: '#16A34A',
                                fontWeight: 500,
                              }}>
                                {codesInGroup.length} serviço(s)
                              </span>
                            </div>
                            <ChevronDown
                              size={24}
                              style={{
                                color: '#6B7280',
                                transition: 'transform 0.2s',
                                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                              }}
                            />
                          </button>
                          {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                              {codesInGroup.map((code) => renderPricedCard(code))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </>
            )}
          </div>
    </AppLayout>
  );
}
