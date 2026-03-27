import { useState } from 'react';
import { Settings, RefreshCw, Check, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useGoogleSheetsStore } from '../store/googleSheetsStore';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { toast } from 'sonner';

export function GoogleSheetsConfig() {
  const { config, isConfigured, lastSync, isSyncing, syncError, setConfig, clearConfig, syncData, testConnection } = useGoogleSheetsStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; preview?: any } | null>(null);
  
  // Form state
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetName, setSheetName] = useState(config?.sheetName || 'Dados');

  const handleSaveConfig = () => {
    // Validações
    if (!apiKey) {
      toast.error('API Key é obrigatória');
      return;
    }

    if (!GoogleSheetsService.isValidApiKey(apiKey)) {
      toast.error('API Key parece inválida. Verifique o formato.');
      return;
    }

    if (!spreadsheetUrl) {
      toast.error('URL da planilha é obrigatória');
      return;
    }

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      toast.error('URL da planilha inválida. Use uma URL do Google Sheets.');
      return;
    }

    if (!sheetName) {
      toast.error('Nome da aba é obrigatório');
      return;
    }

    // Salvar configuração
    setConfig({
      apiKey,
      spreadsheetId,
      sheetName,
    });

    toast.success('Configuração salva!', {
      description: 'Agora você pode sincronizar os dados.',
    });

    setIsOpen(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKey || !spreadsheetUrl || !sheetName) {
      toast.error('Preencha todos os campos antes de testar');
      return;
    }

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      toast.error('URL da planilha inválida');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Configuração temporária para teste
    const tempService = new GoogleSheetsService();
    tempService.setConfig({ apiKey, spreadsheetId, sheetName });

    try {
      const result = await tempService.testConnection();
      setTestResult(result);

      if (result.success) {
        toast.success('Conexão bem-sucedida!');
      } else {
        toast.error('Falha na conexão');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    const result = await syncData();
    
    if (result.success) {
      toast.success('Sincronização concluída! 🎉', {
        description: `${result.data?.length || 0} linhas importadas`,
      });
    } else {
      toast.error('Erro na sincronização', {
        description: result.error,
      });
    }
  };

  const handleClearConfig = () => {
    if (confirm('Tem certeza que deseja remover a configuração do Google Sheets?')) {
      clearConfig();
      setApiKey('');
      setSpreadsheetUrl('');
      setSheetName('Dados');
      setTestResult(null);
      toast.success('Configuração removida');
      setIsOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Integração Google Sheets
        </CardTitle>
        <CardDescription>
          Conecte sua planilha do Google Sheets para importar dados automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div>
            <p className="text-sm font-medium text-gray-900">Status da Conexão</p>
            <p className="text-xs text-gray-500 mt-1">
              {isConfigured ? 'Google Sheets configurado' : 'Não configurado'}
            </p>
            {lastSync && (
              <p className="text-xs text-gray-500 mt-1">
                Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <Badge variant={isConfigured ? 'default' : 'outline'} className={isConfigured ? 'bg-green-600' : ''}>
            {isConfigured ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Erro de Sincronização */}
        {syncError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na última sincronização</AlertTitle>
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                {isConfigured ? 'Reconfigurar' : 'Configurar'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurar Google Sheets</DialogTitle>
                <DialogDescription>
                  Configure a integração com sua planilha do Google Sheets
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Instruções */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Como configurar:</AlertTitle>
                  <AlertDescription className="text-xs space-y-2 mt-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                      <li>Crie um projeto ou use um existente</li>
                      <li>Habilite a "Google Sheets API"</li>
                      <li>Crie uma "API Key" nas credenciais</li>
                      <li>Torne sua planilha pública (ou configure OAuth)</li>
                      <li>Cole a API Key e URL da planilha abaixo</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Google API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="AIzaSyD..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Sua chave de API do Google Cloud Console
                  </p>
                </div>

                {/* Spreadsheet URL */}
                <div className="space-y-2">
                  <Label htmlFor="spreadsheetUrl">URL da Planilha</Label>
                  <Input
                    id="spreadsheetUrl"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    URL completa da planilha do Google Sheets
                  </p>
                </div>

                {/* Sheet Name */}
                <div className="space-y-2">
                  <Label htmlFor="sheetName">Nome da Aba</Label>
                  <Input
                    id="sheetName"
                    type="text"
                    placeholder="Dados"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Nome da aba dentro da planilha (ex: "Dados", "Preços", "Planilha1")
                  </p>
                </div>

                {/* Testar Conexão */}
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKey || !spreadsheetUrl || !sheetName}
                  variant="outline"
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {/* Resultado do Teste */}
                {testResult && (
                  <Alert variant={testResult.success ? 'default' : 'destructive'}>
                    {testResult.success ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {testResult.success ? 'Conexão bem-sucedida!' : 'Erro na conexão'}
                    </AlertTitle>
                    <AlertDescription>
                      <p className="text-sm mb-2">{testResult.message}</p>
                      {testResult.preview && (
                        <div className="mt-3 p-3 bg-white rounded border text-xs">
                          <p className="font-semibold mb-2">Preview dos dados:</p>
                          <p className="text-gray-600 mb-1">
                            Colunas: {testResult.preview.headers.join(', ')}
                          </p>
                          <p className="text-gray-600">
                            Primeiras linhas: {testResult.preview.sampleRows.length} registros
                          </p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botões de ação */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={!apiKey || !spreadsheetUrl || !sheetName}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Configuração
                  </Button>
                  {isConfigured && (
                    <Button
                      onClick={handleClearConfig}
                      variant="destructive"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isConfigured && (
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2 flex-1"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          )}
        </div>

        {/* Informação adicional */}
        {isConfigured && (
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium text-blue-900 mb-1">💡 Dica:</p>
            <p>
              Os dados são sincronizados manualmente. Clique em "Sincronizar Agora" sempre 
              que quiser atualizar os dados da planilha.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
