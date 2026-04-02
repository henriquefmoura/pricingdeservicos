import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AISuggestionCard, Card } from './components/Card';
import { CurrencyInput, Input } from './components/Input';
import { ServiceTypeBadge, ServiceType } from './components/ServiceTypeBadge';
import { StatusBadge, BadgeStatus } from './components/StatusBadge';
import { Search, Sparkles, Send, Save, Lightbulb, TrendingUp, CheckCircle2, AlertCircle, BarChart2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { usePricingCodesStore, PricingCode } from './store/pricingCodesStore';
import { useMarketResearchStore } from './store/marketResearchStore';
import { useApprovalStore } from './store/approvalStore';
import { useCorrelationStore } from './store/correlationStore';
import { useReplicationConfigStore } from './store/replicationConfigStore';
import { MarketResearchForm } from './components/MarketResearchForm';
import { SharedAnalysisPanel } from './components/shared/SharedAnalysisPanel';
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

  const [activeTab, setActiveTab] = useState<'pricing' | 'market' | 'analysis'>('pricing');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceInputs, setPriceInputs] = useState<Record<string, PriceInput>>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);

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
        code.codigoAvulso.includes(searchTerm)
    );
  }, [relevantCodes, searchTerm]);

  const completedByMe = codes.filter(
    (code) => user?.plaza && code.prices?.[user.plaza]
  ).length;

  const targetPlazas = useMemo(() => {
    if (!user?.plaza) return [];
    if (isPlazaReplicator(user.plaza)) return getTargetPlazasForReplicator(user.plaza);
    return getSimilarPlazas(user.plaza);
  }, [user?.plaza, isPlazaReplicator, getTargetPlazasForReplicator, getSimilarPlazas]);

  const getServiceTypeStyles = (tipo: string) => {
    switch (tipo) {
      case 'Serviço': return { bg: '#D1FAE5', color: '#065F46' };
      case 'Visita Técnica': return { bg: '#FEF3C7', color: '#92400E' };
      case 'Complementar': return { bg: '#DBEAFE', color: '#1E40AF' };
      default: return { bg: '#F3E8FF', color: '#6B21A8' };
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
          codigo: code.codigoAvulso,
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
    <AppLayout activeNav="Admin" title="Precificação" subtitle={`Defina preços de repasse e venda para praça ${user?.plaza || ''}`}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('pricing')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'pricing' ? '#78BE20' : '#FFFFFF',
            color: activeTab === 'pricing' ? '#FFFFFF' : '#001022',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab !== 'pricing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Precificação ({filteredCodes.length} pendentes)
        </button>
        <button
          onClick={() => setActiveTab('market')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'market' ? '#78BE20' : '#FFFFFF',
            color: activeTab === 'market' ? '#FFFFFF' : '#001022',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab !== 'market' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Pesquisa de Mercado
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'analysis' ? '#78BE20' : '#FFFFFF',
            color: activeTab === 'analysis' ? '#FFFFFF' : '#001022',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab !== 'analysis' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <BarChart2 size={16} />
          Análise de Mercado
        </button>
      </div>

      {activeTab === 'market' && <MarketResearchForm />}

      {activeTab === 'analysis' && (
        <SharedAnalysisPanel userPlaza={user?.plaza} userRole="admin" />
      )}

      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Top bar: Stats + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>{filteredCodes.length}</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Pendentes</p>
              </div>
              <div style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#78BE20', lineHeight: 1 }}>{completedByMe}</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Precificados</p>
              </div>
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

            {/* Service cards — always expanded */}
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
              filteredCodes.map((code) => {
                const margem = calculateMargem(code.id);
                const research = getResearchByCode(code.codigoAvulso);
                const prestadorPrices = code.prices ? Object.values(code.prices).map((p) => p.venda) : [];
                const suggestedPrice = getSuggestedPrice(code.codigoAvulso, prestadorPrices);
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
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '3px 7px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                              {code.codigoAvulso}
                            </span>
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

                      {/* RIGHT: pricing inputs + alerts + replication */}
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

                        {/* Replication preview */}
                        {targetPlazas.length > 0 && (
                          <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                              Este preço será replicado para aprovação em:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                              {targetPlazas.map((plaza) => (
                                <div key={plaza} style={{ padding: '4px 10px', borderRadius: '5px', backgroundColor: '#78BE20', fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                                  {plaza}
                                </div>
                              ))}
                            </div>
                            <p style={{ fontSize: '11px', color: '#6B7280' }}>
                              Via {isPlazaReplicator(user?.plaza || '') ? 'configuração do Master' : 'análise de correlação'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      )}
    </AppLayout>
  );
}
