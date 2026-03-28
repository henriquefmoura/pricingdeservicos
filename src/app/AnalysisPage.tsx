import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Card, HighlightedCard, KPICard } from './components/Card';
import { DataTable, Column } from './components/DataTable';
import { Map, TrendingUp, CheckCircle, AlertTriangle, ChevronRight, ArrowRight, Calculator, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import { usePricingStore } from './store/pricingStore';
import { useCorrelationStore } from './store/correlationStore';
import { useAuthStore } from './store/authStore';
import { PricingAnalyzer } from './utils/pricingAnalyzer';
import { AnalysisPanel } from './components/analysis/AnalysisPanel';
import { usePricingAnalysis } from './hooks/usePricingAnalysis';

// Mock services for analysis
const MOCK_SERVICES = [
  { id: 'srv-001', name: 'Instalação de Piso' },
  { id: 'srv-002', name: 'Pintura Residencial' },
  { id: 'srv-003', name: 'Impermeabilização' },
  { id: 'srv-004', name: 'Instalação Elétrica' },
  { id: 'srv-005', name: 'Instalação Hidráulica' },
];

const MOCK_PLAZAS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba',
  'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza', 'Brasília',
];

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const data = usePricingStore((state) => state.data);
  const { setParameterPlazas } = useCorrelationStore();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  // Pricing Analysis state
  const [selectedService, setSelectedService] = useState(MOCK_SERVICES[0]);
  const [selectedPlaza, setSelectedPlaza] = useState(MOCK_PLAZAS[0]);
  const [currentPriceInput, setCurrentPriceInput] = useState(150);

  const analysis = usePricingAnalysis({
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    pracaId: selectedPlaza,
    pracaName: selectedPlaza,
    currentPrice: currentPriceInput,
    enabled: true,
  });

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Create analyzer from real data
  const analyzer = useMemo(() => {
    if (!data) return null;
    return new PricingAnalyzer(data);
  }, [data]);

  const plazaStats = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getPlazaStats();
  }, [analyzer]);

  const parameterPlazas = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.findTop3ParameterPlazas();
  }, [analyzer]);

  // Save parameter plazas to store
  useEffect(() => {
    if (parameterPlazas.length > 0) {
      setParameterPlazas(parameterPlazas);
    }
  }, [parameterPlazas, setParameterPlazas]);

  const topCorrelations = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getAllCorrelations().slice(0, 15);
  }, [analyzer]);

  const saoPauloComparison = useMemo(() => {
    if (!analyzer) return [];
    const allCorrelations = analyzer.getAllCorrelations();
    const spComparisons = allCorrelations.filter(
      (corr) => corr.plaza1 === 'SP' || corr.plaza2 === 'SP'
    );

    return spComparisons
      .map((corr) => {
        const otherPlaza = corr.plaza1 === 'SP' ? corr.plaza2 : corr.plaza1;
        const isPlaza1SP = corr.plaza1 === 'SP';
        return {
          name: otherPlaza,
          variacaoVenda: isPlaza1SP ? -corr.avgVariationVenda : corr.avgVariationVenda,
          variacaoRepasse: isPlaza1SP ? -corr.avgVariationRepasse : corr.avgVariationRepasse,
          score: corr.correlationScore,
        };
      })
      .sort((a, b) => Math.abs(a.variacaoVenda) - Math.abs(b.variacaoVenda));
  }, [analyzer]);

  // If no data uploaded, show fallback with mock data for the charts
  const hasRealData = !!data;

  // Mock comparison data for when there's no uploaded data
  const mockComparisonData = [
    { plaza: 'Rio de Janeiro', variation: 12.5 },
    { plaza: 'Belo Horizonte', variation: 8.3 },
    { plaza: 'Curitiba', variation: 6.7 },
    { plaza: 'Porto Alegre', variation: 5.2 },
    { plaza: 'Brasília', variation: 3.8 },
    { plaza: 'Salvador', variation: -2.1 },
    { plaza: 'Recife', variation: -4.5 },
    { plaza: 'Fortaleza', variation: -6.8 },
    { plaza: 'Manaus', variation: -9.2 },
    { plaza: 'Belém', variation: -11.5 },
  ];

  const mockParameterPlazas = [
    {
      name: 'São Paulo',
      score: 94.2,
      pearsonR: 0.87,
      dependents: ['Campinas', 'Santos', 'Sorocaba', 'São José', 'Ribeirão', 'Jundiaí', 'Santo André', 'São Bernardo'],
    },
    {
      name: 'Rio de Janeiro',
      score: 91.8,
      pearsonR: 0.84,
      dependents: ['Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'Petrópolis', 'Cabo Frio'],
    },
    {
      name: 'Belo Horizonte',
      score: 89.5,
      pearsonR: 0.81,
      dependents: ['Contagem', 'Betim', 'Uberlândia', 'Juiz de Fora'],
    },
  ];

  const mockCorrelationData = [
    { id: '1', plaza1: 'São Paulo', plaza2: 'Rio de Janeiro', pearsonR: 0.94, varVenda: 2.3, varRepasse: 1.8, outliers: 2 },
    { id: '2', plaza1: 'São Paulo', plaza2: 'Belo Horizonte', pearsonR: 0.91, varVenda: 3.1, varRepasse: 2.5, outliers: 3 },
    { id: '3', plaza1: 'São Paulo', plaza2: 'Curitiba', pearsonR: 0.89, varVenda: 4.2, varRepasse: 3.2, outliers: 1 },
    { id: '4', plaza1: 'Rio de Janeiro', plaza2: 'Belo Horizonte', pearsonR: 0.87, varVenda: 2.8, varRepasse: 2.1, outliers: 2 },
    { id: '5', plaza1: 'Curitiba', plaza2: 'Porto Alegre', pearsonR: 0.85, varVenda: 3.5, varRepasse: 2.9, outliers: 4 },
    { id: '6', plaza1: 'São Paulo', plaza2: 'Brasília', pearsonR: 0.83, varVenda: 5.1, varRepasse: 4.2, outliers: 5 },
    { id: '7', plaza1: 'Salvador', plaza2: 'Recife', pearsonR: 0.82, varVenda: 4.8, varRepasse: 3.8, outliers: 3 },
    { id: '8', plaza1: 'Fortaleza', plaza2: 'Natal', pearsonR: 0.80, varVenda: 5.5, varRepasse: 4.5, outliers: 6 },
    { id: '9', plaza1: 'Porto Alegre', plaza2: 'Florianópolis', pearsonR: 0.79, varVenda: 6.2, varRepasse: 5.1, outliers: 4 },
    { id: '10', plaza1: 'Manaus', plaza2: 'Belém', pearsonR: 0.77, varVenda: 7.1, varRepasse: 5.8, outliers: 7 },
  ];

  // Use real data if available, otherwise mock
  const chartData = hasRealData
    ? saoPauloComparison.map((item) => ({ plaza: item.name, variation: item.variacaoVenda }))
    : mockComparisonData;

  const displayParamPlazas = hasRealData
    ? parameterPlazas.map((p) => ({
        name: p.name,
        score: Math.round(p.score), // Arredondar o score para exibição
        pearsonR: 0,
        dependents: p.dependentPlazas.map((d) => d.name),
      }))
    : mockParameterPlazas;

  interface CorrelationRow {
    id: string;
    plaza1: string;
    plaza2: string;
    pearsonR: number;
    varVenda: number;
    varRepasse: number;
    outliers: number;
  }

  const displayCorrelations: CorrelationRow[] = hasRealData
    ? topCorrelations.map((c, i) => ({
        id: String(i),
        plaza1: c.plaza1,
        plaza2: c.plaza2,
        pearsonR: c.pearsonR, // Usar o valor real de Pearson, não correlationScore/100
        varVenda: c.avgVariationVenda,
        varRepasse: c.avgVariationRepasse,
        outliers: c.outliers, // Usar os outliers reais calculados
      }))
    : mockCorrelationData;

  // PearsonRing component
  function PearsonRing({ value }: { value: number }) {
    const percentage = value * 100;
    const color = value >= 0.85 ? '#78BE20' : value >= 0.75 ? '#F59E0B' : '#DA291C';
    const circumference = 2 * Math.PI * 8;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '24px', height: '24px', display: 'inline-flex' }}>
        <svg width="24" height="24" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: Column<CorrelationRow>[] = [
    { key: 'plaza1', label: 'Praça 1', align: 'left' },
    { key: 'plaza2', label: 'Praça 2', align: 'left' },
    {
      key: 'pearsonR',
      label: 'Pearson r',
      align: 'center',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <PearsonRing value={value} />
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'varVenda',
      label: 'Var. Venda',
      align: 'right',
      render: (value) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(1)}%</span>,
    },
    {
      key: 'varRepasse',
      label: 'Var. Repasse',
      align: 'right',
      render: (value) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(1)}%</span>,
    },
    {
      key: 'outliers',
      label: 'Outliers',
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 600, color: value > 5 ? '#DA291C' : '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <AppLayout activeNav="Análise" title="Análise de Correlação" subtitle={hasRealData ? `${plazaStats.length} praças • ${data!.length} serviços` : 'Correlações entre praças e identificação de parâmetros'}>
      {/* Actions */}
      {hasRealData && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/metrics')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#001022',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileSpreadsheet size={16} />
            Métricas Detalhadas
          </button>
          <button
            onClick={() => navigate('/simulator')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#78BE20',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calculator size={16} />
            Simulador de Preços
          </button>
        </div>
      )}

      {/* Data upload notice */}
      {!hasRealData && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>Dados de demonstração</p>
            <p style={{ fontSize: '13px', color: '#92400E' }}>
              {user?.role === 'master'
                ? 'Faça upload de um arquivo Excel na página Upload para ver análises reais. '
                : 'Exibindo dados de demonstração. Solicite ao usuário Master o upload de dados para análises reais.'
              }
              {user?.role === 'master' && (
                <button
                  onClick={() => navigate('/home')}
                  style={{ background: 'none', border: 'none', color: '#78BE20', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Ir para Upload
                </button>
              )}
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1440px' }}>
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <KPICard label="Total de Praças" value={hasRealData ? String(plazaStats.length) : '27'} icon={<Map size={20} />} iconBgColor="green" />
          <KPICard label="Maior Score" value={hasRealData && parameterPlazas[0] ? parameterPlazas[0].score.toFixed(1) : '94.2'} icon={<TrendingUp size={20} />} iconBgColor="green" />
          <KPICard label="Correlações" value={hasRealData ? String(topCorrelations.length) : '10'} icon={<CheckCircle size={20} />} iconBgColor="green" />
          <KPICard label="Praças Parâmetro" value={hasRealData ? String(parameterPlazas.length) : '3'} icon={<AlertTriangle size={20} />} iconBgColor="amber" />
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '24px', marginBottom: '32px' }}>
          {/* LEFT - Bar Chart */}
          <Card>
            <h2 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '24px' }}>
              Comparação com São Paulo
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F0" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis dataKey="plaza" type="category" stroke="#6B7280" tick={{ fontSize: 12 }} width={90} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#FFF', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{d.plaza || d.name}</p>
                          <p style={{ fontSize: '13px', color: '#6B7280' }}>
                            Variação: {(d.variation || d.variacaoVenda || 0).toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="variation" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(entry.variation || 0) >= 0 ? '#78BE20' : '#DA291C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* RIGHT - Parameter Plazas */}
          <HighlightedCard>
            <h2 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '20px' }}>
              Praças Parâmetro
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayParamPlazas.map((plaza) => (
                <div
                  key={plaza.name}
                  onClick={() => setSelectedParameter(selectedParameter === plaza.name ? null : plaza.name)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #D1FAE5',
                    cursor: 'pointer',
                  }}
                >
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#001022', marginBottom: '8px' }}>
                    {plaza.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ padding: '4px 12px', borderRadius: '100px', backgroundColor: '#78BE20', fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                      Score {plaza.score}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Dependentes ({plaza.dependents.length}):
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {plaza.dependents.map((dep) => (
                      <div
                        key={dep}
                        style={{ padding: '2px 8px', borderRadius: '100px', backgroundColor: '#F3F4F6', fontSize: '11px', color: '#4B5563' }}
                      >
                        {dep}
                      </div>
                    ))}
                  </div>
                  {hasRealData && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const pp = parameterPlazas.find((p) => p.name === plaza.name);
                        if (pp && pp.dependentPlazas[0]) {
                          navigate(`/comparison/${plaza.name}/${pp.dependentPlazas[0].name}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: '#78BE20',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Ver correlações
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </HighlightedCard>
        </div>

        {/* Full Width - Correlations Table */}
        <Card>
          <h2 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '20px' }}>
            Melhores Correlações
          </h2>
          <DataTable
            columns={columns}
            data={displayCorrelations.slice(0, pageSize)}
            keyExtractor={(row) => row.id}
            pagination={{
              currentPage,
              totalPages: Math.ceil(displayCorrelations.length / pageSize),
              pageSize,
              onPageChange: setCurrentPage,
              onPageSizeChange: setPageSize,
            }}
          />
          {hasRealData && (
            <button
              onClick={() => navigate('/metrics')}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#001022',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ver todas as correlações
            </button>
          )}
        </Card>

        {/* ============================================== */}
        {/* Inteligência de Mercado para Pricing           */}
        {/* ============================================== */}
        <div style={{ marginTop: '32px' }}>
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
                  value={selectedService.id}
                  onChange={(e) => {
                    const svc = MOCK_SERVICES.find((s) => s.id === e.target.value);
                    if (svc) setSelectedService(svc);
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
                  {MOCK_SERVICES.map((s) => (
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
                  value={selectedPlaza}
                  onChange={(e) => setSelectedPlaza(e.target.value)}
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
                  {MOCK_PLAZAS.map((p) => (
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
                  value={currentPriceInput}
                  onChange={(e) => setCurrentPriceInput(Number(e.target.value) || 0)}
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
          />
        </div>
      </div>
    </AppLayout>
  );
}