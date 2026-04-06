import { useState } from 'react';
import { Search, Plus, Trash2, TrendingUp, History, Clock, Download, ChevronDown, ChevronUp, ArrowUpDown, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useMarketResearchStore, PricingStrategy, PriceHistoryEntry } from '../store/marketResearchStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

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

function getActionLabel(acao: PriceHistoryEntry['acao']): { label: string; color: string } {
  switch (acao) {
    case 'added':
      return { label: 'Adicionado', color: 'bg-green-100 text-green-700 border-green-300' };
    case 'updated':
      return { label: 'Atualizado', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    case 'removed':
      return { label: 'Removido', color: 'bg-red-100 text-red-700 border-red-300' };
  }
}

export function MarketResearchForm() {
  const { user } = useAuthStore();
  const { codes } = usePricingCodesStore();
  const { researches, strategy, priceHistory, addCompetitorPrice, removeCompetitorPrice, setStrategy, getSuggestedPrice, getPriceHistoryByCode, exportData } = useMarketResearchStore();
  
  const [codigo, setCodigo] = useState('');
  const [concorrente, setConcorrente] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [showFullHistory, setShowFullHistory] = useState(true);

  // Buscar descrição quando o código é alterado
  const handleCodigoChange = (value: string) => {
    setCodigo(value);
    
    if (value.trim()) {
      const foundCode = codes.find((c) => c.codigoAvulso === value.trim());
      if (foundCode) {
        setDescricao(foundCode.descricao);
      } else {
        setDescricao('');
      }
    } else {
      setDescricao('');
    }
  };

  const handleAddCompetitor = () => {
    if (!codigo.trim()) {
      toast.error('Por favor, insira o código do serviço');
      return;
    }

    if (!descricao) {
      toast.error('Código não encontrado. Verifique se o código existe na lista de códigos para precificação');
      return;
    }

    if (!concorrente.trim()) {
      toast.error('Por favor, insira o nome do concorrente');
      return;
    }

    if (!preco || parseFloat(preco) <= 0) {
      toast.error('Por favor, insira um preço válido');
      return;
    }

    addCompetitorPrice(
      codigo.trim(),
      descricao,
      concorrente.trim(),
      parseFloat(preco),
      user?.name || 'Admin'
    );

    // Limpar apenas concorrente e preço, manter código para adicionar mais concorrentes
    setConcorrente('');
    setPreco('');
    
    toast.success(`Preço do concorrente ${concorrente} adicionado com sucesso!`);
  };

  const handleRemoveCompetitor = (codigoAvulso: string, competitorId: string) => {
    removeCompetitorPrice(codigoAvulso, competitorId);
    toast.success('Preço de concorrente removido');
  };

  const handleNewCode = () => {
    setCodigo('');
    setDescricao('');
    setConcorrente('');
    setPreco('');
  };

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

  const toggleHistory = (codigoAvulso: string) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [codigoAvulso]: !prev[codigoAvulso],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div
        className="rounded-xl p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Pesquisa de Mercado
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Registre e acompanhe preços de concorrentes para embasar a precificação dos serviços
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Estratégia de Precificação */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg">Estratégia de Precificação</CardTitle>
          <CardDescription>
            Defina como os preços sugeridos serão calculados com base na pesquisa de mercado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Estratégia de Mercado</Label>
              <Select value={strategy} onValueChange={(value) => setStrategy(value as PricingStrategy)}>
                <SelectTrigger id="strategy" className="bg-white">
                  <SelectValue placeholder="Selecione uma estratégia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below_market">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Abaixo do mercado</span>
                      <span className="text-xs text-gray-500">Competir por preço (peso concorrentes: 0.8)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="match_market">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Preço de mercado</span>
                      <span className="text-xs text-gray-500">Acompanhar mercado (peso concorrentes: 1.0)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="above_market">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Acima do mercado</span>
                      <span className="text-xs text-gray-500">Posicionamento premium (peso concorrentes: 1.5)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mostrar descrição da estratégia atual */}
            <div className="p-3 bg-white border border-purple-200 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  {strategy === 'below_market' && (
                    <p className="text-gray-700">
                      <span className="font-semibold text-purple-700">Estratégia Agressiva:</span> Os preços sugeridos serão calculados dando menor peso aos concorrentes, priorizando competitividade de preço.
                    </p>
                  )}
                  {strategy === 'match_market' && (
                    <p className="text-gray-700">
                      <span className="font-semibold text-purple-700">Estratégia Neutra:</span> Os preços sugeridos equilibrarão preços dos concorrentes e histórico interno com pesos iguais.
                    </p>
                  )}
                  {strategy === 'above_market' && (
                    <p className="text-gray-700">
                      <span className="font-semibold text-purple-700">Estratégia Premium:</span> Os preços sugeridos darão maior peso aos concorrentes, permitindo posicionamento premium no mercado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Adição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Adicionar Pesquisa de Mercado
          </CardTitle>
          <CardDescription>
            Pesquise preços da concorrência para auxiliar na precificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Serviço *</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo"
                    placeholder="Ex: 50041154"
                    value={codigo}
                    onChange={(e) => handleCodigoChange(e.target.value)}
                  />
                  {codigo && descricao && (
                    <Button variant="outline" size="sm" onClick={handleNewCode}>
                      Novo
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição do Serviço</Label>
                <Input
                  value={descricao}
                  disabled
                  placeholder="Será preenchida automaticamente"
                  className="bg-gray-50"
                />
              </div>
            </div>

            {descricao && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium">
                    Serviço identificado: {descricao}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Agora adicione os preços dos concorrentes abaixo
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="concorrente">Nome do Concorrente *</Label>
                    <Input
                      id="concorrente"
                      placeholder="Ex: Empresa ABC"
                      value={concorrente}
                      onChange={(e) => setConcorrente(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="preco">Preço Cobrado (R$) *</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  <div className="flex items-end md:col-span-1">
                    <Button onClick={handleAddCompetitor} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Concorrente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pesquisas */}
      {researches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pesquisas de Mercado Registradas
            </CardTitle>
            <CardDescription>
              {researches.length} serviço(s) com pesquisa de mercado realizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {researches.map((research) => (
                <Card key={research.codigoAvulso} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {research.descricao}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Código: <span className="font-medium">{research.codigoAvulso}</span>
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            {research.precosConcorrentes.length} concorrente(s)
                          </Badge>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Concorrente</TableHead>
                              <TableHead className="text-center">Data</TableHead>
                              <TableHead className="text-center">Registrado por</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-right w-20">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {research.precosConcorrentes.map((comp) => (
                              <TableRow key={comp.id}>
                                <TableCell className="font-medium">{comp.concorrente}</TableCell>
                                <TableCell className="text-center text-xs text-gray-500">
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(comp.adicionadoEm)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-gray-500">
                                  <div className="flex items-center justify-center gap-1">
                                    <User className="w-3 h-3" />
                                    {comp.adicionadoPor}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-700">
                                  R$ {comp.preco.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCompetitor(research.codigoAvulso, comp.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-blue-50">
                              <TableCell className="font-bold">Média dos Concorrentes</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right font-bold text-blue-700">
                                R${' '}
                                {(
                                  research.precosConcorrentes.reduce((sum, c) => sum + c.preco, 0) /
                                  research.precosConcorrentes.length
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* Histórico de Preços por Serviço */}
                      {(() => {
                        const serviceHistory = getPriceHistoryByCode(research.codigoAvulso);
                        if (serviceHistory.length === 0) return null;

                        const isExpanded = expandedHistory[research.codigoAvulso];

                        return (
                          <div className="border border-amber-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleHistory(research.codigoAvulso)}
                              className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-amber-700" />
                                <span className="text-sm font-medium text-amber-800">
                                  Histórico de Preços ({serviceHistory.length} registro(s))
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-amber-700" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-amber-700" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                                {serviceHistory.map((entry) => {
                                  const { label, color } = getActionLabel(entry.acao);
                                  return (
                                    <div
                                      key={entry.id}
                                      className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-md text-sm"
                                    >
                                      <Badge variant="outline" className={`text-xs ${color}`}>
                                        {label}
                                      </Badge>
                                      <div className="flex-1">
                                        <span className="font-medium">{entry.concorrente}</span>
                                        {entry.acao === 'updated' && entry.precoAnterior !== undefined ? (
                                          <span className="text-gray-600">
                                            {' '} — R$ {entry.precoAnterior.toFixed(2)}
                                            <ArrowUpDown className="w-3 h-3 inline mx-1" />
                                            R$ {entry.preco.toFixed(2)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-600">
                                            {' '} — R$ {entry.preco.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(entry.timestamp)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Preço Sugerido com Estratégia Atual */}
                      {(() => {
                        const suggestedPrice = getSuggestedPrice(research.codigoAvulso);
                        if (suggestedPrice) {
                          return (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="bg-purple-600 p-2 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-purple-700 font-medium">
                                      Preço Sugerido por IA
                                    </p>
                                    <p className="text-xs text-purple-600">
                                      Baseado na estratégia:{' '}
                                      <span className="font-semibold">
                                        {strategy === 'below_market' && 'Abaixo do mercado'}
                                        {strategy === 'match_market' && 'Preço de mercado'}
                                        {strategy === 'above_market' && 'Acima do mercado'}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-purple-600 text-white border-0 px-4 py-1.5 text-base">
                                    R$ {suggestedPrice.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {researches.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma pesquisa de mercado registrada
              </h3>
              <p className="text-sm text-gray-600">
                Comece adicionando preços de concorrentes para os serviços que você precisa precificar
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Completo de Preços */}
      {priceHistory.length > 0 && (
        <Card className="border-2 border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-600" />
                  Histórico Completo de Preços
                </CardTitle>
                <CardDescription>
                  {priceHistory.length} registro(s) de alterações de preços de concorrentes
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  className="gap-1"
                >
                  {showFullHistory ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Recolher
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Expandir
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFullHistory && (
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50">
                      <TableHead>Ação</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Concorrente</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-center">Registrado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...priceHistory]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((entry) => {
                        const { label, color } = getActionLabel(entry.acao);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${color}`}>
                                {label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium text-sm">{entry.descricao}</span>
                                <span className="text-xs text-gray-500 block">Cód: {entry.codigoAvulso}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{entry.concorrente}</TableCell>
                            <TableCell className="text-right">
                              {entry.acao === 'updated' && entry.precoAnterior !== undefined ? (
                                <div>
                                  <span className="text-gray-400 line-through text-xs">
                                    R$ {entry.precoAnterior.toFixed(2)}
                                  </span>
                                  <span className="font-semibold text-blue-700 block">
                                    R$ {entry.preco.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className={`font-semibold ${entry.acao === 'removed' ? 'text-red-600' : 'text-green-700'}`}>
                                  R$ {entry.preco.toFixed(2)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-500">
                              {formatDate(entry.timestamp)}
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-500">
                              {entry.registradoPor}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs text-emerald-700">
                  <span className="font-semibold">💾 Dados salvos localmente.</span> Todos os registros são persistidos automaticamente no navegador. 
                  Use o botão &quot;Exportar JSON&quot; para salvar uma cópia dos dados que poderá ser importada no Supabase futuramente.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}