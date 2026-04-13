import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle2, AlertCircle, AlertTriangle, Lightbulb, TrendingUp, ListChecks, ChevronDown, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { usePricingCodesStore, PricingCode, UNGROUPED_KEY } from '../store/pricingCodesStore';
import { useAuthStore } from '../store/authStore';
import { useMarketResearchStore } from '../store/marketResearchStore';
import { useApprovalStore } from '../store/approvalStore';
import { useCorrelationStore } from '../store/correlationStore';
import { useReplicationConfigStore } from '../store/replicationConfigStore';
import { updateCalculatorSnapshot } from '../services/pricingMentorAIService';
import { useSupportStore } from '../store/supportStore';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

interface PriceInput {
  repasse: string;
  venda: string;
}

interface AdminPricingInterfaceProps {
  initialFilter?: 'pendentes' | 'precificados';
}

export function AdminPricingInterface({ initialFilter }: AdminPricingInterfaceProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { codes, updateCodePrice, initializeMockCodes } = usePricingCodesStore();
  const { getResearchByCode, getSuggestedPrice } = useMarketResearchStore();
  const { addApproval } = useApprovalStore();
  const { getSimilarPlazas, initializeMockData } = useCorrelationStore();
  const { getTargetPlazasForReplicator, isPlazaReplicator } = useReplicationConfigStore();
  const { createThread, addMessage } = useSupportStore();
  const { addNotification } = useNotificationStore();
  const [priceInputs, setPriceInputs] = useState<Record<string, PriceInput>>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'pendentes' | 'precificados'>(initialFilter || 'pendentes');

  // Sincronizar filtro quando prop externa muda
  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  // Inicializar dados mock de correlação e códigos
  useEffect(() => {
    initializeMockData();
    initializeMockCodes();
  }, [initializeMockData, initializeMockCodes]);

  // Filtrar códigos por plaza do admin (se houver)
  const relevantCodes = useMemo(() => {
    return codes.filter((code) => {
      // Se o código já foi preenchido para a praça do admin, não mostrar
      if (user?.plaza && code.prices?.[user.plaza]) {
        return false;
      }
      // Mostrar códigos pendentes e em andamento
      return code.status === 'pendente' || code.status === 'em_andamento';
    });
  }, [codes, user?.plaza]);

  // Códigos já precificados pela praça do admin
  const pricedCodes = useMemo(() => {
    return codes.filter((code) => user?.plaza && !!code.prices?.[user.plaza]);
  }, [codes, user?.plaza]);

  const getTipoBadgeColor = (tipo: PricingCode['tipo']) => {
    switch (tipo) {
      case 'Visita Técnica':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Serviço':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Inst + Pague -':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Emergencial':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Complementar':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Deslocamento':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleReportPricingError = (code: PricingCode) => {
    if (!user || !user.plaza) return;
    const price = code.prices?.[user.plaza];
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
      price ? `• Margem: ${price.margem.toFixed(2)}%` : '',
      `• Praça: ${user.plaza}`,
      '',
      `Motivo: `,
    ].filter(Boolean).join('\n');

    const threadId = createThread({
      subject,
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: user.plaza,
    });

    addMessage(threadId, {
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      toPlaza: user.plaza,
      message: messageBody,
    });

    addNotification({
      type: 'support_request',
      title: `Novo chamado: ${subject}`,
      message: messageBody.substring(0, 100) + '...',
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: user.plaza,
      priority: 'medium',
    });

    toast.success('Chamado de erro aberto com sucesso!');
    navigate('/admin-support');
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

    // 1. Salvar DIRETO na praça do admin (sem aprovação)
    updateCodePrice(code.id, user.plaza, repasse, venda, user.name);
    
    // 2. Verificar se esta praça é replicadora e replicar conforme configuração do Master
    let targetPlazas: string[] = [];
    
    if (isPlazaReplicator(user.plaza)) {
      // Usar configuração do Master
      targetPlazas = getTargetPlazasForReplicator(user.plaza);
    } else {
      // Fallback: usar sistema antigo de correlação
      targetPlazas = getSimilarPlazas(user.plaza);
    }
    
    if (targetPlazas.length > 0) {
      // Criar aprovações para cada praça alvo
      targetPlazas.forEach((plaza) => {
        // Verificar se a praça já tem preço anterior para este código
        const currentPrice = code.prices?.[plaza];
        const currentVenda = currentPrice?.venda || 0;
        const currentRepasse = currentPrice?.repasse || 0;
        const currentMargem = currentPrice ? ((currentPrice.venda - currentPrice.repasse) / currentPrice.venda) * 100 : 0;
        
        // Calcular variação correta: 0 para novos serviços, % para serviços existentes
        const variation = currentVenda === 0 
          ? 0 
          : ((venda - currentVenda) / currentVenda) * 100;
        
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
      
      toast.success(`Preço aplicado e replicado! 🎉`, {
        description: `Preço de ${code.descricao} aplicado em ${user.plaza} e enviado para aprovação em ${targetPlazas.length} praça(s) via ${replicationSource}: ${targetPlazas.join(', ')}`,
      });
    } else {
      toast.success(`Preço aplicado! 🎉`, {
        description: `Preço de ${code.descricao} aplicado em ${user.plaza}`,
      });
    }
    
    // Limpar inputs
    setPriceInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[code.id];
      return newInputs;
    });
    
    setEditingCode(null);
  };

  const calculateMargem = (codeId: string) => {
    const input = priceInputs[codeId];
    if (!input || !input.repasse || !input.venda) return null;

    const repasse = parseFloat(input.repasse);
    const venda = parseFloat(input.venda);

    if (isNaN(repasse) || isNaN(venda) || venda === 0) return null;

    return ((venda - repasse) / venda) * 100;
  };

  // Helper para agrupar códigos por grupoServico
  const groupCodesByServico = (codesToGroup: PricingCode[]) => {
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

  const pendentesGrouped = useMemo(() => groupCodesByServico(relevantCodes), [relevantCodes]);
  const precificadosGrouped = useMemo(() => groupCodesByServico(pricedCodes), [pricedCodes]);

  // RPA: Update calculator snapshot when user edits a pricing code
  useEffect(() => {
    if (!editingCode) return;
    const code = codes.find((c) => c.id === editingCode);
    if (!code) return;

    const input = priceInputs[editingCode];
    const toNum = (v: string | undefined) => {
      if (v == null) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };
    const repasse = toNum(input?.repasse);
    const venda = toNum(input?.venda);
    const margem = repasse != null && venda != null && venda > 0
      ? ((venda - repasse) / venda) * 100
      : undefined;

    updateCalculatorSnapshot({
      serviceCode: code.codigoAvulso || code.codigoAtrelado || '-',
      serviceName: code.descricao,
      serviceGroup: code.tipo,
      plaza: user?.plaza,
      repasse,
      venda,
      margem,
    });
  }, [editingCode, priceInputs, codes, user?.plaza]);

  // Calcular estatísticas
  const totalCodes = relevantCodes.length;
  const completedByMe = codes.filter(
    (code) => user?.plaza && code.prices?.[user.plaza]
  ).length;

  // Render helper for a single pending code card
  const renderPendingCodeCard = (code: PricingCode) => {
    const margem = calculateMargem(code.id);
    const isEditing = editingCode === code.id;
    const hasInput = priceInputs[code.id];

    return (
      <Card key={code.id} className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Cabeçalho do código */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTipoBadgeColor(code.tipo)}>
                    {code.tipo}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Prazo: {code.prazo}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {code.descricao}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {code.codigoAtrelado && (
                    <span>
                      <span className="font-medium">Cód. Atrelado:</span>{' '}
                      {code.codigoAtrelado}
                    </span>
                  )}
                  {code.codigoAvulso && (
                    <span>
                      <span className="font-medium">Cód. Avulso:</span>{' '}
                      {code.codigoAvulso}
                    </span>
                  )}
                  <span>
                    <span className="font-medium">Unidade:</span>{' '}
                    {code.unidade}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulário de preços */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl border-2 border-green-400 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50" style={{ boxShadow: '0 2px 8px rgba(120, 190, 32, 0.15), 0 1px 3px rgba(0, 0, 0, 0.06)' }}>
              <div className="space-y-2">
                <Label htmlFor={`repasse-${code.id}`} className="text-sm font-bold text-gray-800">
                  Repasse (R$) *
                </Label>
                <Input
                  id={`repasse-${code.id}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceInputs[code.id]?.repasse || ''}
                  onChange={(e) =>
                    handlePriceChange(code.id, 'repasse', e.target.value)
                  }
                  onFocus={() => setEditingCode(code.id)}
                  className="text-right border-2 border-gray-400 focus:border-green-500 h-11 text-base font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`venda-${code.id}`} className="text-sm font-bold text-gray-800">
                  Preço Venda (R$) *
                </Label>
                <Input
                  id={`venda-${code.id}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceInputs[code.id]?.venda || ''}
                  onChange={(e) =>
                    handlePriceChange(code.id, 'venda', e.target.value)
                  }
                  onFocus={() => setEditingCode(code.id)}
                  className="text-right border-2 border-gray-400 focus:border-green-500 h-11 text-base font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label>Margem (%)</Label>
                <div
                  className={`h-10 px-3 py-2 border rounded-md text-right font-semibold flex items-center justify-end ${
                    margem !== null
                      ? margem >= 15
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : margem >= 10
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  {margem !== null ? `${margem.toFixed(2)}%` : '-'}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => handleSavePrice(code)}
                  disabled={!hasInput || !hasInput.repasse || !hasInput.venda}
                  className="w-full gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            </div>

            {/* Preço Sugerido baseado em Pesquisa de Mercado */}
            {(() => {
              const codeRef = code.codigoAvulso || code.codigoAtrelado || '';
              const research = getResearchByCode(codeRef);
              const prestadorPrices = code.prices
                ? Object.values(code.prices).map((p) => p.venda)
                : [];
              const suggestedPrice = getSuggestedPrice(
                codeRef,
                prestadorPrices
              );

              if (suggestedPrice || research) {
                return (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          Preço Sugerido por IA
                          {suggestedPrice && (
                            <Badge className="bg-blue-600 text-white border-0">
                              R$ {suggestedPrice.toFixed(2)}
                            </Badge>
                          )}
                        </h5>
                        <div className="space-y-2 text-sm">
                          {research && research.precosConcorrentes.length > 0 && (
                            <div className="bg-white/70 p-3 rounded-md border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-blue-700" />
                                <span className="font-medium text-blue-900">
                                  Pesquisa de Mercado ({research.precosConcorrentes.length} concorrente
                                  {research.precosConcorrentes.length > 1 ? 's' : ''})
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {research.precosConcorrentes.map((comp) => (
                                  <div key={comp.id} className="text-blue-800">
                                    <span className="font-medium">{comp.concorrente}:</span>{' '}
                                    R$ {comp.preco.toFixed(2)}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-blue-200 text-blue-900 font-semibold">
                                Média dos Concorrentes: R${' '}
                                {(
                                  research.precosConcorrentes.reduce(
                                    (sum, c) => sum + c.preco,
                                    0
                                  ) / research.precosConcorrentes.length
                                ).toFixed(2)}
                              </div>
                            </div>
                          )}
                          {prestadorPrices.length > 0 && (
                            <div className="bg-white/70 p-3 rounded-md border border-blue-200">
                              <span className="font-medium text-blue-900">
                                Preços de Prestadores ({prestadorPrices.length} praça
                                {prestadorPrices.length > 1 ? 's' : ''}):
                              </span>{' '}
                              <span className="text-blue-800">
                                Média R${' '}
                                {(
                                  prestadorPrices.reduce((sum, p) => sum + p, 0) /
                                  prestadorPrices.length
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {suggestedPrice && (
                            <p className="text-blue-800 mt-2">
                              💡 <strong>Recomendação:</strong> Com base nos dados de mercado
                              e preços de outras praças, sugerimos um preço de venda próximo a{' '}
                              <strong className="text-blue-900">
                                R$ {suggestedPrice.toFixed(2)}
                              </strong>
                              . Ajuste conforme as condições da sua praça.
                            </p>
                          )}
                        </div>
                        {suggestedPrice && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [code.id]: {
                                    ...prev[code.id],
                                    venda: suggestedPrice.toFixed(2),
                                  },
                                }));
                                setEditingCode(code.id);
                                toast.success('Preço sugerido aplicado ao campo de venda');
                              }}
                              className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              <Lightbulb className="w-4 h-4" />
                              Usar Preço Sugerido
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Alertas de validação */}
            {isEditing && hasInput && hasInput.repasse && hasInput.venda && (
              <div className="mt-2">
                {margem !== null && margem < 10 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800">
                      <strong>Atenção:</strong> A margem está abaixo de 10%, o
                      que pode não ser rentável.
                    </p>
                  </div>
                )}
                {margem !== null && margem >= 10 && margem < 15 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      A margem está entre 10-15%, dentro do aceitável mas pode ser otimizada.
                    </p>
                  </div>
                )}
                {margem !== null && margem >= 15 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800">
                      Excelente! A margem está acima de 15%, dentro do ideal.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render helper for a single priced code card
  const renderPricedCodeCard = (code: PricingCode) => {
    const plaza = user?.plaza;
    if (!plaza) return null;
    const price = code.prices?.[plaza];
    return (
      <Card key={code.id} className="border-2 border-green-200 bg-green-50/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getTipoBadgeColor(code.tipo)}>
                  {code.tipo}
                </Badge>
                <span className="text-xs text-gray-500">
                  Prazo: {code.prazo}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {code.descricao}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {code.codigoAtrelado && (
                  <span>
                    <span className="font-medium">Cód. Atrelado:</span>{' '}
                    {code.codigoAtrelado}
                  </span>
                )}
                {code.codigoAvulso && (
                  <span>
                    <span className="font-medium">Cód. Avulso:</span>{' '}
                    {code.codigoAvulso}
                  </span>
                )}
                <span>
                  <span className="font-medium">Unidade:</span>{' '}
                  {code.unidade}
                </span>
              </div>
            </div>
            {price && (
              <div className="flex items-center gap-4 text-sm ml-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Repasse</p>
                  <p className="font-semibold text-gray-800">
                    R$ {price.repasse.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Venda</p>
                  <p className="font-semibold text-gray-800">
                    R$ {price.venda.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Margem</p>
                  <p
                    className={`font-semibold ${
                      price.margem >= 15
                        ? 'text-green-700'
                        : price.margem >= 10
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}
                  >
                    {price.margem.toFixed(2)}%
                  </p>
                </div>
                <button
                  onClick={() => handleReportPricingError(code)}
                  title="Reportar erro no preenchimento"
                  className="ml-2 p-1.5 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (totalCodes === 0 && completedByMe > 0 && activeFilter === 'pendentes') {
    return (
      <div className="space-y-6">
        {/* Gradient header banner */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <ListChecks className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Precificação</h2>
              <p className="text-white/80 text-sm mt-1">
                Defina preços de repasse e venda para praça {user?.plaza}
              </p>
            </div>
          </div>
        </div>
        {/* Filter buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveFilter('pendentes')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-colors bg-orange-50 border-orange-400 text-orange-700"
          >
            <span className="text-xl font-bold text-orange-600">
              {totalCodes}
            </span>
            Pendentes
          </button>
          <button
            onClick={() => setActiveFilter('precificados')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-colors bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
          >
            <span className="text-xl font-bold text-green-400">
              {completedByMe}
            </span>
            Precificados
          </button>
        </div>
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Todos os códigos foram precificados!
              </h3>
              <p className="text-sm text-green-800 mb-4">
                Você preencheu {completedByMe} código(s) para a praça {user?.plaza}
              </p>
              <p className="text-xs text-green-700">
                Aguarde novos códigos serem adicionados pelo Master
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gradient header banner */}
      <div
        className="rounded-xl p-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Precificação</h2>
            <p className="text-white/80 text-sm mt-1">
              Defina preços de repasse e venda para praça {user?.plaza}
            </p>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveFilter('pendentes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-colors ${
            activeFilter === 'pendentes'
              ? 'bg-orange-50 border-orange-400 text-orange-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
          }`}
        >
          <span className={`text-xl font-bold ${activeFilter === 'pendentes' ? 'text-orange-600' : 'text-orange-400'}`}>
            {totalCodes}
          </span>
          Pendentes
        </button>
        <button
          onClick={() => setActiveFilter('precificados')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-colors ${
            activeFilter === 'precificados'
              ? 'bg-green-50 border-green-400 text-green-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
          }`}
        >
          <span className={`text-xl font-bold ${activeFilter === 'precificados' ? 'text-green-600' : 'text-green-400'}`}>
            {completedByMe}
          </span>
          Precificados
        </button>
      </div>

      {/* Tabela de códigos para precificar */}
      {activeFilter === 'pendentes' && (
        totalCodes > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Códigos para Precificação - Praça {user?.plaza}</CardTitle>
            <CardDescription>
              Preencha os valores de repasse e venda para cada código de serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendentesGrouped.hasGroups ? (
              <div className="space-y-4">
                {pendentesGrouped.groupNames.map((groupName) => {
                  const groupCodes = pendentesGrouped.grouped[groupName];
                  const isUngrouped = groupName === UNGROUPED_KEY;
                  const displayName = isUngrouped ? 'Sem Grupo' : groupName;

                  return (
                    <Collapsible key={groupName}>
                      <div className="border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex items-center justify-between w-full px-8 py-6 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left group border-l-4 border-l-indigo-500"
                            aria-label={`Grupo ${displayName}, ${groupCodes.length} serviço(s)`}
                          >
                            <div className="flex items-center gap-4">
                              <FolderOpen className="w-8 h-8 text-indigo-600" />
                              <span className="font-bold text-2xl text-gray-900">{displayName}</span>
                              <Badge variant="outline" className="text-base px-4 py-1.5 font-semibold border-indigo-300 text-indigo-700 bg-white">
                                {groupCodes.length} serviço(s)
                              </Badge>
                            </div>
                            <ChevronDown className="w-7 h-7 text-indigo-500 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-4 p-4">
                            {groupCodes.map((code) => renderPendingCodeCard(code))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {relevantCodes.map((code) => renderPendingCodeCard(code))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum código pendente de precificação
              </h3>
              <p className="text-sm text-gray-600">
                Aguarde o Master adicionar novos códigos para precificação
              </p>
            </div>
          </CardContent>
        </Card>
      )
      )}

      {/* Precificados */}
      {activeFilter === 'precificados' && (
        completedByMe > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Códigos Precificados — Praça {user?.plaza}</CardTitle>
              <CardDescription>
                Serviços que já possuem preços definidos por você
              </CardDescription>
            </CardHeader>
            <CardContent>
              {precificadosGrouped.hasGroups ? (
                <div className="space-y-4">
                  {precificadosGrouped.groupNames.map((groupName) => {
                    const groupCodes = precificadosGrouped.grouped[groupName];
                    const isUngrouped = groupName === UNGROUPED_KEY;
                    const displayName = isUngrouped ? 'Sem Grupo' : groupName;

                    return (
                      <Collapsible key={groupName}>
                        <div className="border-2 border-green-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <CollapsibleTrigger asChild>
                            <button
                              className="flex items-center justify-between w-full px-8 py-6 bg-green-50 hover:bg-green-100 transition-colors text-left group border-l-4 border-l-green-500"
                              aria-label={`Grupo ${displayName}, ${groupCodes.length} serviço(s)`}
                            >
                              <div className="flex items-center gap-4">
                                <FolderOpen className="w-8 h-8 text-green-600" />
                                <span className="font-bold text-2xl text-gray-900">{displayName}</span>
                                <Badge variant="outline" className="text-base px-4 py-1.5 font-semibold border-green-300 text-green-700 bg-white">
                                  {groupCodes.length} serviço(s)
                                </Badge>
                              </div>
                              <ChevronDown className="w-7 h-7 text-green-500 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-4 p-4">
                              {groupCodes.map((code) => renderPricedCodeCard(code))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {pricedCodes.map((code) => renderPricedCodeCard(code))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ListChecks className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum código precificado ainda
                </h3>
                <p className="text-sm text-gray-600">
                  Mude para "Pendentes" e comece a preencher os preços
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}