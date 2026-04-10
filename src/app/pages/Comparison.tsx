import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
import { usePricingStore } from '../store/pricingStore';
import { PricingAnalyzer } from '../utils/pricingAnalyzer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AppLayout } from '../components/AppLayout';

export function Comparison() {
  const { plaza1, plaza2 } = useParams<{ plaza1: string; plaza2: string }>();
  const navigate = useNavigate();
  const data = usePricingStore((state) => state.data);

  const analyzer = useMemo(() => {
    if (!data) return null;
    return new PricingAnalyzer(data);
  }, [data]);

  const comparison = useMemo(() => {
    if (!analyzer || !plaza1 || !plaza2) return null;
    return analyzer.getDetailedComparison(plaza1, plaza2);
  }, [analyzer, plaza1, plaza2]);

  const correlation = useMemo(() => {
    if (!analyzer || !plaza1 || !plaza2) return null;
    return analyzer.calculateCorrelation(plaza1, plaza2);
  }, [analyzer, plaza1, plaza2]);

  if (!data || !analyzer || !plaza1 || !plaza2 || !comparison || !correlation) {
    return (
      <AppLayout activeNav="Análise" title="Comparação Detalhada" subtitle="">
        <div className="flex items-center justify-center min-h-[300px]">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Dados não encontrados</CardTitle>
              <CardDescription>
                Não foi possível carregar os dados de comparação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/analysis')} className="w-full">
                Voltar para Análise
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Análise por grupo
  const groupAnalysis = useMemo(() => {
    const groups = new Map<string, { variationsVenda: number[]; variationsRepasse: number[]; variationsMargem: number[]; count: number }>();

    comparison.forEach((item) => {
      if (!groups.has(item.grupo)) {
        groups.set(item.grupo, { variationsVenda: [], variationsRepasse: [], variationsMargem: [], count: 0 });
      }
      const group = groups.get(item.grupo)!;
      group.variationsVenda.push(item.variationVenda);
      group.variationsRepasse.push(item.variationRepasse);
      group.variationsMargem.push(item.variationMargem);
      group.count++;
    });

    return Array.from(groups.entries())
      .map(([name, data]) => ({
        name,
        avgVariationVenda: data.variationsVenda.reduce((a, b) => a + b, 0) / data.variationsVenda.length,
        avgVariationRepasse: data.variationsRepasse.reduce((a, b) => a + b, 0) / data.variationsRepasse.length,
        avgVariationMargem: data.variationsMargem.reduce((a, b) => a + b, 0) / data.variationsMargem.length,
        count: data.count,
        minVariationVenda: Math.min(...data.variationsVenda),
        maxVariationVenda: Math.max(...data.variationsVenda),
      }))
      .sort((a, b) => Math.abs(b.avgVariationVenda) - Math.abs(a.avgVariationVenda));
  }, [comparison]);

  // Distribuição de variação de venda
  const distributionData = useMemo(() => {
    const ranges = [
      { name: '< -20%', min: -Infinity, max: -20, count: 0 },
      { name: '-20% a -10%', min: -20, max: -10, count: 0 },
      { name: '-10% a 0%', min: -10, max: 0, count: 0 },
      { name: '0% a 10%', min: 0, max: 10, count: 0 },
      { name: '10% a 20%', min: 10, max: 20, count: 0 },
      { name: '> 20%', min: 20, max: Infinity, count: 0 },
    ];

    comparison.forEach((item) => {
      const range = ranges.find((r) => item.variationVenda >= r.min && item.variationVenda < r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [comparison]);

  const sortedComparison = useMemo(() => {
    return [...comparison].sort((a, b) => Math.abs(b.variationVenda) - Math.abs(a.variationVenda));
  }, [comparison]);

  return (
    <AppLayout activeNav="Análise" title="Comparação Detalhada" subtitle={`${plaza1} vs ${plaza2}`}>
      <div className="space-y-6">
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
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Comparação Detalhada</h2>
              <p className="text-white/80 text-sm mt-1">{plaza1} vs {plaza2}</p>
            </div>
          </div>
        </div>
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Variação Média - Venda</p>
                <div className="flex items-center justify-center gap-2">
                  {correlation.avgVariationVenda > 0 ? (
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  ) : correlation.avgVariationVenda < 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <p className="text-2xl font-bold">
                    {correlation.avgVariationVenda > 0 ? '+' : ''}
                    {correlation.avgVariationVenda.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Variação Média - Repasse</p>
                <div className="flex items-center justify-center gap-2">
                  {correlation.avgVariationRepasse > 0 ? (
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  ) : correlation.avgVariationRepasse < 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <p className="text-2xl font-bold">
                    {correlation.avgVariationRepasse > 0 ? '+' : ''}
                    {correlation.avgVariationRepasse.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Variação Margem (pp)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {correlation.avgVariationMargem > 0 ? '+' : ''}
                  {correlation.avgVariationMargem.toFixed(2)}pp
                </p>
                <Badge
                  className="mt-2"
                  variant={Math.abs(correlation.avgVariationMargem) < 3 ? 'default' : 'destructive'}
                >
                  {Math.abs(correlation.avgVariationMargem) < 3 ? 'Consistente' : 'Variável'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Score de Correlação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {correlation.correlationScore.toFixed(1)}
                </p>
                <Badge
                  className="mt-2"
                  variant={
                    correlation.correlationScore > 70
                      ? 'default'
                      : correlation.correlationScore > 50
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {correlation.correlationScore > 70
                    ? 'Excelente'
                    : correlation.correlationScore > 50
                    ? 'Boa'
                    : 'Regular'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legenda de Interpretação dos KPIs */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              📊 Como Interpretar os KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Variação Média */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Variação Média (%)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Indica quanto os preços de <strong>{plaza2}</strong> variam em relação a <strong>{plaza1}</strong> em média.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600 w-20">0-10%</Badge>
                    <span className="text-gray-600">Muito próximas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-600 w-20">10-20%</Badge>
                    <span className="text-gray-600">Moderadamente diferentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-red-600 border-red-600 w-20">&gt;20%</Badge>
                    <span className="text-gray-600">Muito diferentes</span>
                  </div>
                </div>
              </div>

              {/* Score de Correlação */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Score de Correlação</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Mede a <strong>CONSISTÊNCIA</strong> da variação entre praças. Score alto = padrão previsível.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 w-16">70-100</Badge>
                    <span className="text-gray-600">Excelente - Padrão muito consistente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-600 w-16">50-70</Badge>
                    <span className="text-gray-600">Boa - Padrão relativamente consistente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 w-16">&lt;50</Badge>
                    <span className="text-gray-600">Regular - Padrão inconsistente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explicação do caso atual */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                💡 Entendendo o Caso Atual
              </h4>
              <div className="space-y-2 text-sm text-yellow-900">
                <p>
                  <strong>Variação Média: {correlation.avgVariationVenda.toFixed(2)}%</strong> - 
                  {Math.abs(correlation.avgVariationVenda) < 10 
                    ? ' Os preços médios são muito próximos entre as praças.'
                    : Math.abs(correlation.avgVariationVenda) < 20
                    ? ' Os preços médios têm diferença moderada entre as praças.'
                    : ' Os preços médios são bastante diferentes entre as praças.'
                  }
                </p>
                <p>
                  <strong>Score: {correlation.correlationScore.toFixed(1)}</strong> - 
                  {correlation.correlationScore > 70
                    ? ' As variações são muito consistentes entre serviços. Padrão confiável para precificação!'
                    : correlation.correlationScore > 50
                    ? ' As variações têm consistência razoável. Útil como referência, mas com atenção.'
                    : ' ATENÇÃO: As variações são inconsistentes! Alguns serviços variam muito mais que outros.'
                  }
                </p>
                <div className="pt-2 mt-2 border-t border-yellow-300">
                  <p className="font-semibold">Por que variação baixa pode ter score baixo?</p>
                  <p className="mt-1">
                    A variação média de {correlation.avgVariationVenda.toFixed(2)}% é uma <strong>média aritmética</strong>. 
                    Se alguns serviços têm +30% e outros -25%, a média pode ser próxima de zero, 
                    mas o <strong>desvio padrão</strong> ({correlation.stdDeviationVenda.toFixed(1)}) será alto, 
                    resultando em score baixo. Isso significa que <strong>não há um padrão consistente</strong> entre os preços das praças - 
                    cada serviço varia de forma diferente.
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-yellow-300">
                  <p className="font-semibold">Como usar esta informação?</p>
                  <p className="mt-1">
                    {correlation.correlationScore > 70
                      ? `Com score ${correlation.correlationScore.toFixed(1)}, você pode confiantemente usar ${plaza1} como referência para precificar ${plaza2}, aplicando a variação de ${correlation.avgVariationVenda.toFixed(2)}%.`
                      : correlation.correlationScore > 50
                      ? `Com score ${correlation.correlationScore.toFixed(1)}, use ${plaza1} como referência, mas revise serviço por serviço para identificar outliers.`
                      : `Com score ${correlation.correlationScore.toFixed(1)}, NÃO recomendamos usar ${plaza1} como referência automática para ${plaza2}. Analise cada grupo de serviços separadamente (veja tabela abaixo).`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Métricas Técnicas */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">📈 Métricas Técnicas</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Desvio Padrão</p>
                  <p className="font-bold text-gray-900">{correlation.stdDeviationVenda.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {correlation.stdDeviationVenda < 15 
                      ? 'Baixo - Ótimo!' 
                      : correlation.stdDeviationVenda < 30 
                      ? 'Moderado' 
                      : 'Alto - Atenção!'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs mb-1">Outliers</p>
                  <p className="font-bold text-gray-900">{correlation.outliers}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Serviços com variação &gt;50%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs mb-1">Total de Serviços</p>
                  <p className="font-bold text-gray-900">{comparison.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Analisados
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs mb-1">Taxa de Outliers</p>
                  <p className="font-bold text-gray-900">
                    {((correlation.outliers / comparison.length) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((correlation.outliers / comparison.length) * 100) < 5 
                      ? 'Baixa - Ótimo!' 
                      : ((correlation.outliers / comparison.length) * 100) < 15 
                      ? 'Moderada' 
                      : 'Alta - Atenção!'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de variações */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Variações de Preço de Venda</CardTitle>
            <CardDescription>
              Quantidade de serviços por faixa de variação percentual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Quantidade de Serviços" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Análise por grupo */}
        <Card>
          <CardHeader>
            <CardTitle>Variação Média por Grupo de Serviço</CardTitle>
            <CardDescription>
              Como cada grupo de serviço se comporta na comparação entre as praças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo de Serviço</TableHead>
                  <TableHead className="text-right">Var. Venda</TableHead>
                  <TableHead className="text-right">Var. Repasse</TableHead>
                  <TableHead className="text-right">Var. Margem (pp)</TableHead>
                  <TableHead className="text-right">Serviços</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupAnalysis.map((group) => (
                  <TableRow key={group.name}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          Math.abs(group.avgVariationVenda) < 10
                            ? 'text-green-600 border-green-600'
                            : Math.abs(group.avgVariationVenda) < 25
                            ? 'text-orange-600 border-orange-600'
                            : 'text-red-600 border-red-600'
                        }
                      >
                        {group.avgVariationVenda > 0 ? '+' : ''}
                        {group.avgVariationVenda.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          Math.abs(group.avgVariationRepasse) < 10
                            ? 'text-green-600 border-green-600'
                            : Math.abs(group.avgVariationRepasse) < 25
                            ? 'text-orange-600 border-orange-600'
                            : 'text-red-600 border-red-600'
                        }
                      >
                        {group.avgVariationRepasse > 0 ? '+' : ''}
                        {group.avgVariationRepasse.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {group.avgVariationMargem > 0 ? '+' : ''}
                      {group.avgVariationMargem.toFixed(2)}pp
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {group.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Comparação detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação Serviço por Serviço</CardTitle>
            <CardDescription>
              Detalhamento completo com repasse, preço de venda e margem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">{plaza1}<br/>Venda</TableHead>
                    <TableHead className="text-right">{plaza1}<br/>Repasse</TableHead>
                    <TableHead className="text-right">{plaza1}<br/>Margem</TableHead>
                    <TableHead className="text-right">{plaza2}<br/>Venda</TableHead>
                    <TableHead className="text-right">{plaza2}<br/>Repasse</TableHead>
                    <TableHead className="text-right">{plaza2}<br/>Margem</TableHead>
                    <TableHead className="text-right">Var.<br/>Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedComparison.slice(0, 50).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{item.codigo}</TableCell>
                      <TableCell className="text-sm">{item.grupo}</TableCell>
                      <TableCell className="text-right text-sm">
                        R$ {item.venda1.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        R$ {item.repasse1.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {item.margem1.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        R$ {item.venda2.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        R$ {item.repasse2.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {item.margem2.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            Math.abs(item.variationVenda) < 10
                              ? 'text-green-600 border-green-600'
                              : Math.abs(item.variationVenda) < 25
                              ? 'text-orange-600 border-orange-600'
                              : 'text-red-600 border-red-600'
                          }
                        >
                          {item.variationVenda > 0 ? '+' : ''}
                          {item.variationVenda.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {sortedComparison.length > 50 && (
                <p className="text-center text-sm text-gray-600 mt-4">
                  Mostrando 50 de {sortedComparison.length} serviços (ordenados por maior variação)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}