import { useState } from 'react';
import { Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useApprovalStore, PriceApproval } from '../store/approvalStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { useAuthStore } from '../store/authStore';
import { useSalesDataStore } from '../store/salesDataStore';
import { useMLBehaviorStore } from '../store/mlBehaviorStore';
import { generateMLSuggestion } from '../services/mlPricingSuggestionService';
import { MLPriceSuggestionCard } from './MLPriceSuggestion';
import { toast } from 'sonner';

interface PriceEdit {
  repasse: string;
  venda: string;
}

export function RejectedPricesEditor() {
  const { user } = useAuthStore();
  const { getRejectedApprovals, applyRejectedPrice } = useApprovalStore();
  const { codes, updateCodePrice } = usePricingCodesStore();
  const { getHistory: getSalesHistory } = useSalesDataStore();
  const { getWeights: getMLWeights, logBehavior: logMLBehavior } = useMLBehaviorStore();
  const [editingPrices, setEditingPrices] = useState<Record<string, PriceEdit>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const rejectedApprovals = getRejectedApprovals(user?.plaza);

  const handlePriceChange = (id: string, field: 'repasse' | 'venda', value: string) => {
    setEditingPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleStartEdit = (approval: PriceApproval) => {
    setEditingId(approval.id);
    setEditingPrices((prev) => ({
      ...prev,
      [approval.id]: {
        repasse: approval.proposedRepasse.toFixed(2),
        venda: approval.proposedVenda.toFixed(2),
      },
    }));
  };

  const handleCancelEdit = (id: string) => {
    setEditingId(null);
    setEditingPrices((prev) => {
      const newPrices = { ...prev };
      delete newPrices[id];
      return newPrices;
    });
  };

  const handleSavePrice = (approval: PriceApproval) => {
    if (!user?.plaza) {
      toast.error('Erro: Praça do usuário não identificada');
      return;
    }

    const input = editingPrices[approval.id];
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

    // ML behavior log: track whether user accepted or overrode the ML suggestion
    if (approval.grupoServico) {
      const ML_OVERRIDE_THRESHOLD = 0.03;
      const mlHistory = getSalesHistory(approval.grupoServico, approval.plaza);
      const mlWeights = getMLWeights(approval.grupoServico, approval.plaza);
      const mlSugg = generateMLSuggestion(
        approval.grupoServico,
        approval.plaza,
        mlHistory,
        mlWeights,
        repasse,
        approval.proposedVenda,
      );
      if (mlSugg) {
        const wasOverridden =
          Math.abs(venda - mlSugg.suggestedVenda) / mlSugg.suggestedVenda > ML_OVERRIDE_THRESHOLD;
        logMLBehavior({
          userId: user.id,
          userName: user.name,
          plaza: approval.plaza,
          grupoServico: approval.grupoServico,
          codeId: approval.codeId ?? approval.id,
          action: wasOverridden ? 'suggestion_overridden' : 'suggestion_used',
          suggestedVenda: mlSugg.suggestedVenda,
          suggestedRepasse: mlSugg.suggestedRepasse,
          actualVenda: venda,
          actualRepasse: repasse,
          vendaDeltaPercent: ((venda - mlSugg.suggestedVenda) / mlSugg.suggestedVenda) * 100,
        });
      }
    }

    // Encontrar o código correspondente
    const code = codes.find((c) => c.codigoAvulso === approval.codigo || c.codigoAtrelado === approval.codigo);
    if (!code) {
      toast.error('Código não encontrado');
      return;
    }

    // Aplicar o preço diretamente (sem nova aprovação)
    updateCodePrice(code.id, user.plaza, repasse, venda, user.name);
    
    // Atualizar a aprovação com o novo preço
    applyRejectedPrice(approval.id, repasse, venda, user.name);

    // Limpar edição
    setEditingId(null);
    setEditingPrices((prev) => {
      const newPrices = { ...prev };
      delete newPrices[approval.id];
      return newPrices;
    });

    toast.success('Preço atualizado com sucesso! 🎉', {
      description: `O novo preço de ${approval.descricao} foi aplicado em ${user.plaza}`,
    });
  };

  const calculateMargem = (id: string) => {
    const input = editingPrices[id];
    if (!input || !input.repasse || !input.venda) return null;

    const repasse = parseFloat(input.repasse);
    const venda = parseFloat(input.venda);

    if (isNaN(repasse) || isNaN(venda) || venda === 0) return null;

    return ((venda - repasse) / venda) * 100;
  };

  /** Gera sugestão ML para uma aprovação rejeitada, incorporando o preço do admin como âncora. */
  const getMLSuggestion = (approval: PriceApproval) => {
    if (!approval.grupoServico) return null;
    const mlHistory = getSalesHistory(approval.grupoServico, approval.plaza);
    const mlWeights = getMLWeights(approval.grupoServico, approval.plaza);
    const currentInput = editingPrices[approval.id];
    const currentRepasse = currentInput?.repasse ? parseFloat(currentInput.repasse) : undefined;
    return generateMLSuggestion(
      approval.grupoServico,
      approval.plaza,
      mlHistory,
      mlWeights,
      currentRepasse,
      approval.proposedVenda,
    );
  };

  if (rejectedApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum preço rejeitado
            </h3>
            <p className="text-sm text-gray-600">
              Quando você rejeitar preços replicados, eles aparecerão aqui para edição
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-5 h-5" />
            Preços Rejeitados - Edição Necessária
          </CardTitle>
          <CardDescription className="text-orange-800">
            Você rejeitou {rejectedApprovals.length} preço(s) replicado(s). Defina os preços adequados para sua praça.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {rejectedApprovals.map((approval) => {
          const isEditing = editingId === approval.id;
          const hasInput = editingPrices[approval.id];
          const margem = isEditing ? calculateMargem(approval.id) : approval.proposedMargem;

          return (
            <Card key={approval.id} className="border-2 border-orange-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                          {approval.grupo}
                        </Badge>
                        <Badge variant="outline" className="text-red-700 border-red-300">
                          Rejeitado
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {approval.descricao}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">Código:</span> {approval.codigo}
                        </span>
                        <span>
                          <span className="font-medium">Praça:</span> {approval.plaza}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preço Proposto Original (Rejeitado) */}
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-900 mb-2">
                      Preço Rejeitado (proposto por {approval.requestedBy})
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-red-700 font-medium">Repasse:</span>{' '}
                        <span className="text-red-900">R$ {approval.proposedRepasse.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-red-700 font-medium">Venda:</span>{' '}
                        <span className="text-red-900">R$ {approval.proposedVenda.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-red-700 font-medium">Margem:</span>{' '}
                        <span className="text-red-900">{approval.proposedMargem.toFixed(2)}%</span>
                      </div>
                    </div>
                    {approval.comments && (
                      <p className="text-xs text-red-800 mt-2 italic">
                        Motivo: {approval.comments}
                      </p>
                    )}
                  </div>

                  {/* Formulário de Edição */}
                  {isEditing ? (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
                      <p className="text-sm font-semibold text-blue-900">
                        Defina o novo preço para sua praça
                      </p>

                      {/* ML Suggestion Card — incorpora preço replicado + dados locais da praça */}
                      {(() => {
                        const mlSugg = getMLSuggestion(approval);
                        if (!mlSugg) return null;
                        return (
                          <MLPriceSuggestionCard
                            suggestion={mlSugg}
                            onUseVenda={(v) =>
                              handlePriceChange(approval.id, 'venda', v.toFixed(2))
                            }
                            onUseRepasse={(r) =>
                              handlePriceChange(approval.id, 'repasse', r.toFixed(2))
                            }
                            onUseBoth={(v, r) => {
                              handlePriceChange(approval.id, 'venda', v.toFixed(2));
                              handlePriceChange(approval.id, 'repasse', r.toFixed(2));
                            }}
                          />
                        );
                      })()}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`repasse-${approval.id}`}>
                            Repasse (R$) *
                          </Label>
                          <Input
                            id={`repasse-${approval.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={hasInput?.repasse || ''}
                            onChange={(e) =>
                              handlePriceChange(approval.id, 'repasse', e.target.value)
                            }
                            className="text-right"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`venda-${approval.id}`}>
                            Preço Venda (R$) *
                          </Label>
                          <Input
                            id={`venda-${approval.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={hasInput?.venda || ''}
                            onChange={(e) =>
                              handlePriceChange(approval.id, 'venda', e.target.value)
                            }
                            className="text-right"
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

                        <div className="flex items-end gap-2">
                          <Button
                            onClick={() => handleSavePrice(approval)}
                            disabled={!hasInput || !hasInput.repasse || !hasInput.venda}
                            className="flex-1 gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelEdit(approval.id)}
                            className="px-3"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleStartEdit(approval)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Definir Novo Preço
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
