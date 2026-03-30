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
import { AnalysisPanel } from './components/analysis/AnalysisPanel';
import { usePricingAnalysis } from './hooks/usePricingAnalysis';
import { ANALYSIS_SERVICES, ANALYSIS_PLAZAS, getDefaultAnalysisPlaza } from './utils/analysisConstants';
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

  // Analysis state
  const [analysisService, setAnalysisService] = useState(ANALYSIS_SERVICES[0]);
  const [analysisPlaza, setAnalysisPlaza] = useState(getDefaultAnalysisPlaza(user?.plaza));
  const [analysisPrice, setAnalysisPrice] = useState(150);

  const analysis = usePricingAnalysis({
    serviceId: analysisService.id,
    serviceName: analysisService.name,
    pracaId: analysisPlaza,
    pracaName: analysisPlaza,
    currentPrice: analysisPrice,
    enabled: activeTab === 'analysis',
  });

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
        <div style={{ maxWidth: '1440px' }}>
          <Card>
            <h2 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '20px' }}>
              Contexto de Mercado e Decisão
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Selecione um serviço, uma praça e ajuste o preço para receber análise inteligente e recomendações.
            </p>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Service selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Serviço
                </label>
                <select
                  value={analysisService.id}
                  onChange={(e) => {
                    const svc = ANALYSIS_SERVICES.find((s) => s.id === e.target.value);
                    if (svc) setAnalysisService(svc);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    color: '#001022',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {ANALYSIS_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Plaza selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Praça
                </label>
                <select
                  value={analysisPlaza}
                  onChange={(e) => setAnalysisPlaza(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    color: '#001022',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {ANALYSIS_PLAZAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Current price */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Preço Atual (R$)
                </label>
                <input
                  type="number"
                  value={analysisPrice}
                  onChange={(e) => setAnalysisPrice(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    color: '#001022',
                    backgroundColor: '#FFFFFF',
                  }}
                  min={0}
                  step={0.01}
                />
              </div>

              {/* Proposed price */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Preço Proposto (R$)
                </label>
                <input
                  type="number"
                  value={analysis.proposedPrice}
                  onChange={(e) => analysis.setProposedPrice(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #78BE20',
                    fontSize: '13px',
                    color: '#001022',
                    backgroundColor: '#F0FDF4',
                    fontWeight: 600,
                  }}
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
          </Card>

          {/* Analysis Panel */}
          <AnalysisPanel
            context={analysis.context}
            loading={analysis.loading}
            error={analysis.error}
            onRefresh={analysis.refresh}
            competitorContext={analysis.competitorContext}
            cnaeContext={analysis.cnaeContext}
          />
        </div>
      )}

      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* LEFT PANEL - Search + Stats */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#F59E0B' }}>{filteredCodes.length}</p>
                <p style={{ fontSize: '11px', color: '#6B7280' }}>Pendentes</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#78BE20' }}>{completedByMe}</p>
                <p style={{ fontSize: '11px', color: '#6B7280' }}>Precificados</p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
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

            {/* Code List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
              {filteredCodes.map((code) => {
                const isActive = editingCode === code.id;
                return (
                  <button
                    key={code.id}
                    onClick={() => setEditingCode(code.id)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      backgroundColor: isActive ? '#F0FDF4' : '#FFFFFF',
                      borderLeft: isActive ? '3px solid #78BE20' : '3px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: code.tipo === 'Serviço' ? '#D1FAE5' : code.tipo === 'Visita Técnica' ? '#FEF3C7' : code.tipo === 'Complementar' ? '#DBEAFE' : '#F3E8FF',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: code.tipo === 'Serviço' ? '#065F46' : code.tipo === 'Visita Técnica' ? '#92400E' : code.tipo === 'Complementar' ? '#1E40AF' : '#6B21A8',
                        }}
                      >
                        {code.tipo}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#001022', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {code.descricao}
                    </p>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6B7280' }}>{code.codigoAvulso}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL - Pricing Form */}
          <div style={{ flex: 1 }}>
            {editingCode ? (
              (() => {
                const code = filteredCodes.find((c) => c.id === editingCode);
                if (!code) return <p>Código não encontrado</p>;
                const margem = calculateMargem(code.id);
                const research = getResearchByCode(code.codigoAvulso);
                const prestadorPrices = code.prices
                  ? Object.values(code.prices).map((p) => p.venda)
                  : [];
                const suggestedPrice = getSuggestedPrice(code.codigoAvulso, prestadorPrices);

                // Get replication targets
                let targetPlazas: string[] = [];
                if (user?.plaza && isPlazaReplicator(user.plaza)) {
                  targetPlazas = getTargetPlazasForReplicator(user.plaza);
                } else if (user?.plaza) {
                  targetPlazas = getSimilarPlazas(user.plaza);
                }

                return (
                  <div style={{ maxWidth: '900px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: code.tipo === 'Serviço' ? '#D1FAE5' : code.tipo === 'Visita Técnica' ? '#FEF3C7' : code.tipo === 'Complementar' ? '#DBEAFE' : '#F3E8FF',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: code.tipo === 'Serviço' ? '#065F46' : code.tipo === 'Visita Técnica' ? '#92400E' : code.tipo === 'Complementar' ? '#1E40AF' : '#6B21A8',
                          }}
                        >
                          {code.tipo}
                        </span>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#001022' }}>
                          {code.descricao}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 8px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563' }}>
                          {code.codigoAvulso}
                        </span>
                        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#F3F4F6', borderRadius: '4px', color: '#4B5563', fontWeight: 600 }}>
                          {code.unidade}
                        </span>
                        <span style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#FEF3C7', borderRadius: '6px', color: '#92400E', fontWeight: 600 }}>
                          Prazo: {code.prazo}
                        </span>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    {suggestedPrice && (
                      <AISuggestionCard style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: '#CEDC00',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Sparkles size={24} style={{ color: '#001022' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>
                              Sugestão de IA
                            </h3>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#001022', marginBottom: '12px' }}>
                              R$ {suggestedPrice.toFixed(2)}
                            </p>
                            {research && research.precosConcorrentes.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {research.precosConcorrentes.map((comp) => (
                                  <span key={comp.id} style={{ fontSize: '12px', color: '#6B7280' }}>
                                    {comp.concorrente}: R$ {comp.preco.toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [code.id]: {
                                    ...prev[code.id],
                                    venda: suggestedPrice.toFixed(2),
                                  },
                                }));
                                toast.success('Preço sugerido aplicado ao campo de venda');
                              }}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid #CEDC00',
                                backgroundColor: 'transparent',
                                color: '#001022',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Lightbulb size={14} />
                              Usar Preço Sugerido
                            </button>
                          </div>
                        </div>
                      </AISuggestionCard>
                    )}

                    {/* Competitor Prices */}
                    {research && research.precosConcorrentes.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                          Preços de concorrentes:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {research.precosConcorrentes.map((comp) => (
                            <div
                              key={comp.id}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span style={{ fontSize: '13px', color: '#6B7280' }}>{comp.concorrente}:</span>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#001022' }}>
                                R$ {comp.preco.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing Inputs */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr auto',
                        gap: '16px',
                        alignItems: 'end',
                        marginBottom: '24px',
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <CurrencyInput
                        label="Repasse (R$)"
                        value={priceInputs[code.id]?.repasse || ''}
                        onValueChange={(v) => handlePriceChange(code.id, 'repasse', v)}
                        placeholder="0.00"
                      />

                      <div style={{ paddingBottom: '8px' }}>
                        {(() => {
                          if (margem === null) return null;
                          const getMarginStyle = (m: number) => {
                            if (m > 30) return { bg: '#D1FAE5', text: '#065F46' };
                            if (m >= 15) return { bg: '#FEF3C7', text: '#92400E' };
                            return { bg: '#FEE2E2', text: '#991B1B' };
                          };
                          const s = getMarginStyle(margem);
                          return (
                            <div style={{ padding: '8px 16px', borderRadius: '100px', backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: s.text }}>
                                Margem: {margem.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <CurrencyInput
                        label="Venda (R$)"
                        value={priceInputs[code.id]?.venda || ''}
                        onValueChange={(v) => handlePriceChange(code.id, 'venda', v)}
                        placeholder="0.00"
                      />

                      <button
                        onClick={() => handleSavePrice(code)}
                        disabled={!priceInputs[code.id]?.repasse || !priceInputs[code.id]?.venda}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: priceInputs[code.id]?.repasse && priceInputs[code.id]?.venda ? '#78BE20' : '#D1D5DB',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: priceInputs[code.id]?.repasse && priceInputs[code.id]?.venda ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <Save size={16} />
                        Salvar
                      </button>
                    </div>

                    {/* Margin Alerts */}
                    {margem !== null && (
                      <div style={{ marginBottom: '24px' }}>
                        {margem < 10 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                            <AlertCircle size={16} style={{ color: '#DC2626' }} />
                            <span style={{ fontSize: '13px', color: '#991B1B' }}>Atenção: Margem abaixo de 10%, pode não ser rentável.</span>
                          </div>
                        )}
                        {margem >= 10 && margem < 15 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                            <AlertCircle size={16} style={{ color: '#F59E0B' }} />
                            <span style={{ fontSize: '13px', color: '#92400E' }}>Margem entre 10-15%, dentro do aceitável mas pode ser otimizada.</span>
                          </div>
                        )}
                        {margem >= 15 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#D1FAE5', border: '1px solid #86EFAC' }}>
                            <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                            <span style={{ fontSize: '13px', color: '#065F46' }}>Excelente! Margem acima de 15%, dentro do ideal.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Replication Preview */}
                    {targetPlazas.length > 0 && (
                      <div
                        style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #D1FAE5',
                          marginBottom: '24px',
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                          Este preço será replicado para aprovação em:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          {targetPlazas.map((plaza) => (
                            <div
                              key={plaza}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#78BE20',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                              }}
                            >
                              {plaza}
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: '12px', color: '#6B7280' }}>
                          Via {isPlazaReplicator(user?.plaza || '') ? 'configuração do Master' : 'análise de correlação'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* No code selected - show overview */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(120, 190, 32, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <TrendingUp size={36} style={{ color: '#78BE20' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>
                  Selecione um código à esquerda
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', maxWidth: '400px' }}>
                  Escolha um código de serviço da lista para definir os preços de repasse e venda para a praça {user?.plaza}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
