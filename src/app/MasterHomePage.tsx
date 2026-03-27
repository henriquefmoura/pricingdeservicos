import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { AppLayout } from './components/AppLayout';
import { HighlightedCard, AISuggestionCard, Card } from './components/Card';
import { Toggle } from './components/Toggle';
import { FileSpreadsheet, BarChart2, MapPin, TrendingUp, AlertCircle, ListChecks } from 'lucide-react';
import { usePricingStore } from './store/pricingStore';
import { useAuthStore } from './store/authStore';
import { usePricingCodesStore } from './store/pricingCodesStore';
import { useReplicationConfigStore } from './store/replicationConfigStore';
import { GoogleSheetsConfig } from './components/GoogleSheetsConfig';
import { ReplicationConfig } from './components/ReplicationConfig';
import { PricingCodesManager } from './pages/PricingCodesManager';
import { ServiceData } from './types/pricing';
import { toast } from 'sonner';

export default function MasterHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const setData = usePricingStore((state) => state.setData);
  const { getPendingCodesCount, initializeMockCodes } = usePricingCodesStore();
  const { rules, toggleRuleActive } = useReplicationConfigStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'codes'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar códigos mock
  useEffect(() => {
    initializeMockCodes();
  }, [initializeMockCodes]);

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

  const pendingCodesCount = getPendingCodesCount();

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
    <AppLayout activeNav="Upload" title="Painel Master" subtitle="Upload de dados e gerenciamento de códigos de precificação">
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'upload' ? '#78BE20' : '#FFFFFF',
            color: activeTab === 'upload' ? '#FFFFFF' : '#001022',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab !== 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <FileSpreadsheet size={16} />
          Upload de Dados
        </button>
        <button
          onClick={() => setActiveTab('codes')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'codes' ? '#78BE20' : '#FFFFFF',
            color: activeTab === 'codes' ? '#FFFFFF' : '#001022',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab !== 'codes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <ListChecks size={16} />
          Códigos para Precificação
          {pendingCodesCount > 0 && (
            <span
              style={{
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '100px',
              }}
            >
              {pendingCodesCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '24px', maxWidth: '1440px' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upload Card */}
            <HighlightedCard>
              <h2 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                Upload de Dados
              </h2>
              <p style={{ font: 'var(--font-body)', color: 'var(--text-body)', marginBottom: '24px' }}>
                Arquivo Excel com preços das praças
              </p>

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

            {/* Google Sheets Integration */}
            <GoogleSheetsConfig />

            {/* Replication Config */}
            <ReplicationConfig />
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(120, 190, 32, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BarChart2 size={24} style={{ color: '#78BE20' }} />
                </div>
                <div>
                  <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                    Análise Automática
                  </h3>
                  <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                    O sistema identifica automaticamente padrões e correlações entre as 27 praças
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(120, 190, 32, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={24} style={{ color: '#78BE20' }} />
                </div>
                <div>
                  <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                    Praças Parâmetro
                  </h3>
                  <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                    Seleciona de 2 a 5 praças para servir como referência de precificação
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(120, 190, 32, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={24} style={{ color: '#78BE20' }} />
                </div>
                <div>
                  <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                    Correlações
                  </h3>
                  <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                    Calcula coeficiente de Pearson para encontrar similaridades entre praças
                  </p>
                </div>
              </div>
            </Card>

            {/* Replication Status */}
            <Card>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '16px' }}>
                Status de Replicação
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        </div>
      )}

      {activeTab === 'codes' && (
        <PricingCodesManager />
      )}

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
