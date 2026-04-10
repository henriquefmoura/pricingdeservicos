import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { AppLayout } from './components/AppLayout';
import { HighlightedCard, AISuggestionCard, Card } from './components/Card';
import { Toggle } from './components/Toggle';
import { FileSpreadsheet, BarChart2, MapPin, TrendingUp, AlertCircle, Shield, History, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { usePricingStore } from './store/pricingStore';
import { useAuthStore } from './store/authStore';
import { useReplicationConfigStore } from './store/replicationConfigStore';
import { useMarketResearchStore, PriceHistoryEntry } from './store/marketResearchStore';
import { GoogleSheetsConfig } from './components/GoogleSheetsConfig';
import { ReplicationConfig } from './components/ReplicationConfig';
import { ServiceData } from './types/pricing';
import { toast } from 'sonner';

export default function MasterHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const setData = usePricingStore((state) => state.setData);
  const { rules, toggleRuleActive } = useReplicationConfigStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { priceHistory, exportData } = useMarketResearchStore();

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  function getActionLabel(acao: PriceHistoryEntry['acao']): { label: string; color: string; bg: string } {
    switch (acao) {
      case 'added':
        return { label: 'Adicionado', color: '#15803D', bg: '#DCFCE7' };
      case 'updated':
        return { label: 'Atualizado', color: '#1D4ED8', bg: '#DBEAFE' };
      case 'removed':
        return { label: 'Removido', color: '#DC2626', bg: '#FEE2E2' };
    }
  }

  const handleExportData = () => {
    const data = exportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pesquisa-mercado-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso! Pronto para importar no Supabase.');
  };

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role === 'user') {
      navigate('/dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ServiceData[];

        if (jsonData.length === 0) {
          throw new Error('O arquivo Excel está vazio');
        }

        const firstRow = jsonData[0];
        if (!firstRow.codigo && !firstRow.grupo) {
          throw new Error('O arquivo deve conter as colunas "codigo" e "grupo"');
        }

        setData(jsonData);
        toast.success('Arquivo processado com sucesso!', {
          description: `${jsonData.length} serviços carregados. Redirecionando para análise...`,
        });
        navigate('/analysis');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
        toast.error('Erro ao processar arquivo');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Erro ao ler o arquivo');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  }, [setData, navigate]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      processFile(file);
    } else {
      setError('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      processFile(file);
    }
  };

  const handleProcessClick = () => {
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  if (!isAuthenticated || !user || user.role !== 'master') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="Upload" title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px' }}>
        {/* Page header banner */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Upload de Dados</h2>
              <p className="text-white/80 text-sm mt-1">
                Faça upload de arquivos Excel com preços das praças
              </p>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <HighlightedCard>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px ${dragActive ? 'solid' : 'dashed'} #78BE20`,
              borderRadius: '12px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              cursor: 'pointer',
              backgroundColor: dragActive ? 'rgba(120, 190, 32, 0.04)' : 'transparent',
              transition: 'all 0.2s ease',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(120, 190, 32, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isProcessing ? (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #E5E7EB',
                    borderTop: '3px solid #78BE20',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : (
                <FileSpreadsheet size={32} style={{ color: '#78BE20' }} />
              )}
            </div>

            {isProcessing ? (
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#001022', textAlign: 'center' }}>
                Processando arquivo...
              </p>
            ) : selectedFile ? (
              <>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#001022', textAlign: 'center' }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>
                  Clique novamente para selecionar outro arquivo
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#001022', textAlign: 'center' }}>
                  Arraste o arquivo Excel aqui
                </p>
                <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>
                  ou clique para selecionar
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {['.xlsx', '.xls'].map((type) => (
                <div
                  key={type}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    backgroundColor: '#F3F4F6',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#4B5563',
                  }}
                >
                  {type}
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Format Guide */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Estrutura esperada:
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
              }}
            >
              {['codigo', 'grupo', 'SP_Repasse', 'SP_Venda', 'SP_Margem', 'RJ_Repasse', 'RJ_Venda', 'RJ_Margem'].map(
                (col) => (
                  <div
                    key={col}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#001022',
                    }}
                  >
                    {col}
                  </div>
                )
              )}
              <div style={{ padding: '4px 10px', fontSize: '12px', color: '#9CA3AF' }}>...</div>
            </div>
          </div>
        </HighlightedCard>

        {/* Histórico Completo de Preços */}
        {priceHistory.length > 0 && (
          <Card style={{ border: '2px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <History size={20} style={{ color: '#D97706' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', margin: 0 }}>
                    Histórico Completo de Preços
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                  {priceHistory.length} registro(s) de alterações de preços de concorrentes
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  {showFullHistory ? (
                    <>
                      <ChevronUp size={16} />
                      Recolher
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Expandir
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #6EE7B7',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#047857',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={16} />
                  Exportar JSON
                </button>
              </div>
            </div>
            {showFullHistory && (
              <div style={{ borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FFFBEB' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Ação</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Serviço</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Concorrente</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Preço</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Data</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...priceHistory]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((entry) => {
                        const { label, color, bg } = getActionLabel(entry.acao);
                        return (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '100px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: color,
                                  backgroundColor: bg,
                                }}
                              >
                                {label}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div>
                                <span style={{ fontWeight: 500, fontSize: '13px', color: '#111827' }}>{entry.descricao}</span>
                                <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF' }}>Cód: {entry.codigoAvulso}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{entry.concorrente}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              {entry.acao === 'updated' && entry.precoAnterior !== undefined ? (
                                <div>
                                  <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '11px' }}>
                                    R$ {entry.precoAnterior.toFixed(2)}
                                  </span>
                                  <span style={{ display: 'block', fontWeight: 600, color: '#1D4ED8' }}>
                                    R$ {entry.preco.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontWeight: 600, color: entry.acao === 'removed' ? '#DC2626' : '#047857' }}>
                                  R$ {entry.preco.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
                              {formatDate(entry.timestamp)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
                              {entry.registradoPor}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
            {showFullHistory && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>💾 Dados salvos localmente.</span> Todos os registros são persistidos automaticamente no navegador.
                  Use o botão &quot;Exportar JSON&quot; para salvar uma cópia dos dados que poderá ser importada no Supabase futuramente.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Quick Info Cards - Horizontal Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div
            onClick={() => navigate('/governance')}
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: '#001022',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 16, 34, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(120, 190, 32, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={20} style={{ color: '#78BE20' }} />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Acompanhamento Precificação
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 12px 0' }}>
              Acompanhe comportamento e performance do processo
            </p>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '100px',
                backgroundColor: '#78BE20',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Acessar →
            </span>
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(120, 190, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BarChart2 size={20} style={{ color: '#78BE20' }} />
              </div>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', margin: 0 }}>
                Análise Automática
              </h3>
            </div>
            <p style={{ font: 'var(--font-body)', color: 'var(--text-body)', fontSize: '12px' }}>
              Identifica padrões e correlações entre as 27 praças
            </p>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(120, 190, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={20} style={{ color: '#78BE20' }} />
              </div>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', margin: 0 }}>
                Praças Parâmetro
              </h3>
            </div>
            <p style={{ font: 'var(--font-body)', color: 'var(--text-body)', fontSize: '12px' }}>
              Referência de precificação entre praças
            </p>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(120, 190, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={20} style={{ color: '#78BE20' }} />
              </div>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', margin: 0 }}>
                Correlações
              </h3>
            </div>
            <p style={{ font: 'var(--font-body)', color: 'var(--text-body)', fontSize: '12px' }}>
              Coeficiente de Pearson entre praças
            </p>
          </Card>
        </div>

        {/* Google Sheets Integration */}
        <GoogleSheetsConfig />

        {/* Replication Config */}
        <ReplicationConfig />

        {/* Replication Status */}
        <Card>
          <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '16px' }}>
            Status de Replicação
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#001022', marginBottom: '4px' }}>
                    {rule.replicatorPlaza}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>
                    {rule.targetPlazas.length} praças dependentes
                  </p>
                </div>
                <Toggle
                  checked={rule.isActive}
                  onChange={() => toggleRuleActive(rule.id)}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
