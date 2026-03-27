import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Edit3
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuthStore } from '../store/authStore';
import { useApprovalStore } from '../store/approvalStore';
import { usePricingStore } from '../store/pricingStore';
import { PricingAnalyzer } from '../utils/pricingAnalyzer';
import { RejectedPricesEditor } from '../components/RejectedPricesEditor';

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { approvals, approvePrice, rejectPrice, getPendingApprovals, getRejectedApprovals, initializeMockData } = useApprovalStore();
  const data = usePricingStore((state) => state.data);
  const [activeTab, setActiveTab] = useState('pending');

  // TODOS os hooks DEVEM vir ANTES de qualquer early return
  
  // Filtrar aprovações pendentes para a praça do usuário (se aplicável)
  const pendingApprovals = useMemo(() => {
    return getPendingApprovals(user?.plaza);
  }, [approvals, user?.plaza, getPendingApprovals]);

  // Filtrar aprovações rejeitadas para a praça do usuário
  const rejectedApprovals = useMemo(() => {
    return getRejectedApprovals(user?.plaza);
  }, [approvals, user?.plaza, getRejectedApprovals]);

  // Análise de grupos de serviço com problemas
  const problematicGroups = useMemo(() => {
    if (!data) return [];
    
    const analyzer = new PricingAnalyzer(data);
    const groups = new Map<string, { 
      grupo: string; 
      highVariation: number; 
      count: number;
      avgMargem: number;
      minMargem: number;
    }>();

    data.forEach((row) => {
      const grupo = row.grupo as string;
      if (!grupo) return;

      // Calcular variação entre praças para este serviço
      const plazas = Object.keys(row).filter(k => k.endsWith('_Venda'));
      const vendas = plazas.map(p => parseFloat(row[p] as string)).filter(v => !isNaN(v) && v > 0);
      
      if (vendas.length < 2) return;

      const max = Math.max(...vendas);
      const min = Math.min(...vendas);
      const variation = ((max - min) / min) * 100;

      // Calcular margem para a praça do usuário (se aplicável)
      let margem = 0;
      if (user?.plaza) {
        const margemKey = `${user.plaza}_Margem`;
        margem = parseFloat(row[margemKey] as string) || 0;
      }

      if (!groups.has(grupo)) {
        groups.set(grupo, { 
          grupo, 
          highVariation: 0, 
          count: 0,
          avgMargem: 0,
          minMargem: 100,
        });
      }

      const groupData = groups.get(grupo)!;
      groupData.count++;
      groupData.highVariation += variation > 30 ? 1 : 0;
      groupData.avgMargem += margem;
      groupData.minMargem = Math.min(groupData.minMargem, margem);
    });

    return Array.from(groups.values())
      .map(g => ({
        ...g,
        avgMargem: g.avgMargem / g.count,
        problematicPercentage: (g.highVariation / g.count) * 100,
      }))
      .filter(g => g.problematicPercentage > 20 || g.avgMargem < 15 || g.minMargem < 5)
      .sort((a, b) => b.problematicPercentage - a.problematicPercentage)
      .slice(0, 5);
  }, [data, user?.plaza]);

  // Estatísticas de desempenho da praça
  const plazaStats = useMemo(() => {
    if (!data || !user?.plaza) return null;

    const plaza = user.plaza;
    const repasseKey = `${plaza}_Repasse`;
    const vendaKey = `${plaza}_Venda`;
    const margemKey = `${plaza}_Margem`;

    let totalVenda = 0;
    let totalRepasse = 0;
    let margemTotal = 0;
    let count = 0;
    let margemBaixa = 0;
    let margemAlta = 0;

    data.forEach((row) => {
      const venda = parseFloat(row[vendaKey] as string);
      const repasse = parseFloat(row[repasseKey] as string);
      const margem = parseFloat(row[margemKey] as string);

      if (!isNaN(venda) && !isNaN(repasse) && venda > 0) {
        totalVenda += venda;
        totalRepasse += repasse;
        margemTotal += margem;
        count++;

        if (margem < 10) margemBaixa++;
        if (margem > 30) margemAlta++;
      }
    });

    return {
      avgVenda: totalVenda / count,
      avgRepasse: totalRepasse / count,
      avgMargem: margemTotal / count,
      totalServices: count,
      margemBaixa,
      margemAlta,
    };
  }, [data, user?.plaza]);

  const handleApprove = (id: string) => {
    approvePrice(id, user?.name || 'Usuário');
  };

  const handleReject = (id: string) => {
    rejectPrice(id, user?.name || 'Usuário', 'Rejeitado pelo usuário');
  };

  // Inicializar dados mock se não houver aprovações
  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Agora sim, early return DEPOIS de todos os hooks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">
                Bem-vindo, {user.name}
              </h1>
              <p className="text-sm text-gray-600">
                {user.role === 'admin' ? 'Administrador' : `Gerente - Praça ${user.plaza}`}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg hover:border-orange-400 transition-all duration-200"
            onClick={() => setActiveTab('pending')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600">
                  {pendingApprovals.length}
                </p>
                <Clock className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:border-green-400 transition-all duration-200"
            onClick={() => setActiveTab('approved')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-green-600">
                  {approvals.filter(a => a.status === 'approved' && (!user.plaza || a.plaza === user.plaza)).length}
                </p>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Total aprovados</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:border-red-400 transition-all duration-200"
            onClick={() => setActiveTab('rejected')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rejeitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-red-600">
                  {approvals.filter(a => a.status === 'rejected' && (!user.plaza || a.plaza === user.plaza)).length}
                </p>
                <XCircle className="w-8 h-8 text-red-600 opacity-20" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Total rejeitados</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg hover:border-yellow-400 transition-all duration-200"
            onClick={() => setActiveTab('alerts')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-yellow-600">
                  {problematicGroups.length}
                </p>
                <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-20" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Grupos em atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Desempenho da Praça */}
        {user.plaza && plazaStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Desempenho da Praça {user.plaza}
              </CardTitle>
              <CardDescription>
                Estatísticas gerais de precificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Serviços Ativos</p>
                  <p className="text-2xl font-bold text-blue-900">{plazaStats.totalServices}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Venda Média</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {plazaStats.avgVenda.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 mb-1">Repasse Médio</p>
                  <p className="text-2xl font-bold text-orange-900">
                    R$ {plazaStats.avgRepasse.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 mb-1">Margem Média</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {plazaStats.avgMargem.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 mb-1">Margem Baixa</p>
                  <p className="text-2xl font-bold text-red-900">
                    {plazaStats.margemBaixa}
                  </p>
                  <p className="text-xs text-red-600">{'<10%'}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-700 mb-1">Margem Alta</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {plazaStats.margemAlta}
                  </p>
                  <p className="text-xs text-emerald-600">{'>30%'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grupos de Serviço em Atenção */}
        {problematicGroups.length > 0 && (
          <Card className="border-2 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Grupos de Serviço em Atenção
              </CardTitle>
              <CardDescription>
                Grupos com alta variação de preços ou margens baixas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problematicGroups.map((group) => (
                  <div 
                    key={group.grupo}
                    className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{group.grupo}</h4>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                        {group.problematicPercentage.toFixed(0)}% variação alta
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Serviços</p>
                        <p className="font-bold text-gray-900">{group.count}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Margem Média</p>
                        <p className={`font-bold ${group.avgMargem < 15 ? 'text-red-600' : 'text-gray-900'}`}>
                          {group.avgMargem.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Margem Mínima</p>
                        <p className={`font-bold ${group.minMargem < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {group.minMargem.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <p className="text-xs text-yellow-800">
                        {group.problematicPercentage > 30 && 'Alta variação entre praças. '}
                        {group.avgMargem < 15 && 'Margem média abaixo do ideal. '}
                        {group.minMargem < 5 && 'Atenção: margem mínima crítica.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aprovações Pendentes e Rejeitadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {pendingApprovals.length > 0 ? (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Preços Pendentes de Aprovação
                  </CardTitle>
                  <CardDescription>
                    Revise e aprove as alterações de preço propostas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Praça</TableHead>
                          <TableHead className="text-right">Repasse Atual</TableHead>
                          <TableHead className="text-right">Venda Atual</TableHead>
                          <TableHead className="text-right">Margem Atual</TableHead>
                          <TableHead className="text-right">Repasse Proposto</TableHead>
                          <TableHead className="text-right">Venda Proposta</TableHead>
                          <TableHead className="text-right">Margem Proposta</TableHead>
                          <TableHead className="text-right">Variação</TableHead>
                          <TableHead>Solicitante</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.map((approval) => {
                          const variation = approval.variation;
                          const margemChange = approval.proposedMargem - approval.currentMargem;
                          const repasseChange = ((approval.proposedRepasse - approval.currentRepasse) / approval.currentRepasse) * 100;
                          
                          return (
                            <TableRow key={approval.id}>
                              <TableCell className="font-mono text-sm">{approval.codigo}</TableCell>
                              <TableCell className="text-sm">{approval.grupo}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  {approval.plaza}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                R$ {approval.currentRepasse.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                R$ {approval.currentVenda.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {approval.currentMargem.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <span className={repasseChange > 0 ? 'text-orange-600 font-semibold' : repasseChange < 0 ? 'text-green-600 font-semibold' : ''}>
                                  R$ {approval.proposedRepasse.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold">
                                R$ {approval.proposedVenda.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <span className={margemChange > 0 ? 'text-green-600 font-semibold' : margemChange < 0 ? 'text-red-600 font-semibold' : ''}>
                                  {approval.proposedMargem.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {approval.isNewService ? (
                                  <Badge
                                    variant="outline"
                                    className="text-blue-600 border-blue-600 bg-blue-50"
                                  >
                                    Novo
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className={
                                      variation > 0
                                        ? 'text-green-600 border-green-600'
                                        : 'text-red-600 border-red-600'
                                    }
                                  >
                                    {variation > 0 ? (
                                      <TrendingUp className="w-3 h-3 mr-1 inline" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 mr-1 inline" />
                                    )}
                                    {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {approval.requestedBy}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprove(approval.id)}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(approval.id)}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma aprovação pendente
                    </h3>
                    <p className="text-sm text-gray-600">
                      Todas as alterações de preço foram revisadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {approvals.filter(a => a.status === 'approved' && (!user.plaza || a.plaza === user.plaza)).length > 0 ? (
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Preços Aprovados
                  </CardTitle>
                  <CardDescription>
                    Histórico de alterações de preço aprovadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Praça</TableHead>
                          <TableHead className="text-right">Repasse</TableHead>
                          <TableHead className="text-right">Venda</TableHead>
                          <TableHead className="text-right">Margem</TableHead>
                          <TableHead>Aprovado Por</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvals
                          .filter(a => a.status === 'approved' && (!user.plaza || a.plaza === user.plaza))
                          .map((approval) => (
                            <TableRow key={approval.id}>
                              <TableCell className="font-mono text-sm">{approval.codigo}</TableCell>
                              <TableCell className="text-sm">{approval.descricao}</TableCell>
                              <TableCell className="text-sm">{approval.grupo}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  {approval.plaza}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                R$ {approval.proposedRepasse.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold">
                                R$ {approval.proposedVenda.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <span className="text-green-600 font-semibold">
                                  {approval.proposedMargem.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {approval.reviewedBy || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {approval.reviewedAt ? new Date(approval.reviewedAt).toLocaleDateString('pt-BR') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma aprovação registrada
                    </h3>
                    <p className="text-sm text-gray-600">
                      Aprovações aparecerão aqui após serem processadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            <RejectedPricesEditor />
          </TabsContent>

          <TabsContent value="alerts">
            {problematicGroups.length > 0 ? (
              <Card className="border-2 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Grupos de Serviço Requerendo Atenção
                  </CardTitle>
                  <CardDescription>
                    Grupos com alta variação de preços entre praças ou margens críticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {problematicGroups.map((group) => (
                      <Card key={group.grupo} className="border-2 border-yellow-300 bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg text-gray-900">{group.grupo}</h4>
                            <Badge variant="outline" className="text-yellow-700 border-yellow-700 px-3 py-1">
                              {group.problematicPercentage.toFixed(0)}% com alta variação
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-yellow-200">
                              <p className="text-xs text-gray-600 mb-1">Total de Serviços</p>
                              <p className="text-2xl font-bold text-gray-900">{group.count}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-yellow-200">
                              <p className="text-xs text-gray-600 mb-1">Margem Média</p>
                              <p className={`text-2xl font-bold ${group.avgMargem < 15 ? 'text-red-600' : 'text-gray-900'}`}>
                                {group.avgMargem.toFixed(1)}%
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-yellow-200">
                              <p className="text-xs text-gray-600 mb-1">Margem Mínima</p>
                              <p className={`text-2xl font-bold ${group.minMargem < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                {group.minMargem.toFixed(1)}%
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-yellow-200">
                              <p className="text-xs text-gray-600 mb-1">Serviços Problemáticos</p>
                              <p className="text-2xl font-bold text-yellow-700">{group.highVariation}</p>
                            </div>
                          </div>

                          <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-yellow-900 mb-2">Problemas Identificados:</p>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                  {group.problematicPercentage > 30 && (
                                    <li>• Alta variação de preços entre praças ({group.problematicPercentage.toFixed(0)}% dos serviços)</li>
                                  )}
                                  {group.avgMargem < 15 && (
                                    <li>• Margem média abaixo do ideal (recomendado: ≥15%)</li>
                                  )}
                                  {group.minMargem < 5 && (
                                    <li className="font-semibold text-red-700">• ⚠️ CRÍTICO: Margem mínima muito baixa ({group.minMargem.toFixed(1)}%)</li>
                                  )}
                                  {group.highVariation > 0 && (
                                    <li>• {group.highVariation} serviço(s) com variação superior a 30% entre praças</li>
                                  )}
                                </ul>
                                <p className="text-xs text-yellow-700 mt-3 font-medium">
                                  💡 Recomendação: Revisar precificação deste grupo e alinhar com praças parâmetro
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum alerta no momento
                    </h3>
                    <p className="text-sm text-gray-600">
                      Todos os grupos de serviço estão com precificação adequada
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}