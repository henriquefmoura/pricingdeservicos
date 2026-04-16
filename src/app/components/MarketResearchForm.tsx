import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, TrendingUp, History, Clock, Download, ChevronDown, ChevronUp, ArrowUpDown, User, BarChart2, Filter, Target, Users, DollarSign, Layers, FolderOpen, ArrowLeft } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMarketResearchStore, PriceHistoryEntry } from '../store/marketResearchStore';
import { usePricingCodesStore, UNGROUPED_KEY } from '../store/pricingCodesStore';
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

type ActivePage = 'pesquisa' | 'historico' | 'kpi_servicos' | 'kpi_concorrentes' | 'kpi_registros' | 'kpi_media';

// Build chart data for a service: one point per date with each competitor as a key
function buildChartData(history: PriceHistoryEntry[]) {
  // Collect all dates (by day) and competitors
  const dateMap: Record<string, Record<string, number>> = {};
  const competitors = new Set<string>();

  // Only consider 'added' and 'updated' actions (not 'removed')
  const relevantHistory = [...history]
    .filter((e) => e.acao !== 'removed')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  relevantHistory.forEach((entry) => {
    const day = new Date(entry.timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    if (!dateMap[day]) dateMap[day] = {};
    dateMap[day][entry.concorrente] = entry.preco;
    competitors.add(entry.concorrente);
  });

  // Carry-forward: for each day, fill missing competitors from previous values
  const days = Object.keys(dateMap);
  const lastValues: Record<string, number> = {};
  const points = days.map((day) => {
    const point: Record<string, number | string> = { date: day };
    competitors.forEach((comp) => {
      if (dateMap[day][comp] !== undefined) {
        lastValues[comp] = dateMap[day][comp];
      }
      if (lastValues[comp] !== undefined) {
        point[comp] = lastValues[comp];
      }
    });
    return point;
  });

  return { points, competitors: Array.from(competitors) };
}

const CHART_COLORS = ['#78BE20', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

export function MarketResearchForm() {
  const { user } = useAuthStore();
  const { codes } = usePricingCodesStore();
  const { researches, strategy, priceHistory, addCompetitorPrice, removeCompetitorPrice, getSuggestedPrice, getPriceHistoryByCode, exportData } = useMarketResearchStore();
  
  const [activePage, setActivePage] = useState<ActivePage>('pesquisa');
  // Per-service form state for adding competitor prices
  const [serviceFormData, setServiceFormData] = useState<Record<string, { concorrente: string; preco: string }>>({});
  // Track which service cards are expanded for adding competitors
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState<Record<string, boolean>>({});
  const [showFullHistory, setShowFullHistory] = useState(true);
  // Filter for the services list (by grupo de serviço)
  const [serviceFilter, setServiceFilter] = useState('');

  // Search state for the price history tab (by grupo de serviço)
  const [historySearchGroup, setHistorySearchGroup] = useState('');
  const [historySearchPrestador, setHistorySearchPrestador] = useState('');

  // Dropdown state for autocomplete
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showPrestadorDropdown, setShowPrestadorDropdown] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const prestadorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
      if (prestadorDropdownRef.current && !prestadorDropdownRef.current.contains(event.target as Node)) {
        setShowPrestadorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build unique group names from codes (only types allowed in market research), sorted alphabetically, max 10
  const groupSuggestions = useMemo(() => {
    const groupSet = new Set<string>();
    codes.forEach(c => {
      if ((c.tipo === 'Serviço' || c.tipo === 'Reforma') && c.grupoServico) {
        groupSet.add(c.grupoServico);
      }
    });
    const groups = Array.from(groupSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const term = historySearchGroup.trim().toLowerCase();
    if (!term) return groups.slice(0, 10);
    return groups.filter(g => g.toLowerCase().includes(term)).slice(0, 10);
  }, [codes, historySearchGroup]);

  // Build unique provider/company names from all researches, sorted alphabetically, max 10
  const prestadorSuggestions = useMemo(() => {
    const namesSet = new Set<string>();
    researches.forEach(r => {
      r.precosConcorrentes.forEach(c => namesSet.add(c.concorrente));
    });
    const names = Array.from(namesSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const term = historySearchPrestador.trim().toLowerCase();
    if (!term) return names.slice(0, 10);
    return names.filter(n => n.toLowerCase().includes(term)).slice(0, 10);
  }, [researches, historySearchPrestador]);

  // Handlers for selecting from dropdown
  const handleSelectGroup = useCallback((group: string) => {
    setHistorySearchGroup(group);
    setShowGroupDropdown(false);
  }, []);

  const handleSelectPrestador = useCallback((name: string) => {
    setHistorySearchPrestador(name);
    setShowPrestadorDropdown(false);
  }, []);

  // Pre-compute chart data for all services in the history tab
  const historyChartData = useMemo(() => {
    return researches.map((research) => {
      const serviceHistory = getPriceHistoryByCode(research.codigoAvulso);
      const { points, competitors } = buildChartData(serviceHistory);
      const suggestedPrice = getSuggestedPrice(research.codigoAvulso);
      const avgPrice =
        research.precosConcorrentes.length > 0
          ? research.precosConcorrentes.reduce((s, c) => s + c.preco, 0) /
            research.precosConcorrentes.length
          : null;
      return { research, points, competitors, suggestedPrice, avgPrice };
    });
  }, [researches, getPriceHistoryByCode, getSuggestedPrice]);

  // Build code→group lookup map for history filtering
  const codeToGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    codes.forEach(c => {
      const codeKey = c.codigoAvulso || c.codigoAtrelado || '';
      if (codeKey) map.set(codeKey, c.grupoServico || UNGROUPED_KEY);
    });
    return map;
  }, [codes]);

  // Filter history chart data based on search terms
  const hasHistorySearch = historySearchGroup.trim() !== '' || historySearchPrestador.trim() !== '';
  const filteredHistoryChartData = useMemo(() => {
    if (!hasHistorySearch) return [];
    const groupTerm = historySearchGroup.trim().toLowerCase();
    const prestadorTerm = historySearchPrestador.trim().toLowerCase();
    return historyChartData.filter(({ research }) => {
      const serviceGroup = codeToGroupMap.get(research.codigoAvulso) || UNGROUPED_KEY;
      const displayGroup = serviceGroup === UNGROUPED_KEY ? 'sem grupo' : serviceGroup.toLowerCase();
      const matchesGroup = groupTerm === '' || displayGroup.includes(groupTerm);
      const matchesPrestador = prestadorTerm === '' || research.precosConcorrentes.some(c => c.concorrente.toLowerCase().includes(prestadorTerm));
      return matchesGroup && matchesPrestador;
    });
  }, [historyChartData, hasHistorySearch, historySearchGroup, historySearchPrestador, codeToGroupMap]);

  // Group filtered history chart data by service group
  const filteredHistoryGrouped = useMemo(() => {
    const grouped: Record<string, typeof filteredHistoryChartData> = {};
    filteredHistoryChartData.forEach(item => {
      const group = codeToGroupMap.get(item.research.codigoAvulso) || UNGROUPED_KEY;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(item);
    });
    const groupNames = Object.keys(grouped).sort((a, b) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return a.localeCompare(b, 'pt-BR');
    });
    return { grouped, groupNames };
  }, [filteredHistoryChartData, codeToGroupMap]);

  // Build the full list of services from pricingCodesStore — only 'Serviço' and 'Reforma' tipos
  const allServices = useMemo(() => {
    const serviceMap = new Map<string, { code: string; name: string; unidade: string; tipo: string; grupoServico?: string }>();
    codes.forEach(c => {
      if (c.tipo !== 'Serviço' && c.tipo !== 'Reforma') return;
      const codeKey = c.codigoAvulso || c.codigoAtrelado || '';
      if (codeKey) {
        serviceMap.set(codeKey, { code: codeKey, name: c.descricao, unidade: c.unidade, tipo: c.tipo, grupoServico: c.grupoServico });
      }
    });
    const list = Array.from(serviceMap.values());
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }, [codes]);

  // Filter services by grupo de serviço name
  const filteredServices = useMemo(() => {
    const term = serviceFilter.trim().toLowerCase();
    if (!term) return allServices;
    return allServices.filter(s => {
      const group = (s.grupoServico || '').toLowerCase();
      return group.includes(term) || (term === 'sem grupo' && !s.grupoServico);
    });
  }, [allServices, serviceFilter]);

  // Group filtered services by grupoServico (same pattern as AdminPricingInterface)
  const groupedFilteredServices = useMemo(() => {
    const grouped = filteredServices.reduce<Record<string, typeof filteredServices>>((acc, service) => {
      const group = service.grupoServico || UNGROUPED_KEY;
      if (!acc[group]) acc[group] = [];
      acc[group].push(service);
      return acc;
    }, {});

    const groupNames = Object.keys(grouped).sort((a, b) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return a.localeCompare(b);
    });

    const hasGroups = groupNames.some((g) => g !== UNGROUPED_KEY);
    return { grouped, groupNames, hasGroups };
  }, [filteredServices]);

  const toggleServiceExpanded = (code: string) => {
    setExpandedServices((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const getServiceFormData = (code: string) => {
    return serviceFormData[code] || { concorrente: '', preco: '' };
  };

  const updateServiceFormData = (code: string, field: 'concorrente' | 'preco', value: string) => {
    setServiceFormData((prev) => ({
      ...prev,
      [code]: { ...getServiceFormData(code), [field]: value },
    }));
  };

  const handleAddCompetitorForService = (serviceCode: string, serviceDescricao: string) => {
    const formData = getServiceFormData(serviceCode);

    if (!formData.concorrente.trim()) {
      toast.error('Por favor, insira o nome do concorrente');
      return;
    }

    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      toast.error('Por favor, insira um preço válido');
      return;
    }

    addCompetitorPrice(
      serviceCode,
      serviceDescricao,
      formData.concorrente.trim(),
      parseFloat(formData.preco),
      user?.name || 'Admin'
    );

    // Clear only the competitor and price for this service
    setServiceFormData((prev) => ({
      ...prev,
      [serviceCode]: { concorrente: '', preco: '' },
    }));

    toast.success(`Preço do concorrente ${formData.concorrente} adicionado com sucesso!`);
  };

  const handleRemoveCompetitor = (codigoAvulso: string, competitorId: string) => {
    removeCompetitorPrice(codigoAvulso, competitorId);
    toast.success('Preço de concorrente removido');
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

  // Compute summary stats for KPI cards
  const totalServicos = allServices.length;
  const totalConcorrentes = useMemo(() => {
    const uniqueNames = new Set<string>();
    researches.forEach(r => r.precosConcorrentes.forEach(c => uniqueNames.add(c.concorrente)));
    return uniqueNames.size;
  }, [researches]);
  const totalRegistros = useMemo(() => researches.reduce((acc, r) => acc + r.precosConcorrentes.length, 0), [researches]);
  const mediaGeral = useMemo(() => {
    const all = researches.flatMap(r => r.precosConcorrentes.map(c => c.preco));
    return all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  }, [researches]);

  // Build grouped KPI data for detail views
  const kpiGroupedData = useMemo(() => {
    // Map service code -> grupoServico
    const codeToGroup = new Map<string, string>();
    codes.forEach(c => {
      const codeKey = c.codigoAvulso || c.codigoAtrelado || '';
      if (codeKey) {
        codeToGroup.set(codeKey, c.grupoServico || UNGROUPED_KEY);
      }
    });

    // Group services by grupoServico
    const servicesByGroup: Record<string, typeof allServices> = {};
    allServices.forEach(service => {
      const group = service.grupoServico || UNGROUPED_KEY;
      if (!servicesByGroup[group]) servicesByGroup[group] = [];
      servicesByGroup[group].push(service);
    });

    // Group researches by grupoServico
    const researchesByGroup: Record<string, typeof researches> = {};
    researches.forEach(r => {
      const group = codeToGroup.get(r.codigoAvulso) || UNGROUPED_KEY;
      if (!researchesByGroup[group]) researchesByGroup[group] = [];
      researchesByGroup[group].push(r);
    });

    // Get sorted group names
    const allGroupNames = [...new Set([...Object.keys(servicesByGroup), ...Object.keys(researchesByGroup)])].sort((a, b) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return a.localeCompare(b, 'pt-BR');
    });

    return { servicesByGroup, researchesByGroup, allGroupNames };
  }, [codes, allServices, researches]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div
        className="rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #001022 0%, #0a2a12 40%, #1a4a1a 70%, #78BE20 100%)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(120,190,32,0.4) 0%, transparent 50%)' }} />
        <div className="relative flex items-center gap-4">
          <div className="bg-white/15 backdrop-blur-sm p-3.5 rounded-xl border border-white/20">
            <Search className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Pesquisa de Mercado
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Registre e acompanhe preços de concorrentes para embasar a precificação dos serviços
            </p>
          </div>
        </div>
      </div>

      {/* Page selector tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActivePage('pesquisa')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activePage === 'pesquisa'
              ? 'bg-[#001022] text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
          }`}
        >
          <Search className="w-4 h-4" />
          Pesquisa de Mercado
        </button>
        <button
          onClick={() => setActivePage('historico')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activePage === 'historico'
              ? 'bg-[#78BE20] text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Histórico de Preços
        </button>
      </div>

      {/* ─── Página: Pesquisa de Mercado ─── */}
      {activePage === 'pesquisa' && <>

      {/* KPI Summary Cards — interactive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActivePage('kpi_servicos')}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-lg hover:border-[#78BE20]/50 transition-all cursor-pointer group"
        >
          <div className="p-2.5 rounded-lg bg-[#78BE20]/10 group-hover:bg-[#78BE20]/20 transition-colors">
            <Layers className="w-5 h-5 text-[#78BE20]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalServicos}</p>
            <p className="text-xs text-gray-500">Serviços Cadastrados</p>
          </div>
        </div>
        <div
          onClick={() => setActivePage('kpi_concorrentes')}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-lg hover:border-[#001022]/50 transition-all cursor-pointer group"
        >
          <div className="p-2.5 rounded-lg bg-[#001022]/10 group-hover:bg-[#001022]/20 transition-colors">
            <Users className="w-5 h-5 text-[#001022]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalConcorrentes}</p>
            <p className="text-xs text-gray-500">Concorrentes Únicos</p>
          </div>
        </div>
        <div
          onClick={() => setActivePage('kpi_registros')}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalRegistros}</p>
            <p className="text-xs text-gray-500">Preços Registrados</p>
          </div>
        </div>
        <div
          onClick={() => setActivePage('kpi_media')}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {mediaGeral > 0 ? `R$ ${mediaGeral.toFixed(2)}` : '—'}
            </p>
            <p className="text-xs text-gray-500">Preço Médio Geral</p>
          </div>
        </div>
      </div>

      {/* Serviços para Pesquisa de Mercado */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#001022]/10">
                  <Search className="w-4 h-4 text-[#001022]" />
                </div>
                Serviços para Pesquisa de Mercado
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="font-semibold text-[#78BE20]">{allServices.length}</span> serviço(s) disponíveis para precificação — adicione preços de concorrentes diretamente
              </CardDescription>
            </div>
          </div>
          {/* Filter */}
          {allServices.length > 5 && (
            <div className="mt-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  placeholder="Filtrar por grupo de serviço..."
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              {serviceFilter && (
                <p className="text-xs text-gray-500 mt-1">
                  {filteredServices.length} de {allServices.length} serviço(s)
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {allServices.length === 0
                  ? 'Nenhum serviço disponível para precificação. Adicione códigos na página de Precificação primeiro.'
                  : 'Nenhum serviço encontrado com esse filtro.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedFilteredServices.hasGroups ? (
                groupedFilteredServices.groupNames.map((groupName) => {
                  const groupServices = groupedFilteredServices.grouped[groupName];
                  const isUngrouped = groupName === UNGROUPED_KEY;
                  const displayName = isUngrouped ? 'Sem Grupo' : groupName;

                  return (
                    <Collapsible key={groupName}>
                      <div className="border-2 border-[#001022]/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex items-center justify-between w-full px-8 py-6 bg-[#001022]/5 hover:bg-[#001022]/10 transition-colors text-left group border-l-4 border-l-[#78BE20]"
                            aria-label={`Grupo ${displayName}, ${groupServices.length} serviço(s)`}
                          >
                            <div className="flex items-center gap-4">
                              <FolderOpen className="w-8 h-8 text-[#78BE20]" />
                              <span className="font-bold text-2xl text-gray-900">{displayName}</span>
                              <Badge variant="outline" className="text-base px-4 py-1.5 font-semibold border-[#78BE20]/40 text-[#78BE20] bg-white">
                                {groupServices.length} serviço(s)
                              </Badge>
                            </div>
                            <ChevronDown className="w-7 h-7 text-[#78BE20] transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-4 p-4">
                            {groupServices.map((service) => {
                              const research = researches.find((r) => r.codigoAvulso === service.code);
                              const isExpanded = expandedServices[service.code];
                              const formData = getServiceFormData(service.code);
                              const competitorCount = research?.precosConcorrentes.length || 0;

                              return (
                                <Card key={service.code} className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-[#78BE20]">
                                  <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/70 transition-colors"
                                    onClick={() => toggleServiceExpanded(service.code)}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-[#001022]">{service.name}</h4>
                                        <Badge variant="outline" className="text-xs bg-gray-50">{service.tipo}</Badge>
                                      </div>
                                      <p className="text-sm text-gray-500 mt-0.5">
                                        Código: <span className="font-mono font-medium text-[#001022]/70">{service.code}</span>
                                        {service.unidade && <> · Unidade: {service.unidade}</>}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {competitorCount > 0 && (
                                        <Badge variant="outline" className="bg-[#78BE20]/10 text-[#78BE20] border-[#78BE20]/30 font-medium">
                                          {competitorCount} concorrente(s)
                                        </Badge>
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <CardContent className="pt-0 border-t">
                                      <div className="space-y-4 pt-4">
                                        {/* Form to add competitor price — highlighted section */}
                                        <div className="p-5 bg-gradient-to-br from-[#78BE20]/10 via-white to-[#001022]/5 border-2 border-[#78BE20]/40 rounded-2xl shadow-md ring-1 ring-[#78BE20]/10">
                                          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#78BE20]/20">
                                            <div className="p-2 rounded-lg bg-[#78BE20] shadow-sm">
                                              <Plus className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                              <p className="text-base text-[#001022] font-bold">
                                                Registrar Preço de Concorrente
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Preencha o nome e o preço do concorrente para: <span className="font-semibold text-[#001022]">{service.name}</span>
                                              </p>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-sm font-bold text-[#001022] flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-[#78BE20]" />
                                                Nome do Concorrente <span className="text-red-500">*</span>
                                              </Label>
                                              <Input
                                                placeholder="Ex: Empresa ABC"
                                                value={formData.concorrente}
                                                onChange={(e) => updateServiceFormData(service.code, 'concorrente', e.target.value)}
                                                className="h-12 text-base border-2 border-[#78BE20]/30 bg-white focus:border-[#78BE20] focus:ring-[#78BE20]/20 placeholder:text-gray-400 shadow-sm"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm font-bold text-[#001022] flex items-center gap-1.5">
                                                <DollarSign className="w-4 h-4 text-[#78BE20]" />
                                                Preço Cobrado (R$) <span className="text-red-500">*</span>
                                              </Label>
                                              <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.preco}
                                                onChange={(e) => updateServiceFormData(service.code, 'preco', e.target.value)}
                                                className="h-12 text-base text-right font-semibold border-2 border-[#78BE20]/30 bg-white focus:border-[#78BE20] focus:ring-[#78BE20]/20 placeholder:text-gray-400 shadow-sm"
                                              />
                                            </div>
                                            <div className="flex items-end">
                                              <Button
                                                onClick={() => handleAddCompetitorForService(service.code, service.name)}
                                                className="w-full gap-2 h-12 text-base font-bold bg-[#78BE20] hover:bg-[#6aad1a] shadow-md"
                                                size="default"
                                              >
                                                <Plus className="w-5 h-5" />
                                                Adicionar
                                              </Button>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Competitor prices table */}
                                        {research && research.precosConcorrentes.length > 0 && (
                                          <>
                                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-[#001022]/[0.03]">
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
                                                  <TableRow className="bg-[#78BE20]/[0.07]">
                                                    <TableCell className="font-bold text-[#001022]">Média dos Concorrentes</TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell className="text-right font-bold text-[#78BE20]">
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

                                              const isHistoryExpanded = expandedHistory[research.codigoAvulso];

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
                                                    {isHistoryExpanded ? (
                                                      <ChevronUp className="w-4 h-4 text-amber-700" />
                                                    ) : (
                                                      <ChevronDown className="w-4 h-4 text-amber-700" />
                                                    )}
                                                  </button>
                                                  {isHistoryExpanded && (
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
                                                  <div className="p-4 bg-gradient-to-r from-[#78BE20]/10 to-[#001022]/10 border-2 border-[#78BE20]/40 rounded-xl shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-3">
                                                        <div className="bg-[#78BE20] p-2.5 rounded-xl shadow-sm">
                                                          <TrendingUp className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                          <p className="text-sm text-[#001022] font-semibold">
                                                            Preço Sugerido por IA
                                                          </p>
                                                          <p className="text-xs text-gray-500">
                                                            Baseado na estratégia:{' '}
                                                            <span className="font-semibold text-[#001022]">
                                                              {strategy === 'below_market' && 'Abaixo do mercado'}
                                                              {strategy === 'match_market' && 'Preço de mercado'}
                                                              {strategy === 'above_market' && 'Acima do mercado'}
                                                            </span>
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="text-right">
                                                        <Badge className="bg-[#78BE20] text-white border-0 px-4 py-1.5 text-base font-bold shadow-sm">
                                                          R$ {suggestedPrice.toFixed(2)}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </>
                                        )}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              ) : (
                filteredServices.map((service) => {
                  const research = researches.find((r) => r.codigoAvulso === service.code);
                  const isExpanded = expandedServices[service.code];
                  const formData = getServiceFormData(service.code);
                  const competitorCount = research?.precosConcorrentes.length || 0;

                  return (
                    <Card key={service.code} className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-[#78BE20]">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/70 transition-colors"
                        onClick={() => toggleServiceExpanded(service.code)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-[#001022]">{service.name}</h4>
                            <Badge variant="outline" className="text-xs bg-gray-50">{service.tipo}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Código: <span className="font-mono font-medium text-[#001022]/70">{service.code}</span>
                            {service.unidade && <> · Unidade: {service.unidade}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {competitorCount > 0 && (
                            <Badge variant="outline" className="bg-[#78BE20]/10 text-[#78BE20] border-[#78BE20]/30 font-medium">
                              {competitorCount} concorrente(s)
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 border-t">
                          <div className="space-y-4 pt-4">
                            {/* Form to add competitor price — highlighted section */}
                            <div className="p-5 bg-gradient-to-br from-[#78BE20]/10 via-white to-[#001022]/5 border-2 border-[#78BE20]/40 rounded-2xl shadow-md ring-1 ring-[#78BE20]/10">
                              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#78BE20]/20">
                                <div className="p-2 rounded-lg bg-[#78BE20] shadow-sm">
                                  <Plus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-base text-[#001022] font-bold">
                                    Registrar Preço de Concorrente
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Preencha o nome e o preço do concorrente para: <span className="font-semibold text-[#001022]">{service.name}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-bold text-[#001022] flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-[#78BE20]" />
                                    Nome do Concorrente <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Ex: Empresa ABC"
                                    value={formData.concorrente}
                                    onChange={(e) => updateServiceFormData(service.code, 'concorrente', e.target.value)}
                                    className="h-12 text-base border-2 border-[#78BE20]/30 bg-white focus:border-[#78BE20] focus:ring-[#78BE20]/20 placeholder:text-gray-400 shadow-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-bold text-[#001022] flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-[#78BE20]" />
                                    Preço Cobrado (R$) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.preco}
                                    onChange={(e) => updateServiceFormData(service.code, 'preco', e.target.value)}
                                    className="h-12 text-base text-right font-semibold border-2 border-[#78BE20]/30 bg-white focus:border-[#78BE20] focus:ring-[#78BE20]/20 placeholder:text-gray-400 shadow-sm"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    onClick={() => handleAddCompetitorForService(service.code, service.name)}
                                    className="w-full gap-2 h-12 text-base font-bold bg-[#78BE20] hover:bg-[#6aad1a] shadow-md"
                                    size="default"
                                  >
                                    <Plus className="w-5 h-5" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Competitor prices table */}
                            {research && research.precosConcorrentes.length > 0 && (
                              <>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-[#001022]/[0.03]">
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
                                      <TableRow className="bg-[#78BE20]/[0.07]">
                                        <TableCell className="font-bold text-[#001022]">Média dos Concorrentes</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-right font-bold text-[#78BE20]">
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

                                  const isHistoryExpanded = expandedHistory[research.codigoAvulso];

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
                                        {isHistoryExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-amber-700" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-amber-700" />
                                        )}
                                      </button>
                                      {isHistoryExpanded && (
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
                                      <div className="p-4 bg-gradient-to-r from-[#78BE20]/10 to-[#001022]/10 border-2 border-[#78BE20]/40 rounded-xl shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="bg-[#78BE20] p-2.5 rounded-xl shadow-sm">
                                              <TrendingUp className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                              <p className="text-sm text-[#001022] font-semibold">
                                                Preço Sugerido por IA
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Baseado na estratégia:{' '}
                                                <span className="font-semibold text-[#001022]">
                                                  {strategy === 'below_market' && 'Abaixo do mercado'}
                                                  {strategy === 'match_market' && 'Preço de mercado'}
                                                  {strategy === 'above_market' && 'Acima do mercado'}
                                                </span>
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <Badge className="bg-[#78BE20] text-white border-0 px-4 py-1.5 text-base font-bold shadow-sm">
                                              R$ {suggestedPrice.toFixed(2)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico Completo de Preços — visível apenas para master */}
      {priceHistory.length > 0 && user?.role === 'master' && (
        <Card className="border border-[#001022]/10 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-[#001022]/[0.03] to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-100">
                    <History className="w-4 h-4 text-amber-700" />
                  </div>
                  Histórico Completo de Preços
                </CardTitle>
                <CardDescription className="mt-1">
                  <span className="font-semibold text-amber-700">{priceHistory.length}</span> registro(s) de alterações de preços de concorrentes
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
                  className="gap-1 border-[#78BE20]/40 text-[#78BE20] hover:bg-[#78BE20]/10"
                >
                  <Download className="w-4 h-4" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFullHistory && (
            <CardContent>
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#001022]/[0.03]">
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
              <div className="mt-4 p-3 bg-[#78BE20]/5 border border-[#78BE20]/20 rounded-xl">
                <p className="text-xs text-[#001022]/70">
                  <span className="font-semibold text-[#001022]">💾 Dados salvos localmente.</span> Todos os registros são persistidos automaticamente no navegador. 
                  Use o botão &quot;Exportar JSON&quot; para salvar uma cópia dos dados que poderá ser importada no Supabase futuramente.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      </>}

      {/* ─── Página: Histórico de Preços ─── */}
      {activePage === 'historico' && (
        <div className="space-y-6">
          {/* Search bar for filtering price history */}
          <Card className="border border-[#78BE20]/20 shadow-sm bg-gradient-to-r from-[#78BE20]/[0.03] to-transparent">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1" ref={groupDropdownRef}>
                  <Label htmlFor="history-search-group" className="text-xs text-gray-600 mb-1 block">
                    Buscar por Grupo de Serviço
                  </Label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="history-search-group"
                      placeholder="Ex: Elétrica, Hidráulica..."
                      value={historySearchGroup}
                      onChange={(e) => { setHistorySearchGroup(e.target.value); setShowGroupDropdown(true); }}
                      onFocus={() => setShowGroupDropdown(true)}
                      autoComplete="off"
                      className="pl-9"
                    />
                    {showGroupDropdown && groupSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[280px] overflow-y-auto">
                        {groupSuggestions.map((g) => (
                          <button
                            key={g}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#78BE20]/10 cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectGroup(g)}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-[#78BE20]" />
                            <span className="font-medium text-gray-900 truncate">{g}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1" ref={prestadorDropdownRef}>
                  <Label htmlFor="history-search-prestador" className="text-xs text-gray-600 mb-1 block">
                    Buscar por Prestador / Empresa
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="history-search-prestador"
                      placeholder="Ex: Construtora ABC"
                      value={historySearchPrestador}
                      onChange={(e) => { setHistorySearchPrestador(e.target.value); setShowPrestadorDropdown(true); }}
                      onFocus={() => setShowPrestadorDropdown(true)}
                      autoComplete="off"
                      className="pl-9"
                    />
                    {showPrestadorDropdown && prestadorSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[280px] overflow-y-auto">
                        {prestadorSuggestions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#78BE20]/10 cursor-pointer border-b border-gray-50 last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectPrestador(name)}
                          >
                            <span className="text-gray-900">{name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {hasHistorySearch && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setHistorySearchGroup(''); setHistorySearchPrestador(''); setShowGroupDropdown(false); setShowPrestadorDropdown(false); }}
                      className="text-xs"
                    >
                      Limpar busca
                    </Button>
                  </div>
                )}
              </div>
              {hasHistorySearch && (
                <p className="text-xs text-gray-500 mt-2">
                  {filteredHistoryChartData.length} serviço(s) encontrado(s) em {filteredHistoryGrouped.groupNames.length} grupo(s)
                </p>
              )}
            </CardContent>
          </Card>

          {!hasHistorySearch ? (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#78BE20]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Search className="w-10 h-10 text-[#78BE20]/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#001022] mb-2">
                    Busque para visualizar o histórico
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Utilize os campos acima para buscar por grupo de serviço ou prestador/empresa
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : historyChartData.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <BarChart2 className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#001022] mb-2">
                    Nenhum histórico disponível
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Adicione pesquisas de mercado na outra página para visualizar o histórico de preços
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5 border-[#78BE20]/40 text-[#78BE20] hover:bg-[#78BE20]/10"
                    onClick={() => setActivePage('pesquisa')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Ir para Pesquisa de Mercado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredHistoryChartData.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#001022] mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Tente buscar com outros termos ou limpe a busca para ver todas as opções
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistoryGrouped.groupNames.map((groupName) => {
                const groupItems = filteredHistoryGrouped.grouped[groupName];
                const isUngrouped = groupName === UNGROUPED_KEY;
                const displayGroupName = isUngrouped ? 'Sem Grupo' : groupName;
                const isGroupExpanded = expandedHistoryGroups[groupName] !== false; // default open

                return (
                  <div key={groupName} className="border-2 border-[#001022]/20 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      className="flex items-center justify-between w-full px-6 py-4 bg-[#001022]/5 hover:bg-[#001022]/10 transition-colors text-left group border-l-4 border-l-[#78BE20]"
                      onClick={() => setExpandedHistoryGroups(prev => ({ ...prev, [groupName]: !isGroupExpanded }))}
                      aria-label={`Grupo ${displayGroupName}`}
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-6 h-6 text-[#78BE20]" />
                        <span className="font-bold text-xl text-gray-900">{displayGroupName}</span>
                        <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-[#78BE20]/40 text-[#78BE20] bg-white">
                          {groupItems.length} serviço(s) precificado(s)
                        </Badge>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-[#78BE20] transition-transform ${isGroupExpanded ? '' : '-rotate-90'}`} />
                    </button>
                    {isGroupExpanded && (
                      <div className="space-y-4 p-4">
                        {groupItems.map(({ research, points, competitors, suggestedPrice, avgPrice }) => (
                          <Card key={research.codigoAvulso} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-t-[3px] border-t-[#78BE20]">
                            <CardHeader className="bg-gradient-to-r from-[#78BE20]/[0.03] to-transparent">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2 text-base">
                                    <BarChart2 className="w-5 h-5 text-[#78BE20]" />
                                    {research.descricao}
                                  </CardTitle>
                                  <CardDescription className="mt-1">Código: <span className="font-mono">{research.codigoAvulso}</span></CardDescription>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                  {avgPrice !== null && (
                                    <Badge variant="outline" className="bg-[#001022]/5 text-[#001022] border-[#001022]/20 font-medium">
                                      Média atual: R$ {avgPrice.toFixed(2)}
                                    </Badge>
                                  )}
                                  {suggestedPrice !== null && (
                                    <Badge className="bg-[#78BE20] text-white border-0 font-bold shadow-sm">
                                      Sugerido: R$ {suggestedPrice.toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                  {points.length < 2 ? (
                    <div className="text-center py-10 text-sm text-gray-500">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <History className="w-7 h-7 text-gray-300" />
                      </div>
                      {points.length === 0
                        ? 'Nenhum registro disponível para exibir o gráfico.'
                        : '1 registro disponível — é necessário pelo menos 2 datas distintas para exibir o gráfico.'}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="x" type="category" name="Data" tick={{ fontSize: 11 }} allowDuplicatedCategory={false} />
                        <YAxis
                          dataKey="y"
                          type="number"
                          name="Preço"
                          tickFormatter={(v) => `R$${v}`}
                          tick={{ fontSize: 11 }}
                          width={70}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {suggestedPrice !== null && (
                          <ReferenceLine
                            y={suggestedPrice}
                            stroke="#78BE20"
                            strokeDasharray="6 3"
                            label={{ value: 'Preço Sugerido', position: 'insideTopRight', fontSize: 11, fill: '#78BE20' }}
                          />
                        )}
                        {competitors.map((comp, idx) => (
                          <Scatter
                            key={comp}
                            name={comp}
                            data={points
                              .filter((p) => p[comp] !== undefined)
                              .map((p) => ({ x: p.date as string, y: p[comp] as number }))}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            shape="circle"
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}

                  {/* Price history table for this service */}
                  {(() => {
                    const serviceHistory = getPriceHistoryByCode(research.codigoAvulso);
                    if (serviceHistory.length === 0) return null;
                    return (
                      <div className="mt-6 border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-gradient-to-r from-[#001022]/[0.04] to-transparent border-b border-gray-200 flex items-center gap-2">
                          <div className="p-1 rounded bg-amber-100">
                            <History className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                          <span className="text-sm font-semibold text-[#001022]">
                            Histórico de Alterações ({serviceHistory.length} registro(s))
                          </span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ação</TableHead>
                              <TableHead>Concorrente</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-center">Data</TableHead>
                              <TableHead className="text-center">Registrado por</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {serviceHistory.map((entry) => {
                              const { label, color } = getActionLabel(entry.acao);
                              return (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    <Badge variant="outline" className={`text-xs ${color}`}>
                                      {label}
                                    </Badge>
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
                                    <div className="flex items-center justify-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDate(entry.timestamp)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-xs text-gray-500">
                                    <div className="flex items-center justify-center gap-1">
                                      <User className="w-3 h-3" />
                                      {entry.registradoPor}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}


        </div>
      )}

      {/* ─── Página: KPI Serviços Cadastrados ─── */}
      {activePage === 'kpi_servicos' && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setActivePage('pesquisa')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pesquisa
          </Button>
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-[#78BE20]/[0.05] to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#78BE20]/10">
                  <Layers className="w-6 h-6 text-[#78BE20]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#001022]">Serviços Cadastrados</CardTitle>
                  <CardDescription>
                    <span className="font-semibold text-[#78BE20]">{totalServicos}</span> serviço(s) — separados por grupo de serviço
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpiGroupedData.allGroupNames.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum serviço cadastrado.</p>
              ) : (
                <div className="space-y-4">
                  {kpiGroupedData.allGroupNames.map((groupName) => {
                    const groupServices = kpiGroupedData.servicesByGroup[groupName] || [];
                    if (groupServices.length === 0) return null;
                    const displayName = groupName === UNGROUPED_KEY ? 'Sem Grupo' : groupName;
                    return (
                      <Collapsible key={groupName} defaultOpen>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full px-5 py-4 bg-[#001022]/[0.03] hover:bg-[#001022]/[0.06] transition-colors text-left group border-l-4 border-l-[#78BE20]">
                              <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-[#78BE20]" />
                                <span className="font-semibold text-lg text-gray-900">{displayName}</span>
                                <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-[#78BE20]/40 text-[#78BE20] bg-white">
                                  {groupServices.length} serviço(s)
                                </Badge>
                              </div>
                              <ChevronDown className="w-5 h-5 text-[#78BE20] transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="divide-y divide-gray-100">
                              {groupServices.map((service) => (
                                <div key={service.code} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                  <div>
                                    <p className="font-medium text-[#001022]">{service.name}</p>
                                    <p className="text-xs text-gray-500">
                                      Código: <span className="font-mono">{service.code}</span>
                                      {service.unidade && <> · {service.unidade}</>}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-gray-50">{service.tipo}</Badge>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Página: KPI Concorrentes Únicos ─── */}
      {activePage === 'kpi_concorrentes' && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setActivePage('pesquisa')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pesquisa
          </Button>
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-[#001022]/[0.03] to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#001022]/10">
                  <Users className="w-6 h-6 text-[#001022]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#001022]">Concorrentes Únicos</CardTitle>
                  <CardDescription>
                    <span className="font-semibold text-[#001022]">{totalConcorrentes}</span> concorrente(s) — separados por grupo de serviço
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpiGroupedData.allGroupNames.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum concorrente registrado.</p>
              ) : (
                <div className="space-y-4">
                  {kpiGroupedData.allGroupNames.map((groupName) => {
                    const groupResearches = kpiGroupedData.researchesByGroup[groupName] || [];
                    const uniqueCompetitors = new Map<string, number[]>();
                    groupResearches.forEach(r =>
                      r.precosConcorrentes.forEach(c => {
                        if (!uniqueCompetitors.has(c.concorrente)) uniqueCompetitors.set(c.concorrente, []);
                        uniqueCompetitors.get(c.concorrente)!.push(c.preco);
                      })
                    );
                    if (uniqueCompetitors.size === 0) return null;
                    const displayName = groupName === UNGROUPED_KEY ? 'Sem Grupo' : groupName;
                    return (
                      <Collapsible key={groupName} defaultOpen>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full px-5 py-4 bg-[#001022]/[0.03] hover:bg-[#001022]/[0.06] transition-colors text-left group border-l-4 border-l-[#001022]">
                              <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-[#001022]" />
                                <span className="font-semibold text-lg text-gray-900">{displayName}</span>
                                <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-[#001022]/30 text-[#001022] bg-white">
                                  {uniqueCompetitors.size} concorrente(s)
                                </Badge>
                              </div>
                              <ChevronDown className="w-5 h-5 text-[#001022] transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="divide-y divide-gray-100">
                              {Array.from(uniqueCompetitors.entries())
                                .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
                                .map(([name, prices]) => {
                                  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
                                  return (
                                    <div key={name} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <p className="font-medium text-[#001022]">{name}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-700">
                                          {prices.length} preço(s) registrado(s)
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Média: <span className="font-semibold text-[#78BE20]">R$ {avg.toFixed(2)}</span>
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Página: KPI Preços Registrados ─── */}
      {activePage === 'kpi_registros' && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setActivePage('pesquisa')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pesquisa
          </Button>
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#001022]">Preços Registrados</CardTitle>
                  <CardDescription>
                    <span className="font-semibold text-blue-600">{totalRegistros}</span> preço(s) registrado(s) — separados por grupo de serviço
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpiGroupedData.allGroupNames.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum preço registrado.</p>
              ) : (
                <div className="space-y-4">
                  {kpiGroupedData.allGroupNames.map((groupName) => {
                    const groupResearches = kpiGroupedData.researchesByGroup[groupName] || [];
                    const totalGroupPrices = groupResearches.reduce((acc, r) => acc + r.precosConcorrentes.length, 0);
                    if (totalGroupPrices === 0) return null;
                    const displayName = groupName === UNGROUPED_KEY ? 'Sem Grupo' : groupName;
                    return (
                      <Collapsible key={groupName} defaultOpen>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full px-5 py-4 bg-blue-50/30 hover:bg-blue-50/60 transition-colors text-left group border-l-4 border-l-blue-500">
                              <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-lg text-gray-900">{displayName}</span>
                                <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-blue-300 text-blue-600 bg-white">
                                  {totalGroupPrices} preço(s)
                                </Badge>
                              </div>
                              <ChevronDown className="w-5 h-5 text-blue-600 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="divide-y divide-gray-100">
                              {groupResearches.map((research) => (
                                <div key={research.codigoAvulso} className="px-5 py-3 hover:bg-gray-50/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-medium text-[#001022]">{research.descricao}</p>
                                      <p className="text-xs text-gray-500">Código: <span className="font-mono">{research.codigoAvulso}</span></p>
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                      {research.precosConcorrentes.length} preço(s)
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {research.precosConcorrentes.map((comp) => (
                                      <div key={comp.id} className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                        <span className="text-gray-600">{comp.concorrente}:</span>
                                        <span className="font-semibold text-green-700">R$ {comp.preco.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Página: KPI Preço Médio Geral ─── */}
      {activePage === 'kpi_media' && (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setActivePage('pesquisa')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pesquisa
          </Button>
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#001022]">Preço Médio Geral</CardTitle>
                  <CardDescription>
                    Média geral: <span className="font-semibold text-emerald-600">{mediaGeral > 0 ? `R$ ${mediaGeral.toFixed(2)}` : '—'}</span> — separado por grupo de serviço
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kpiGroupedData.allGroupNames.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum dado de preço disponível.</p>
              ) : (
                <div className="space-y-4">
                  {kpiGroupedData.allGroupNames.map((groupName) => {
                    const groupResearches = kpiGroupedData.researchesByGroup[groupName] || [];
                    const allGroupPrices = groupResearches.flatMap(r => r.precosConcorrentes.map(c => c.preco));
                    if (allGroupPrices.length === 0) return null;
                    const groupAvg = allGroupPrices.reduce((a, b) => a + b, 0) / allGroupPrices.length;
                    const groupMin = Math.min(...allGroupPrices);
                    const groupMax = Math.max(...allGroupPrices);
                    const displayName = groupName === UNGROUPED_KEY ? 'Sem Grupo' : groupName;
                    return (
                      <Collapsible key={groupName} defaultOpen>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full px-5 py-4 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors text-left group border-l-4 border-l-emerald-500">
                              <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-emerald-600" />
                                <span className="font-semibold text-lg text-gray-900">{displayName}</span>
                                <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-emerald-300 text-emerald-600 bg-white">
                                  Média: R$ {groupAvg.toFixed(2)}
                                </Badge>
                              </div>
                              <ChevronDown className="w-5 h-5 text-emerald-600 transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-5">
                              {/* Group summary */}
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-500">Menor Preço</p>
                                  <p className="text-lg font-bold text-emerald-700">R$ {groupMin.toFixed(2)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-500">Preço Médio</p>
                                  <p className="text-lg font-bold text-blue-700">R$ {groupAvg.toFixed(2)}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-500">Maior Preço</p>
                                  <p className="text-lg font-bold text-red-700">R$ {groupMax.toFixed(2)}</p>
                                </div>
                              </div>
                              {/* Per-service breakdown */}
                              <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                {groupResearches.map((research) => {
                                  const prices = research.precosConcorrentes.map(c => c.preco);
                                  if (prices.length === 0) return null;
                                  const svcAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
                                  return (
                                    <div key={research.codigoAvulso} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                      <div>
                                        <p className="font-medium text-sm text-[#001022]">{research.descricao}</p>
                                        <p className="text-xs text-gray-500">
                                          Código: <span className="font-mono">{research.codigoAvulso}</span> · {prices.length} preço(s)
                                        </p>
                                      </div>
                                      <span className="font-bold text-emerald-700">R$ {svcAvg.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}