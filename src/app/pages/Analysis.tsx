import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, Target, BarChart3, ArrowRight, FileSpreadsheet, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { usePricingStore } from '../store/pricingStore';
import { useCorrelationStore } from '../store/correlationStore';
import { PricingAnalyzer } from '../utils/pricingAnalyzer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

export function Analysis() {
  const navigate = useNavigate();
  const data = usePricingStore((state) => state.data);
  const { setParameterPlazas } = useCorrelationStore();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  // Todos os hooks DEVEM vir ANTES de qualquer return condicional
  const analyzer = useMemo(() => {
    if (!data) return null;
    return new PricingAnalyzer(data);
  }, [data]);

  const plazaStats = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getPlazaStats();
  }, [analyzer]);

  const parameterPlazas = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.findTop3ParameterPlazas();
  }, [analyzer]);

  // Salvar praças parâmetro no store quando elas mudarem
  useEffect(() => {
    if (parameterPlazas.length > 0) {
      setParameterPlazas(parameterPlazas);
    }
  }, [parameterPlazas, setParameterPlazas]);

  const topCorrelations = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getAllCorrelations().slice(0, 15);
  }, [analyzer]);

  // Comparação com São Paulo
  const saoPauloComparison = useMemo(() => {
    if (!analyzer) return [];
    const allCorrelations = analyzer.getAllCorrelations();
    const spComparisons = allCorrelations.filter(
      (corr) => corr.plaza1 === 'SP' || corr.plaza2 === 'SP'
    );

    const result = spComparisons.map((corr) => {
      const otherPlaza = corr.plaza1 === 'SP' ? corr.plaza2 : corr.plaza1;
      const isPlaza1SP = corr.plaza1 === 'SP';
      
      return {
        name: otherPlaza,
        variacaoVenda: isPlaza1SP ? -corr.avgVariationVenda : corr.avgVariationVenda,
        variacaoRepasse: isPlaza1SP ? -corr.avgVariationRepasse : corr.avgVariationRepasse,
        variacaoMargem: isPlaza1SP ? -corr.avgVariationMargem : corr.avgVariationMargem,
        score: corr.correlationScore,
      };
    });

    return result.sort((a, b) => Math.abs(a.variacaoVenda) - Math.abs(b.variacaoVenda));
  }, [analyzer]);

  const avgPriceData = useMemo(() => {
    return plazaStats
      .sort((a, b) => b.avgVenda - a.avgVenda)
      .slice(0, 10)
      .map((stat) => ({
        name: stat.name.length > 15 ? stat.name.substring(0, 15) + '...' : stat.name,
        fullName: stat.name,
        venda: parseFloat(stat.avgVenda.toFixed(2)),
        repasse: parseFloat(stat.avgRepasse.toFixed(2)),
        margem: parseFloat(stat.avgMargem.toFixed(2)),
      }));
  }, [plazaStats]);

  const correlationScatterData = useMemo(() => {
    return topCorrelations.map((corr) => ({
      name: `${corr.plaza1} x ${corr.plaza2}`,
      variation: parseFloat(corr.avgVariationVenda.toFixed(2)),
      consistency: parseFloat(corr.correlationScore.toFixed(2)),
      stdDev: parseFloat(corr.stdDeviationVenda.toFixed(2)),
    }));
  }, [topCorrelations]);

  // Agora sim, podemos fazer o early return DEPOIS de todos os hooks
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Nenhum dado carregado</CardTitle>
            <CardDescription>
              Você precisa fazer upload de um arquivo Excel primeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/home')} className="w-full">
              Voltar para Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl text-gray-900">Análise de Precificação</h1>
                <p className="text-sm text-gray-600">
                  {plazaStats.length} praças • {data.length} serviços
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/metrics')}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Métricas Detalhadas
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/simulator')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Simulador de Preços
              </Button>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Análise Completa
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Praças Parâmetro */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-blue-900">3 Praças-Parâmetro Identificadas Automaticamente</CardTitle>
            </div>
            <CardDescription>
              A IA selecionou 3 praças (incluindo SP) para servir como referência. Todas as outras praças foram agrupadas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parameterPlazas.length === 3 ? (
              <>
                {/* Resumo estatístico */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  {parameterPlazas.map((param) => (
                    <div key={param.name} className="bg-white rounded-lg p-4 border-2 border-blue-300">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{param.name}</h4>
                        {param.name === 'SP' && (
                          <Badge className="bg-blue-600">Principal</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Praças no grupo:</span>
                          <span className="font-semibold">{param.dependentPlazas.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score médio:</span>
                          <span className="font-semibold">{param.score.toFixed(1)}</span>
                        </div>
                        {param.dependentPlazas.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Var. média:</span>
                            <span className="font-semibold">
                              {(param.dependentPlazas.reduce((acc, p) => acc + Math.abs(p.avgVariationVenda), 0) / param.dependentPlazas.length).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cards expandíveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parameterPlazas.map((param, index) => (
                    <Card
                      key={param.name}
                      className={`bg-white hover:shadow-lg transition-shadow cursor-pointer ${
                        param.name === 'SP' ? 'border-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedParameter(selectedParameter === param.name ? null : param.name)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-green-600' : 'bg-purple-600'
                            }`}>
                              {index + 1}
                            </div>
                            <CardTitle className="text-lg">{param.name}</CardTitle>
                          </div>
                          <Badge className={
                            param.score > 70 ? 'bg-green-600' : 
                            param.score > 50 ? 'bg-orange-600' : 'bg-red-600'
                          }>
                            {param.score.toFixed(1)}
                          </Badge>
                        </div>
                        <CardDescription>
                          {param.dependentPlazas.length} praças agrupadas neste parâmetro
                        </CardDescription>
                      </CardHeader>
                      {selectedParameter === param.name && (
                        <CardContent className="pt-0">
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {param.dependentPlazas.length > 0 ? (
                              param.dependentPlazas.map((dep) => (
                                <div
                                  key={dep.name}
                                  className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                >
                                  <span className="font-medium text-gray-700">{dep.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right space-y-1">
                                      <Badge
                                        variant="outline"
                                        className={
                                          Math.abs(dep.avgVariationVenda) < 10
                                            ? 'text-green-600 border-green-600'
                                            : Math.abs(dep.avgVariationVenda) < 20
                                            ? 'text-orange-600 border-orange-600'
                                            : 'text-red-600 border-red-600'
                                        }
                                      >
                                        {dep.avgVariationVenda > 0 ? '+' : ''}
                                        {dep.avgVariationVenda.toFixed(1)}%
                                      </Badge>
                                      <div className="text-xs text-gray-500">
                                        Score: {dep.consistency.toFixed(1)}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/comparison/${param.name}/${dep.name}`);
                                      }}
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                Esta praça parâmetro não tem dependentes
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Insights adicionais */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">📊 Resumo da Análise</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-600">Total de praças:</p>
                      <p className="text-xl font-bold text-gray-900">{plazaStats.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Praças parâmetro:</p>
                      <p className="text-xl font-bold text-blue-600">3</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Praças agrupadas:</p>
                      <p className="text-xl font-bold text-green-600">
                        {parameterPlazas.reduce((acc, p) => acc + p.dependentPlazas.length, 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600">Score médio geral:</p>
                      <p className="text-xl font-bold text-purple-600">
                        {(parameterPlazas.reduce((acc, p) => acc + p.score, 0) / 3).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Como usar:</strong> Use as 3 praças parâmetro como base para definir preços. 
                      As praças agrupadas em cada parâmetro podem seguir a variação percentual indicada.
                    </p>
                    <p>
                      <strong>Exemplo:</strong> Se {parameterPlazas[0]?.name} define um serviço em R$ 100, e {parameterPlazas[0]?.dependentPlazas[0]?.name} tem variação de +15%, 
                      o preço em {parameterPlazas[0]?.dependentPlazas[0]?.name} seria aproximadamente R$ 115.
                    </p>
                  </div>
                </div>
              </>
            ) : parameterPlazas.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg mb-2">Praça \"SP\" não encontrada nos dados</p>
                <p className="text-sm">Verifique se os dados contêm uma praça com o nome \"SP\"</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                Não foi possível identificar 3 praças-parâmetro. Verifique a qualidade dos dados.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs com análises */}
        <Tabs defaultValue="saopaulo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="saopaulo">Comparação com SP</TabsTrigger>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="correlations">Correlações</TabsTrigger>
            <TabsTrigger value="plazas">Todas as Praças</TabsTrigger>
          </TabsList>

          {/* Nova aba: Comparação com São Paulo */}
          <TabsContent value="saopaulo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Todas as Praças Comparadas com São Paulo
                </CardTitle>
                <CardDescription>
                  Variação percentual dos preços de venda, repasse e margem em relação a São Paulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {saoPauloComparison.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={600}>
                      <BarChart 
                        data={saoPauloComparison} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          label={{ value: 'Variação em relação a São Paulo (%)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-4 border rounded shadow-lg">
                                  <p className="font-bold mb-2">{data.name}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="flex justify-between gap-4">
                                      <span className="text-blue-600">Venda:</span>
                                      <span className="font-medium">
                                        {data.variacaoVenda > 0 ? '+' : ''}{data.variacaoVenda.toFixed(2)}%
                                      </span>
                                    </p>
                                    <p className="flex justify-between gap-4">
                                      <span className="text-green-600">Repasse:</span>
                                      <span className="font-medium">
                                        {data.variacaoRepasse > 0 ? '+' : ''}{data.variacaoRepasse.toFixed(2)}%
                                      </span>
                                    </p>
                                    <p className="flex justify-between gap-4">
                                      <span className="text-purple-600">Margem:</span>
                                      <span className="font-medium">
                                        {data.variacaoMargem > 0 ? '+' : ''}{data.variacaoMargem.toFixed(2)}pp
                                      </span>
                                    </p>
                                    <p className="flex justify-between gap-4 pt-1 border-t">
                                      <span className="text-gray-600">Consistência:</span>
                                      <span className="font-medium">{data.score.toFixed(1)}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="variacaoVenda" name="Variação Venda (%)" fill="#3b82f6" />
                        <Bar dataKey="variacaoRepasse" name="Variação Repasse (%)" fill="#10b981" />
                        <Bar dataKey="variacaoMargem" name="Variação Margem (pp)" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Tabela detalhada */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Detalhamento Numérico</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Praça</TableHead>
                            <TableHead className="text-right">Variação Venda</TableHead>
                            <TableHead className="text-right">Variação Repasse</TableHead>
                            <TableHead className="text-right">Variação Margem</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {saoPauloComparison.map((item) => (
                            <TableRow key={item.name}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    Math.abs(item.variacaoVenda) < 10
                                      ? 'text-green-600 border-green-600'
                                      : Math.abs(item.variacaoVenda) < 20
                                      ? 'text-orange-600 border-orange-600'
                                      : 'text-red-600 border-red-600'
                                  }
                                >
                                  {item.variacaoVenda > 0 ? '+' : ''}{item.variacaoVenda.toFixed(2)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    Math.abs(item.variacaoRepasse) < 10
                                      ? 'text-green-600 border-green-600'
                                      : Math.abs(item.variacaoRepasse) < 20
                                      ? 'text-orange-600 border-orange-600'
                                      : 'text-red-600 border-red-600'
                                  }
                                >
                                  {item.variacaoRepasse > 0 ? '+' : ''}{item.variacaoRepasse.toFixed(2)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={
                                    Math.abs(item.variacaoMargem) < 5
                                      ? 'text-green-600 border-green-600'
                                      : Math.abs(item.variacaoMargem) < 10
                                      ? 'text-orange-600 border-orange-600'
                                      : 'text-red-600 border-red-600'
                                  }
                                >
                                  {item.variacaoMargem > 0 ? '+' : ''}{item.variacaoMargem.toFixed(2)}pp
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  className={
                                    item.score > 70
                                      ? 'bg-green-600'
                                      : item.score > 50
                                      ? 'bg-orange-600'
                                      : 'bg-red-600'
                                  }
                                >
                                  {item.score.toFixed(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Insights */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Insights</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>
                          • <strong>{saoPauloComparison.filter(p => Math.abs(p.variacaoVenda) < 10).length} praças</strong> têm variação de venda inferior a 10% em relação a São Paulo
                        </li>
                        <li>
                          • <strong>{saoPauloComparison.filter(p => Math.abs(p.variacaoVenda) < 20).length} praças</strong> têm variação de venda inferior a 20% em relação a São Paulo
                        </li>
                        <li>
                          • Praça mais próxima: <strong>{saoPauloComparison[0]?.name}</strong> ({saoPauloComparison[0]?.variacaoVenda.toFixed(2)}% de variação)
                        </li>
                        <li>
                          • Média geral de variação: <strong>
                            {(saoPauloComparison.reduce((acc, p) => acc + Math.abs(p.variacaoVenda), 0) / saoPauloComparison.length).toFixed(2)}%
                          </strong>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg mb-2">Praça "SP" não encontrada nos dados</p>
                    <p className="text-sm">Verifique se os dados contêm uma praça com o nome "SP"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Preço Médio por Praça (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={avgPriceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-medium">{payload[0].payload.fullName}</p>
                              <p className="text-sm text-gray-600">
                                R$ {typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="venda" name="Preço Venda (R$)" fill="#3b82f6" />
                    <Bar dataKey="repasse" name="Repasse (R$)" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Correlação: Variação vs Consistência
                </CardTitle>
                <CardDescription>
                  Quanto mais próximo do eixo vertical, menor a variação. Quanto mais alto, maior a consistência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="variation"
                      name="Variação Média (%)"
                      label={{ value: 'Variação Média (%)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="consistency"
                      name="Score de Consistência"
                      label={{ value: 'Score de Consistência', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-medium text-sm mb-1">{data.name}</p>
                              <p className="text-xs text-gray-600">Variação: {data.variation}%</p>
                              <p className="text-xs text-gray-600">Consistência: {data.consistency}</p>
                              <p className="text-xs text-gray-600">Desvio Padrão: {data.stdDev}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={correlationScatterData} fill="#8b5cf6">
                      {correlationScatterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.consistency > 70 ? '#10b981' : entry.consistency > 50 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlations">
            <Card>
              <CardHeader>
                <CardTitle>Melhores Correlações Entre Praças</CardTitle>
                <CardDescription>
                  Pares de praças com maior consistência de variação de preços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praça Base</TableHead>
                      <TableHead>Praça Comparada</TableHead>
                      <TableHead className="text-right">Variação Média</TableHead>
                      <TableHead className="text-right">Desvio Padrão</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Outliers</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCorrelations.map((corr, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{corr.plaza1}</TableCell>
                        <TableCell>{corr.plaza2}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              Math.abs(corr.avgVariationVenda) < 10
                                ? 'text-green-600 border-green-600'
                                : Math.abs(corr.avgVariationVenda) < 25
                                ? 'text-orange-600 border-orange-600'
                                : 'text-red-600 border-red-600'
                            }
                          >
                            {corr.avgVariationVenda > 0 ? '+' : ''}
                            {corr.avgVariationVenda.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {corr.stdDeviationVenda.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              corr.correlationScore > 70
                                ? 'bg-green-600'
                                : corr.correlationScore > 50
                                ? 'bg-orange-600'
                                : 'bg-red-600'
                            }
                          >
                            {corr.correlationScore.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {corr.outliers}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/comparison/${corr.plaza1}/${corr.plaza2}`)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plazas">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Todas as Praças</CardTitle>
                <CardDescription>
                  Visão completa dos preços médios, mínimos e máximos por praça
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praça</TableHead>
                      <TableHead className="text-right">Preço Médio</TableHead>
                      <TableHead className="text-right">Preço Mínimo</TableHead>
                      <TableHead className="text-right">Preço Máximo</TableHead>
                      <TableHead className="text-right">Serviços</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plazaStats
                      .sort((a, b) => b.avgVenda - a.avgVenda)
                      .map((stat) => (
                        <TableRow key={stat.name}>
                          <TableCell className="font-medium">{stat.name}</TableCell>
                          <TableCell className="text-right">
                            R$ {stat.avgVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            R$ {stat.minVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            R$ {stat.maxVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {stat.serviceCount}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}