import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, LogOut, ListChecks } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { usePricingStore } from '../store/pricingStore';
import { useAuthStore } from '../store/authStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { ServiceData } from '../types/pricing';
import { PricingCodesManager } from './PricingCodesManager';
import { GoogleSheetsConfig } from '../components/GoogleSheetsConfig';
import { ReplicationConfig } from '../components/ReplicationConfig';

export function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'codes'>('upload');
  const navigate = useNavigate();
  const setData = usePricingStore((state) => state.setData);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getPendingCodesCount, initializeMockCodes } = usePricingCodesStore();

  // Inicializar códigos mock
  useEffect(() => {
    initializeMockCodes();
  }, [initializeMockCodes]);

  const pendingCodesCount = getPendingCodesCount();

  // Todos os hooks DEVEM vir antes de qualquer return condicional
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

        // Valida estrutura mínima
        const firstRow = jsonData[0];
        if (!firstRow.codigo && !firstRow.grupo) {
          throw new Error('O arquivo deve conter as colunas "codigo" e "grupo"');
        }

        setData(jsonData);
        navigate('/analysis');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Redirecionar se não estiver autenticado ou se for usuário comum
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
    // Master fica na Home para fazer upload
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Agora sim, early return DEPOIS de todos os hooks
  if (!isAuthenticated || !user || user.role !== 'master') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header com nome do usuário e logout */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl text-gray-900">
              Sistema de Análise de Precificação
            </h1>
            <p className="text-gray-600 mt-2">
              Identifique praças-parâmetro e otimize sua estratégia de preços
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow">
            <span className="text-sm text-gray-600">
              Bem-vindo, <span className="font-semibold text-gray-900">{user?.name}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs de navegação */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload de Dados
          </Button>
          <Button
            variant={activeTab === 'codes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('codes')}
            className="gap-2"
          >
            <ListChecks className="w-4 h-4" />
            Códigos para Precificação
            {pendingCodesCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCodesCount}
              </span>
            )}
          </Button>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'upload' && (
          <div>
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle>Upload de Dados</CardTitle>
                <CardDescription>
                  Faça upload do arquivo Excel contendo os preços das 27 praças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex flex-col items-center gap-4">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Processando arquivo...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-100 p-4 rounded-full">
                          <FileSpreadsheet className="w-12 h-12 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-lg mb-2 text-gray-700">
                            Arraste e solte seu arquivo Excel aqui
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            ou clique no botão abaixo para selecionar
                          </p>
                        </div>
                        <label htmlFor="file-upload">
                          <Button asChild>
                            <span className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Selecionar Arquivo
                            </span>
                          </Button>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Formato esperado do Excel:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Coluna "codigo": Código do serviço</li>
                    <li>• Coluna "grupo": Grupo de serviço</li>
                    <li>• Para cada praça, 3 colunas: NomePraça_Repasse, NomePraça_Venda, NomePraça_Margem</li>
                    <li>• Exemplo: codigo | grupo | SP_Repasse | SP_Venda | SP_Margem | RJ_Repasse | RJ_Venda | RJ_Margem | ...</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Google Sheets Integration */}
            <div className="mt-8">
              <GoogleSheetsConfig />
            </div>

            {/* Replication Config */}
            <div className="mt-8">
              <ReplicationConfig />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Análise Automática</p>
                      <p className="text-sm text-gray-600">Identificação de padrões</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Praças Parâmetro</p>
                      <p className="text-sm text-gray-600">2-5 praças de referência</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Correlações</p>
                      <p className="text-sm text-gray-600">Variações percentuais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'codes' && (
          <PricingCodesManager />
        )}
      </div>
    </div>
  );
}