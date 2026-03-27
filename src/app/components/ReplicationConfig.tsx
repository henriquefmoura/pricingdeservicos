import { useState } from 'react';
import { Settings2, Plus, Trash2, Check, X, Power, PowerOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useReplicationConfigStore } from '../store/replicationConfigStore';
import { toast } from 'sonner';

// Lista de todas as 27 praças
const ALL_PLAZAS = [
  'SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 
  'DF', 'GO', 'MT', 'MS', 'BA', 'SE', 'AL', 
  'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'AM', 
  'PA', 'AC', 'RO', 'RR', 'AP', 'TO'
];

export function ReplicationConfig() {
  const { rules, addRule, updateRule, deleteRule, toggleRuleActive, getAllReplicatorPlazas } = useReplicationConfigStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // Form state
  const [selectedReplicator, setSelectedReplicator] = useState<string>('');
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  const replicatorPlazas = getAllReplicatorPlazas();
  const availablePlazas = ALL_PLAZAS.filter((plaza) => {
    // Se estiver editando, permitir a praça replicadora atual
    if (editingRuleId) {
      const editingRule = rules.find((r) => r.id === editingRuleId);
      if (editingRule?.replicatorPlaza === plaza) return true;
    }
    // Caso contrário, não permitir praças que já são replicadoras
    return !replicatorPlazas.includes(plaza);
  });

  const handleOpenAddDialog = () => {
    setEditingRuleId(null);
    setSelectedReplicator('');
    setSelectedTargets(new Set());
    setIsOpen(true);
  };

  const handleOpenEditDialog = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setEditingRuleId(ruleId);
      setSelectedReplicator(rule.replicatorPlaza);
      setSelectedTargets(new Set(rule.targetPlazas));
      setIsOpen(true);
    }
  };

  const handleToggleTarget = (plaza: string) => {
    const newTargets = new Set(selectedTargets);
    if (newTargets.has(plaza)) {
      newTargets.delete(plaza);
    } else {
      newTargets.add(plaza);
    }
    setSelectedTargets(newTargets);
  };

  const handleSelectAll = () => {
    const availableTargets = ALL_PLAZAS.filter((p) => p !== selectedReplicator);
    setSelectedTargets(new Set(availableTargets));
  };

  const handleDeselectAll = () => {
    setSelectedTargets(new Set());
  };

  const handleSave = () => {
    if (!selectedReplicator) {
      toast.error('Selecione uma praça replicadora');
      return;
    }

    if (selectedTargets.size === 0) {
      toast.error('Selecione pelo menos uma praça alvo');
      return;
    }

    const targetArray = Array.from(selectedTargets);

    if (editingRuleId) {
      updateRule(editingRuleId, targetArray);
      toast.success('Regra atualizada!', {
        description: `${selectedReplicator} → ${targetArray.length} praça(s)`,
      });
    } else {
      addRule(selectedReplicator, targetArray);
      toast.success('Regra criada!', {
        description: `${selectedReplicator} → ${targetArray.length} praça(s)`,
      });
    }

    setIsOpen(false);
  };

  const handleDelete = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule && confirm(`Tem certeza que deseja excluir a regra da praça ${rule.replicatorPlaza}?`)) {
      deleteRule(ruleId);
      toast.success('Regra excluída');
    }
  };

  const handleToggleActive = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    toggleRuleActive(ruleId);
    const newStatus = rule ? !rule.isActive : false;
    toast.success(newStatus ? 'Regra ativada' : 'Regra desativada');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-purple-600" />
          Configuração de Replicação de Preços
        </CardTitle>
        <CardDescription>
          Defina quais praças são replicadoras (parâmetro) e para quais praças os preços serão replicados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Regras */}
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <Settings2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Nenhuma regra configurada</p>
              <p className="text-xs mt-1">Clique em "Nova Regra" para começar</p>
            </div>
          ) : (
            rules.map((rule) => (
              <Card
                key={rule.id}
                className={`border-2 ${
                  rule.isActive ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-purple-600 text-white border-purple-600 px-3 py-1"
                        >
                          {rule.replicatorPlaza}
                        </Badge>
                        <span className="text-gray-500">→</span>
                        <span className="text-sm text-gray-600">
                          Replica para {rule.targetPlazas.length} praça(s)
                        </span>
                        {!rule.isActive && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Inativa
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rule.targetPlazas.map((plaza) => (
                          <Badge
                            key={plaza}
                            variant="outline"
                            className="text-xs text-purple-700 border-purple-300"
                          >
                            {plaza}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(rule.id)}
                        title={rule.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {rule.isActive ? (
                          <Power className="w-4 h-4 text-green-600" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditDialog(rule.id)}
                      >
                        <Settings2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Botão Adicionar */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Nova Regra de Replicação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRuleId ? 'Editar Regra de Replicação' : 'Nova Regra de Replicação'}
              </DialogTitle>
              <DialogDescription>
                Selecione a praça replicadora (parâmetro) e as praças que receberão os preços
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Seleção da Praça Replicadora */}
              <div className="space-y-2">
                <Label htmlFor="replicator">Praça Replicadora (Parâmetro)</Label>
                <Select
                  value={selectedReplicator}
                  onValueChange={setSelectedReplicator}
                  disabled={!!editingRuleId} // Não permite mudar ao editar
                >
                  <SelectTrigger id="replicator">
                    <SelectValue placeholder="Selecione a praça replicadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlazas.map((plaza) => (
                      <SelectItem key={plaza} value={plaza}>
                        {plaza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Esta praça terá seus preços replicados para as outras
                </p>
              </div>

              {/* Seleção das Praças Alvo */}
              {selectedReplicator && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Praças que receberão a replicação</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAll}
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDeselectAll}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2">
                      {ALL_PLAZAS.filter((p) => p !== selectedReplicator).map((plaza) => (
                        <button
                          key={plaza}
                          type="button"
                          onClick={() => handleToggleTarget(plaza)}
                          className={`px-3 py-2 rounded border-2 text-sm font-medium transition-all ${
                            selectedTargets.has(plaza)
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                          }`}
                        >
                          {selectedTargets.has(plaza) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {plaza}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedTargets.size} praça(s) selecionada(s)
                  </p>
                </div>
              )}

              {/* Resumo */}
              {selectedReplicator && selectedTargets.size > 0 && (
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    📋 Resumo da Regra:
                  </p>
                  <p className="text-sm text-purple-800">
                    Quando o Admin da praça <strong>{selectedReplicator}</strong> definir preços,
                    eles serão automaticamente replicados para{' '}
                    <strong>{selectedTargets.size} praça(s)</strong> e criarão aprovações para
                    os gerentes dessas praças.
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" disabled={!selectedReplicator || selectedTargets.size === 0}>
                  <Check className="w-4 h-4 mr-2" />
                  {editingRuleId ? 'Atualizar Regra' : 'Criar Regra'}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Informações */}
        <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded border border-purple-200">
          <p className="font-medium text-purple-900 mb-1">💡 Como funciona:</p>
          <ul className="space-y-1 text-purple-800">
            <li>• Defina praças "replicadoras" (parâmetro) que servirão como referência</li>
            <li>• Selecione quais praças receberão a replicação de cada praça replicadora</li>
            <li>• Quando o Admin de uma praça replicadora salvar preços, eles serão automaticamente replicados</li>
            <li>• As praças que recebem replicação terão aprovações criadas para seus gerentes</li>
            <li>• Você pode ativar/desativar regras sem excluí-las</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
