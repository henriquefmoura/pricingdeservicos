import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Calculator, Download, RefreshCw, AlertCircle, CheckCircle2, Sparkles, Settings2, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PricingClimateAdvisor } from '../components/pricing-climate/PricingClimateAdvisor';
import { usePricingClimateAdvisor } from '../hooks/usePricingClimateAdvisor';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { usePricingStore } from '../store/pricingStore';
import { PricingAnalyzer } from '../utils/pricingAnalyzer';
import * as XLSX from 'xlsx';

interface SuggestedPrice {
  codigo: string;
  grupo: string;
  plazaAlvo: string;
  originalRepasse: number;
  originalVenda: number;
  originalMargem: number;
  suggestedRepasse: number;
  suggestedVenda: number;
  suggestedMargem: number;
  variation: number;
  edited: boolean;
}

export function PricingSimulator() {
  const navigate = useNavigate();
  const data = usePricingStore((state) => state.data);
  
  const [parameterPlaza, setParameterPlaza] = useState<string>('');
  const [suggestedPrices, setSuggestedPrices] = useState<SuggestedPrice[]>([]);
  const [editedPrices, setEditedPrices] = useState<Map<string, SuggestedPrice>>(new Map());
  
  // Ajustes de replicação
  const [adjustVenda, setAdjustVenda] = useState<number>(0);
  const [adjustRepasse, setAdjustRepasse] = useState<number>(0);
  const [adjustMargem, setAdjustMargem] = useState<number>(0);
  const [useVendaAdjust, setUseVendaAdjust] = useState<boolean>(false);
  const [useRepasseAdjust, setUseRepasseAdjust] = useState<boolean>(false);
  const [useMargemAdjust, setUseMargemAdjust] = useState<boolean>(false);
  
  // Controle de permissão para repasse positivo
  const [showSupervisorModal, setShowSupervisorModal] = useState<boolean>(false);
  const [supervisorCode, setSupervisorCode] = useState<string>('');
  const [repasseAuthorized, setRepasseAuthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Código do supervisor (em produção, isso viria de um backend seguro)
  const SUPERVISOR_CODE = '2024';

  // Filtros de grupos e praças por tipo de ajuste
  const [selectedGruposVenda, setSelectedGruposVenda] = useState<Set<string>>(new Set());
  const [selectedGruposRepasse, setSelectedGruposRepasse] = useState<Set<string>>(new Set());
  const [selectedGruposMargem, setSelectedGruposMargem] = useState<Set<string>>(new Set());
  
  const [selectedPlazasVenda, setSelectedPlazasVenda] = useState<Set<string>>(new Set());
  const [selectedPlazasRepasse, setSelectedPlazasRepasse] = useState<Set<string>>(new Set());
  const [selectedPlazasMargem, setSelectedPlazasMargem] = useState<Set<string>>(new Set());

  // ---- Motor de Recomendação Climática ----
  const [climateAdvisorContext, setClimateAdvisorContext] = useState<{
    serviceId: string;
    serviceName: string;
    pracaName: string;
    currentPrice: number;
  } | null>(null);

  const climateAdvisor = usePricingClimateAdvisor({
    serviceId: climateAdvisorContext?.serviceId ?? '',
    serviceName: climateAdvisorContext?.serviceName ?? '',
    pracaId: climateAdvisorContext?.pracaName ?? '',
    pracaName: climateAdvisorContext?.pracaName ?? '',
    currentPrice: climateAdvisorContext?.currentPrice ?? 0,
    enabled: climateAdvisorContext != null,
  });

  const handlePriceFieldFocus = useCallback(
    (codigo: string, grupo: string, plazaAlvo: string, currentVenda: number) => {
      setClimateAdvisorContext({
        serviceId: codigo,
        serviceName: grupo,
        pracaName: plazaAlvo,
        currentPrice: currentVenda,
      });
    },
    []
  );

  const analyzer = useMemo(() => {
    if (!data) return null;
    return new PricingAnalyzer(data);
  }, [data]);

  const parameterPlazas = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.findTop3ParameterPlazas();
  }, [analyzer]);

  const selectedParameterData = useMemo(() => {
    if (!parameterPlaza) return null;
    return parameterPlazas.find(p => p.name === parameterPlaza);
  }, [parameterPlaza, parameterPlazas]);

  // Obtém grupos únicos dos dados
  const availableGrupos = useMemo(() => {
    if (!data) return [];
    const grupos = new Set<string>();
    data.forEach(row => {
      if (row.grupo) grupos.add(row.grupo as string);
    });
    return Array.from(grupos).sort();
  }, [data]);

  // Obtém praças do grupo selecionado
  const availablePlazas = useMemo(() => {
    if (!selectedParameterData) return [];
    return selectedParameterData.dependentPlazas.map(p => p.name).sort();
  }, [selectedParameterData]);

  // Handlers para seleção de grupos
  const toggleGrupoVenda = (grupo: string) => {
    const newSet = new Set(selectedGruposVenda);
    if (newSet.has(grupo)) {
      newSet.delete(grupo);
    } else {
      newSet.add(grupo);
    }
    setSelectedGruposVenda(newSet);
  };

  const toggleAllGruposVenda = () => {
    if (selectedGruposVenda.size === availableGrupos.length) {
      setSelectedGruposVenda(new Set());
    } else {
      setSelectedGruposVenda(new Set(availableGrupos));
    }
  };

  const toggleGrupoRepasse = (grupo: string) => {
    const newSet = new Set(selectedGruposRepasse);
    if (newSet.has(grupo)) {
      newSet.delete(grupo);
    } else {
      newSet.add(grupo);
    }
    setSelectedGruposRepasse(newSet);
  };

  const toggleAllGruposRepasse = () => {
    if (selectedGruposRepasse.size === availableGrupos.length) {
      setSelectedGruposRepasse(new Set());
    } else {
      setSelectedGruposRepasse(new Set(availableGrupos));
    }
  };

  const toggleGrupoMargem = (grupo: string) => {
    const newSet = new Set(selectedGruposMargem);
    if (newSet.has(grupo)) {
      newSet.delete(grupo);
    } else {
      newSet.add(grupo);
    }
    setSelectedGruposMargem(newSet);
  };

  const toggleAllGruposMargem = () => {
    if (selectedGruposMargem.size === availableGrupos.length) {
      setSelectedGruposMargem(new Set());
    } else {
      setSelectedGruposMargem(new Set(availableGrupos));
    }
  };

  // Handlers para seleção de praças
  const togglePlazaVenda = (plaza: string) => {
    const newSet = new Set(selectedPlazasVenda);
    if (newSet.has(plaza)) {
      newSet.delete(plaza);
    } else {
      newSet.add(plaza);
    }
    setSelectedPlazasVenda(newSet);
  };

  const toggleAllPlazasVenda = () => {
    if (selectedPlazasVenda.size === availablePlazas.length) {
      setSelectedPlazasVenda(new Set());
    } else {
      setSelectedPlazasVenda(new Set(availablePlazas));
    }
  };

  const togglePlazaRepasse = (plaza: string) => {
    const newSet = new Set(selectedPlazasRepasse);
    if (newSet.has(plaza)) {
      newSet.delete(plaza);
    } else {
      newSet.add(plaza);
    }
    setSelectedPlazasRepasse(newSet);
  };

  const toggleAllPlazasRepasse = () => {
    if (selectedPlazasRepasse.size === availablePlazas.length) {
      setSelectedPlazasRepasse(new Set());
    } else {
      setSelectedPlazasRepasse(new Set(availablePlazas));
    }
  };

  const togglePlazaMargem = (plaza: string) => {
    const newSet = new Set(selectedPlazasMargem);
    if (newSet.has(plaza)) {
      newSet.delete(plaza);
    } else {
      newSet.add(plaza);
    }
    setSelectedPlazasMargem(newSet);
  };

  const toggleAllPlazasMargem = () => {
    if (selectedPlazasMargem.size === availablePlazas.length) {
      setSelectedPlazasMargem(new Set());
    } else {
      setSelectedPlazasMargem(new Set(availablePlazas));
    }
  };

  // Handler para mudança no ajuste de repasse com validação
  const handleRepasseAdjustChange = (value: number) => {
    // Não permite valores negativos
    if (value < 0) {
      return;
    }
    
    // Se for positivo e ainda não autorizado, mostra modal
    if (value > 0 && !repasseAuthorized) {
      setShowSupervisorModal(true);
      return;
    }
    
    setAdjustRepasse(value);
  };

  // Handler para toggle do checkbox de repasse
  const handleRepasseToggle = (checked: boolean) => {
    if (!checked) {
      // Desativar é sempre permitido
      setUseRepasseAdjust(false);
      setAdjustRepasse(0);
      setRepasseAuthorized(false);
      return;
    }
    
    // Para ativar com valor positivo, precisa de autorização
    if (adjustRepasse > 0 && !repasseAuthorized) {
      setShowSupervisorModal(true);
      return;
    }
    
    setUseRepasseAdjust(checked);
  };

  // Valida código do supervisor
  const handleSupervisorAuth = () => {
    if (supervisorCode === SUPERVISOR_CODE) {
      setRepasseAuthorized(true);
      setUseRepasseAdjust(true);
      setShowSupervisorModal(false);
      setSupervisorCode('');
      setAuthError('');
    } else {
      setAuthError('Código incorreto. Tente novamente.');
    }
  };

  // Cancela autorização
  const handleCancelAuth = () => {
    setShowSupervisorModal(false);
    setSupervisorCode('');
    setAuthError('');
    setAdjustRepasse(0);
    setUseRepasseAdjust(false);
  };

  const generateSuggestions = () => {
    if (!analyzer || !data || !parameterPlaza || !selectedParameterData) return;

    const suggestions: SuggestedPrice[] = [];

    // Para cada praça dependente do grupo
    selectedParameterData.dependentPlazas.forEach((dependentPlaza) => {
      const targetPlaza = dependentPlaza.name;
      const avgVariation = dependentPlaza.avgVariationVenda;
      const avgVariationRepasse = dependentPlaza.avgVariationRepasse;

      // Para cada serviço
      data.forEach((row) => {
        const paramRepasseKey = `${parameterPlaza}_Repasse`;
        const paramVendaKey = `${parameterPlaza}_Venda`;
        const paramMargemKey = `${parameterPlaza}_Margem`;

        const targetRepasseKey = `${targetPlaza}_Repasse`;
        const targetVendaKey = `${targetPlaza}_Venda`;
        const targetMargemKey = `${targetPlaza}_Margem`;

        const paramRepasse = typeof row[paramRepasseKey] === 'number' ? row[paramRepasseKey] : parseFloat(row[paramRepasseKey] as string);
        const paramVenda = typeof row[paramVendaKey] === 'number' ? row[paramVendaKey] : parseFloat(row[paramVendaKey] as string);

        const targetRepasse = typeof row[targetRepasseKey] === 'number' ? row[targetRepasseKey] : parseFloat(row[targetRepasseKey] as string);
        const targetVenda = typeof row[targetVendaKey] === 'number' ? row[targetVendaKey] : parseFloat(row[targetVendaKey] as string);
        const targetMargem = typeof row[targetMargemKey] === 'number' ? row[targetMargemKey] : parseFloat(row[targetMargemKey] as string);

        if (!isNaN(paramVenda) && !isNaN(targetVenda) && paramVenda > 0) {
          // Calcula preços base com variação histórica
          let suggestedVenda = paramVenda * (1 + avgVariation / 100);
          let suggestedRepasse = paramRepasse * (1 + avgVariationRepasse / 100);
          
          // Aplica ajustes globais se ativados
          if (useVendaAdjust) {
            suggestedVenda = suggestedVenda * (1 + adjustVenda / 100);
          }
          
          if (useRepasseAdjust) {
            suggestedRepasse = suggestedRepasse * (1 + adjustRepasse / 100);
          }
          
          // Calcula margem inicial
          let suggestedMargem = ((suggestedVenda - suggestedRepasse) / suggestedVenda) * 100;
          
          // Aplica ajuste de margem se ativado (ajusta o preço de venda para atingir a margem desejada)
          if (useMargemAdjust) {
            const targetMargem = suggestedMargem + adjustMargem;
            // Recalcula venda para atingir a margem alvo: Venda = Repasse / (1 - Margem%)
            suggestedVenda = suggestedRepasse / (1 - targetMargem / 100);
            suggestedMargem = targetMargem;
          }

          suggestions.push({
            codigo: row.codigo as string,
            grupo: row.grupo as string,
            plazaAlvo: targetPlaza,
            originalRepasse: targetRepasse || 0,
            originalVenda: targetVenda || 0,
            originalMargem: targetMargem || 0,
            suggestedRepasse,
            suggestedVenda,
            suggestedMargem,
            variation: avgVariation,
            edited: false,
          });
        }
      });
    });

    setSuggestedPrices(suggestions);
    setEditedPrices(new Map());
  };

  const handleEditPrice = (codigo: string, field: 'repasse' | 'venda', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const original = suggestedPrices.find(p => p.codigo === codigo);
    if (!original) return;

    const edited = editedPrices.get(codigo) || { ...original };
    
    if (field === 'repasse') {
      edited.suggestedRepasse = numValue;
      edited.suggestedMargem = ((edited.suggestedVenda - numValue) / edited.suggestedVenda) * 100;
    } else {
      edited.suggestedVenda = numValue;
      edited.suggestedMargem = ((numValue - edited.suggestedRepasse) / numValue) * 100;
      // Atualiza o motor de recomendação climática com o novo preço
      if (climateAdvisorContext) {
        climateAdvisor.setProposedPrice(numValue);
      }
    }
    
    edited.edited = true;
    
    const newEditedPrices = new Map(editedPrices);
    newEditedPrices.set(codigo, edited);
    setEditedPrices(newEditedPrices);
  };

  const getFinalPrice = (codigo: string): SuggestedPrice => {
    return editedPrices.get(codigo) || suggestedPrices.find(p => p.codigo === codigo)!;
  };

  const exportToExcel = () => {
    const exportData = suggestedPrices.map(price => {
      const final = getFinalPrice(price.codigo);
      return {
        'Praça Alvo': price.plazaAlvo,
        'Código': price.codigo,
        'Grupo': price.grupo,
        'Venda Original': price.originalVenda.toFixed(2),
        'Repasse Original': price.originalRepasse.toFixed(2),
        'Margem Original (%)': price.originalMargem.toFixed(2),
        'Venda Sugerida': final.suggestedVenda.toFixed(2),
        'Repasse Sugerido': final.suggestedRepasse.toFixed(2),
        'Margem Sugerida (%)': final.suggestedMargem.toFixed(2),
        'Variação Aplicada (%)': price.variation.toFixed(2),
        'Editado': final.edited ? 'Sim' : 'Não',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Preços Sugeridos');

    // Auto-ajusta largura das colunas
    const maxWidth = 20;
    const cols = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
    ws['!cols'] = cols;

    XLSX.writeFile(wb, `precos_grupo_${parameterPlaza}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!data || !analyzer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Nenhum dado carregado</CardTitle>
            <CardDescription>
              Faça upload de um arquivo Excel na página inicial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = useMemo(() => {
    if (suggestedPrices.length === 0) return null;

    const totalEdited = Array.from(editedPrices.values()).filter(p => p.edited).length;
    const avgDifference = suggestedPrices.reduce((acc, p) => {
      const final = getFinalPrice(p.codigo);
      const diff = ((final.suggestedVenda - p.originalVenda) / p.originalVenda) * 100;
      return acc + Math.abs(diff);
    }, 0) / suggestedPrices.length;

    return {
      total: suggestedPrices.length,
      edited: totalEdited,
      avgDifference,
    };
  }, [suggestedPrices, editedPrices]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Gradient header */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analysis')}
              className="text-white hover:bg-white/10 border border-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="bg-white/20 p-3 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Simulador de Precificação</h2>
              <p className="text-white/80 text-sm mt-1">Use as praças parâmetro para sugerir preços automaticamente</p>
            </div>
          </div>
        </div>
        {/* Configuração */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Configuração do Simulador
            </CardTitle>
            <CardDescription>
              Selecione uma praça parâmetro e uma praça alvo para gerar sugestões de preço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Praça Parâmetro */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Selecione a Praça Parâmetro (Referência)
                </label>
                <Select value={parameterPlaza} onValueChange={setParameterPlaza}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Escolha uma das 3 praças parâmetro" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterPlazas.map((plaza) => (
                      <SelectItem key={plaza.name} value={plaza.name}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plaza.name}</span>
                          {plaza.name === 'SP' && (
                            <Badge className="bg-blue-600 text-xs">Principal</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {plaza.dependentPlazas.length} praças no grupo
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  As 3 praças parâmetro foram identificadas automaticamente pela IA
                </p>
              </div>

              {/* Informações do Grupo Selecionado */}
              {selectedParameterData && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    📋 Grupo da Praça {selectedParameterData.name}
                  </h4>
                  
                  {selectedParameterData.dependentPlazas.length > 0 ? (
                    <>
                      <p className="text-sm text-blue-800 mb-3">
                        Este grupo contém <strong>{selectedParameterData.dependentPlazas.length} praças</strong> que serão precificadas automaticamente com base em {selectedParameterData.name}:
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedParameterData.dependentPlazas.map((dep) => (
                          <div
                            key={dep.name}
                            className="flex items-center justify-between text-sm p-2 bg-white rounded border"
                          >
                            <span className="font-medium text-gray-700">{dep.name}</span>
                            <Badge
                              variant="outline"
                              className={
                                Math.abs(dep.avgVariationVenda) < 10
                                  ? 'text-green-600 border-green-600 text-xs'
                                  : Math.abs(dep.avgVariationVenda) < 20
                                  ? 'text-orange-600 border-orange-600 text-xs'
                                  : 'text-red-600 border-red-600 text-xs'
                              }
                            >
                              {dep.avgVariationVenda > 0 ? '+' : ''}
                              {dep.avgVariationVenda.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Score Médio</p>
                          <p className="text-lg font-bold text-blue-900">
                            {selectedParameterData.score.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Var. Média</p>
                          <p className="text-lg font-bold text-blue-900">
                            {(selectedParameterData.dependentPlazas.reduce((acc, p) => acc + Math.abs(p.avgVariationVenda), 0) / selectedParameterData.dependentPlazas.length).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Mín. Variação</p>
                          <p className="text-lg font-bold text-green-700">
                            {Math.min(...selectedParameterData.dependentPlazas.map(p => p.avgVariationVenda)).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium mb-1">Máx. Variação</p>
                          <p className="text-lg font-bold text-orange-700">
                            {Math.max(...selectedParameterData.dependentPlazas.map(p => p.avgVariationVenda)).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-blue-800">
                      Esta praça parâmetro não possui praças dependentes no grupo.
                    </p>
                  )}
                </div>
              )}

              {/* Ajustes Globais de Replicação */}
              {selectedParameterData && selectedParameterData.dependentPlazas.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="w-5 h-5 text-orange-700" />
                    <h4 className="font-semibold text-orange-900">
                      ⚙️ Ajustes Globais de Replicação
                    </h4>
                  </div>
                  
                  <p className="text-sm text-orange-800 mb-4">
                    Aplique ajustes percentuais adicionais SOBRE as variações históricas. 
                    Útil para políticas comerciais, inflação ou ajustes sazonais.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ajuste de Venda */}
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-900">
                          Ajuste de Venda
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useVendaAdjust}
                            onChange={(e) => setUseVendaAdjust(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs text-gray-600">Ativar</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={adjustVenda}
                          onChange={(e) => setAdjustVenda(parseFloat(e.target.value) || 0)}
                          disabled={!useVendaAdjust}
                          className={`flex-1 px-3 py-2 text-center text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            useVendaAdjust ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'
                          }`}
                        />
                        <span className="text-lg font-bold text-gray-700">%</span>
                      </div>
                      
                      {useVendaAdjust && (
                        <p className="mt-2 text-xs text-gray-600">
                          Exemplo: +5% aumentará todos os preços de venda em 5%
                        </p>
                      )}

                      {/* Filtros de Venda */}
                      {useVendaAdjust && (
                        <div className="mt-4 pt-3 border-t space-y-3">
                          <p className="text-xs font-semibold text-gray-700">🎯 Filtros de Aplicação:</p>
                          
                          {/* Filtro de Grupos */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-gray-700">Grupos de Serviços</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllGruposVenda}
                                className="h-6 text-xs"
                              >
                                {selectedGruposVenda.size === availableGrupos.length ? 'Desmarcar' : 'Selecionar'} Todos
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-50 rounded border">
                              {availableGrupos.map(grupo => (
                                <label key={grupo} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedGruposVenda.has(grupo)}
                                    onChange={() => toggleGrupoVenda(grupo)}
                                    className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-xs text-gray-700">{grupo}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedGruposVenda.size} de {availableGrupos.length} selecionados
                            </p>
                          </div>

                          {/* Filtro de Praças */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-gray-700">Praças do Grupo</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllPlazasVenda}
                                className="h-6 text-xs"
                              >
                                {selectedPlazasVenda.size === availablePlazas.length ? 'Desmarcar' : 'Selecionar'} Todas
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-50 rounded border">
                              {availablePlazas.map(plaza => (
                                <label key={plaza} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedPlazasVenda.has(plaza)}
                                    onChange={() => togglePlazaVenda(plaza)}
                                    className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-xs text-gray-700">{plaza}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedPlazasVenda.size} de {availablePlazas.length} selecionadas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ajuste de Repasse */}
                    <div className="bg-white p-4 rounded-lg border-2 border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                          Ajuste de Repasse
                          <Shield className="w-4 h-4 text-red-600" />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useRepasseAdjust}
                            onChange={(e) => handleRepasseToggle(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs text-gray-600">Ativar</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={adjustRepasse}
                          onChange={(e) => handleRepasseAdjustChange(parseFloat(e.target.value) || 0)}
                          disabled={!useRepasseAdjust}
                          className={`flex-1 px-3 py-2 text-center text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            useRepasseAdjust ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'
                          }`}
                        />
                        <span className="text-lg font-bold text-gray-700">%</span>
                      </div>
                      
                      {/* Alerta de Restrição */}
                      <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-red-800">
                            <p className="font-semibold mb-1">Restrições de Segurança:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>❌ Valores negativos: <strong>bloqueados</strong></li>
                              <li>✅ Valores positivos: requerem <strong>código do supervisor</strong></li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {repasseAuthorized && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="text-xs text-green-800 font-medium">
                            Autorizado pelo supervisor
                          </p>
                        </div>
                      )}

                      {/* Filtros de Repasse */}
                      {useRepasseAdjust && repasseAuthorized && (
                        <div className="mt-4 pt-3 border-t space-y-3">
                          <p className="text-xs font-semibold text-gray-700">🎯 Filtros de Aplicação:</p>
                          
                          {/* Filtro de Grupos */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-gray-700">Grupos de Serviços</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllGruposRepasse}
                                className="h-6 text-xs"
                              >
                                {selectedGruposRepasse.size === availableGrupos.length ? 'Desmarcar' : 'Selecionar'} Todos
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-50 rounded border">
                              {availableGrupos.map(grupo => (
                                <label key={grupo} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedGruposRepasse.has(grupo)}
                                    onChange={() => toggleGrupoRepasse(grupo)}
                                    className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-xs text-gray-700">{grupo}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedGruposRepasse.size} de {availableGrupos.length} selecionados
                            </p>
                          </div>

                          {/* Filtro de Praças */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-gray-700">Praças do Grupo</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllPlazasRepasse}
                                className="h-6 text-xs"
                              >
                                {selectedPlazasRepasse.size === availablePlazas.length ? 'Desmarcar' : 'Selecionar'} Todas
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-50 rounded border">
                              {availablePlazas.map(plaza => (
                                <label key={plaza} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedPlazasRepasse.has(plaza)}
                                    onChange={() => togglePlazaRepasse(plaza)}
                                    className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-xs text-gray-700">{plaza}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedPlazasRepasse.size} de {availablePlazas.length} selecionadas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ajuste de Margem */}
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-900">
                          Ajuste de Margem
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useMargemAdjust}
                            onChange={(e) => setUseMargemAdjust(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs text-gray-600">Ativar</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={adjustMargem}
                          onChange={(e) => setAdjustMargem(parseFloat(e.target.value) || 0)}
                          disabled={!useMargemAdjust}
                          className={`flex-1 px-3 py-2 text-center text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            useMargemAdjust ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'
                          }`}
                        />
                        <span className="text-lg font-bold text-gray-700">pp</span>
                      </div>
                      
                      {useMargemAdjust && (
                        <p className="mt-2 text-xs text-gray-600">
                          Exemplo: +2pp aumentará a margem em 2 pontos percentuais
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preview do Impacto */}
                  {(useVendaAdjust || useRepasseAdjust || useMargemAdjust) && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-orange-300">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        📊 Preview do Impacto dos Ajustes:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {useVendaAdjust && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600">Venda</Badge>
                            <span className="text-gray-700">
                              Histórico {adjustVenda > 0 ? '+' : ''}{adjustVenda}% adicional
                            </span>
                          </div>
                        )}
                        {useRepasseAdjust && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">Repasse</Badge>
                            <span className="text-gray-700">
                              Histórico {adjustRepasse > 0 ? '+' : ''}{adjustRepasse}% adicional
                            </span>
                          </div>
                        )}
                        {useMargemAdjust && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-600">Margem</Badge>
                            <span className="text-gray-700">
                              {adjustMargem > 0 ? '+' : ''}{adjustMargem}pp sobre a margem calculada
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botão Gerar */}
              <Button
                onClick={generateSuggestions}
                disabled={!parameterPlaza || !selectedParameterData || selectedParameterData.dependentPlazas.length === 0}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Preços para Todas as {selectedParameterData?.dependentPlazas.length || 0} Praças do Grupo
              </Button>

              {!selectedParameterData?.dependentPlazas.length && parameterPlaza && (
                <p className="text-sm text-orange-600 text-center">
                  ⚠️ Esta praça parâmetro não possui praças dependentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {suggestedPrices.length > 0 && stats && (
          <>
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo das Sugestões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1">Total de Serviços</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">Serviços Editados</p>
                    <p className="text-3xl font-bold text-green-900">{stats.edited}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 mb-1">Diferença Média</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.avgDifference.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={exportToExcel} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar para Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Preços Sugeridos + Motor de Recomendação Climática */}
            <div className="flex gap-4 items-start">
              {/* Tabela */}
              <div className="flex-1 min-w-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Preços Sugeridos (Editáveis)</CardTitle>
                    <CardDescription>
                      Clique em um preço para editá-lo. Os valores em verde são sugestões automáticas, amarelo são editados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead>Praça</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Grupo</TableHead>
                            <TableHead className="text-right">Venda Atual</TableHead>
                            <TableHead className="text-right">Repasse Atual</TableHead>
                            <TableHead className="text-right">Margem Atual</TableHead>
                            <TableHead className="text-right bg-green-50">Venda Sugerida</TableHead>
                            <TableHead className="text-right bg-green-50">Repasse Sugerido</TableHead>
                            <TableHead className="text-right bg-green-50">Margem Sugerida</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suggestedPrices.map((price, idx) => {
                            const final = getFinalPrice(price.codigo + price.plazaAlvo);
                            const difference = ((final.suggestedVenda - price.originalVenda) / price.originalVenda) * 100;
                            
                            return (
                              <TableRow key={`${price.codigo}-${price.plazaAlvo}`}>
                                <TableCell className="font-medium text-sm">
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    {price.plazaAlvo}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{price.codigo}</TableCell>
                                <TableCell className="text-sm">{price.grupo}</TableCell>
                                <TableCell className="text-right text-sm">
                                  R$ {price.originalVenda.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-gray-600">
                                  R$ {price.originalRepasse.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-gray-600">
                                  {price.originalMargem.toFixed(1)}%
                                </TableCell>
                                <TableCell className={`text-right ${final.edited ? 'bg-yellow-50' : 'bg-green-50'}`}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={final.suggestedVenda.toFixed(2)}
                                    onChange={(e) => handleEditPrice(price.codigo + price.plazaAlvo, 'venda', e.target.value)}
                                    onFocus={() => handlePriceFieldFocus(price.codigo, price.grupo, price.plazaAlvo, price.originalVenda)}
                                    className="w-24 px-2 py-1 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </TableCell>
                                <TableCell className={`text-right ${final.edited ? 'bg-yellow-50' : 'bg-green-50'}`}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={final.suggestedRepasse.toFixed(2)}
                                    onChange={(e) => handleEditPrice(price.codigo + price.plazaAlvo, 'repasse', e.target.value)}
                                    className="w-24 px-2 py-1 text-sm text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </TableCell>
                                <TableCell className={`text-right text-sm ${final.edited ? 'bg-yellow-50' : 'bg-green-50'}`}>
                                  {final.suggestedMargem.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant="outline"
                                    className={
                                      Math.abs(difference) < 5
                                        ? 'text-green-600 border-green-600'
                                        : Math.abs(difference) < 15
                                        ? 'text-orange-600 border-orange-600'
                                        : 'text-red-600 border-red-600'
                                    }
                                  >
                                    {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {final.edited ? (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                      Editado
                                    </Badge>
                                  ) : (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Painel de Inteligência Climática */}
              {climateAdvisorContext && (
                <div className="sticky top-4 shrink-0" style={{ width: '440px' }}>
                  <PricingClimateAdvisor
                    output={climateAdvisor.output}
                    weather={climateAdvisor.weather}
                    sensitivity={climateAdvisor.sensitivity}
                    loading={climateAdvisor.loadingWeather}
                    computing={climateAdvisor.computing}
                    error={climateAdvisor.error}
                    onRefresh={climateAdvisor.refreshWeather}
                  />
                </div>
              )}
            </div>

            {/* Instruções */}
            <Card className="border-2 border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-purple-900">💡 Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-purple-900">
                <p>
                  <strong>1. Geração Automática:</strong> Ao selecionar uma praça parâmetro (como {parameterPlaza}), o sistema automaticamente gera preços sugeridos para TODAS as {selectedParameterData?.dependentPlazas.length || 0} praças do grupo, aplicando a variação histórica específica de cada praça.
                </p>
                <p>
                  <strong>2. Variação Individualizada:</strong> Cada praça do grupo tem sua própria variação histórica. Por exemplo, se uma praça tem +15% e outra tem +8%, essas variações específicas são aplicadas aos preços da praça parâmetro.
                </p>
                <p>
                  <strong>3. Edição Manual:</strong> Você pode ajustar qualquer preço clicando nos campos de Venda ou Repasse. A margem é recalculada automaticamente. Preços editados ficam destacados em amarelo.
                </p>
                <p>
                  <strong>4. Exportação:</strong> O botão "Exportar para Excel" gera uma planilha com:
                  • Praça alvo • Código do serviço • Preços originais vs sugeridos • Variação aplicada • Indicador de edição manual
                </p>
                <p>
                  <strong>5. Próximas Funcionalidades:</strong> Em breve, você poderá adicionar variáveis adicionais como:
                  • Custo operacional por praça • Demanda regional • Concorrência local • Sazonalidade
                  para refinar ainda mais as sugestões de preço com machine learning.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal de Autorização de Repasse */}
      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Atenção!</CardTitle>
              <CardDescription>
                Para aplicar ajustes positivos em repasse, é necessário autorização do supervisor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Insira o código do supervisor:
                </label>
                <input
                  type="text"
                  value={supervisorCode}
                  onChange={(e) => setSupervisorCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {authError && (
                  <p className="text-sm text-red-600">
                    {authError}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleCancelAuth}
                  variant="outline"
                  className="mr-2"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSupervisorAuth}
                  className="bg-red-600 text-white"
                >
                  Autorizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}