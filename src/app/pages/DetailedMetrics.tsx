import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { PricingAnalyzer } from '../utils/pricingAnalyzer';
import * as XLSX from 'xlsx';

export function DetailedMetrics() {
  const navigate = useNavigate();
  const data = usePricingStore((state) => state.data);

  const analyzer = useMemo(() => {
    if (!data) return null;
    return new PricingAnalyzer(data);
  }, [data]);

  const plazaStats = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getPlazaStats();
  }, [analyzer]);

  const allCorrelations = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getAllCorrelations();
  }, [analyzer]);

  const parameterPlazas = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.findParameterPlazas(3, 5);
  }, [analyzer]);

  const plazas = useMemo(() => {
    if (!analyzer) return [];
    return analyzer.getPlazas();
  }, [analyzer]);

  // Análise detalhada por grupo para todas as praças
  const groupAnalysisByPlaza = useMemo(() => {
    if (!data || !analyzer || plazas.length === 0) return [];

    const groups = new Map<string, Map<string, { repasse: number[]; venda: number[]; margem: number[] }>>();

    data.forEach((row) => {
      const grupo = row.grupo as string;
      if (!groups.has(grupo)) {
        groups.set(grupo, new Map());
      }
      const groupData = groups.get(grupo)!;

      plazas.forEach((plaza) => {
        if (!groupData.has(plaza)) {
          groupData.set(plaza, { repasse: [], venda: [], margem: [] });
        }
        const plazaData = groupData.get(plaza)!;

        const repasseKey = `${plaza}_Repasse`;
        const vendaKey = `${plaza}_Venda`;
        const margemKey = `${plaza}_Margem`;

        const repasse = typeof row[repasseKey] === 'number' ? row[repasseKey] : parseFloat(row[repasseKey] as string);
        const venda = typeof row[vendaKey] === 'number' ? row[vendaKey] : parseFloat(row[vendaKey] as string);
        const margem = typeof row[margemKey] === 'number' ? row[margemKey] : parseFloat(row[margemKey] as string);

        if (!isNaN(repasse) && !isNaN(venda) && !isNaN(margem)) {
          plazaData.repasse.push(repasse);
          plazaData.venda.push(venda);
          plazaData.margem.push(margem);
        }
      });
    });

    const result: Array<{
      grupo: string;
      plazaMetrics: Array<{
        plaza: string;
        avgRepasse: number;
        avgVenda: number;
        avgMargem: number;
        minVenda: number;
        maxVenda: number;
        count: number;
      }>;
    }> = [];

    groups.forEach((plazaMap, grupo) => {
      const plazaMetrics: Array<{
        plaza: string;
        avgRepasse: number;
        avgVenda: number;
        avgMargem: number;
        minVenda: number;
        maxVenda: number;
        count: number;
      }> = [];

      plazaMap.forEach((metrics, plaza) => {
        if (metrics.venda.length > 0) {
          plazaMetrics.push({
            plaza,
            avgRepasse: metrics.repasse.reduce((a, b) => a + b, 0) / metrics.repasse.length,
            avgVenda: metrics.venda.reduce((a, b) => a + b, 0) / metrics.venda.length,
            avgMargem: metrics.margem.reduce((a, b) => a + b, 0) / metrics.margem.length,
            minVenda: Math.min(...metrics.venda),
            maxVenda: Math.max(...metrics.venda),
            count: metrics.venda.length,
          });
        }
      });

      result.push({ grupo, plazaMetrics });
    });

    return result;
  }, [data, analyzer, plazas]);

  if (!data || !analyzer) {
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
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportToExcel = (sheetName: string, data: any[], filename: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const exportAllMetrics = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Estatísticas por Praça
    const plazaStatsData = plazaStats.map((stat) => ({
      'Praça': stat.name,
      'Preço Venda Médio': stat.avgVenda.toFixed(2),
      'Repasse Médio': stat.avgRepasse.toFixed(2),
      'Margem Média (%)': stat.avgMargem.toFixed(2),
      'Preço Venda Mínimo': stat.minVenda.toFixed(2),
      'Preço Venda Máximo': stat.maxVenda.toFixed(2),
      'Quantidade Serviços': stat.serviceCount,
    }));
    const ws1 = XLSX.utils.json_to_sheet(plazaStatsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Estatísticas por Praça');

    // Sheet 2: Todas as Correlações
    const correlationsData = allCorrelations.map((corr) => ({
      'Praça Base': corr.plaza1,
      'Praça Comparada': corr.plaza2,
      'Variação Média Venda (%)': corr.avgVariationVenda.toFixed(2),
      'Variação Média Repasse (%)': corr.avgVariationRepasse.toFixed(2),
      'Variação Margem (pp)': corr.avgVariationMargem.toFixed(2),
      'Desvio Padrão Venda': corr.stdDeviationVenda.toFixed(2),
      'Score de Correlação': corr.correlationScore.toFixed(2),
      'Outliers': corr.outliers,
    }));
    const ws2 = XLSX.utils.json_to_sheet(correlationsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Correlações');

    // Sheet 3: Praças-Parâmetro
    const parameterData: any[] = [];
    parameterPlazas.forEach((param) => {
      param.dependentPlazas.forEach((dep) => {
        parameterData.push({
          'Praça Parâmetro': param.name,
          'Score Parâmetro': param.score.toFixed(2),
          'Praça Dependente': dep.name,
          'Variação Média Venda (%)': dep.avgVariationVenda.toFixed(2),
          'Variação Média Repasse (%)': dep.avgVariationRepasse.toFixed(2),
          'Variação Margem (pp)': dep.avgVariationMargem.toFixed(2),
          'Consistência': dep.consistency.toFixed(2),
        });
      });
    });
    const ws3 = XLSX.utils.json_to_sheet(parameterData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Praças Parâmetro');

    // Sheet 4: Análise por Grupo
    const groupData: any[] = [];
    groupAnalysisByPlaza.forEach((group) => {
      group.plazaMetrics.forEach((metric) => {
        groupData.push({
          'Grupo de Serviço': group.grupo,
          'Praça': metric.plaza,
          'Preço Venda Médio': metric.avgVenda.toFixed(2),
          'Repasse Médio': metric.avgRepasse.toFixed(2),
          'Margem Média (%)': metric.avgMargem.toFixed(2),
          'Preço Venda Mínimo': metric.minVenda.toFixed(2),
          'Preço Venda Máximo': metric.maxVenda.toFixed(2),
          'Quantidade': metric.count,
        });
      });
    });
    const ws4 = XLSX.utils.json_to_sheet(groupData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Análise por Grupo');

    XLSX.writeFile(wb, 'metricas_completas_precificacao.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Gradient header */}
        <div
          className="rounded-xl p-6 text-white shadow-lg mb-6"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center justify-between">
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
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Métricas Detalhadas</h2>
                <p className="text-white/80 text-sm mt-1">Todas as métricas calculadas pela análise</p>
              </div>
            </div>
            <Button onClick={exportAllMetrics} className="bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo (Excel)
            </Button>
          </div>
        </div>
        <Tabs defaultValue="plazas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plazas">Estatísticas</TabsTrigger>
            <TabsTrigger value="correlations">Correlações</TabsTrigger>
            <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
            <TabsTrigger value="groups">Por Grupo</TabsTrigger>
          </TabsList>

          {/* Estatísticas por Praça */}
          <TabsContent value="plazas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estatísticas Completas por Praça</CardTitle>
                    <CardDescription>
                      Métricas detalhadas de cada praça: preços, repasses e margens
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportToExcel(
                        'Estatísticas',
                        plazaStats.map((s) => ({
                          Praça: s.name,
                          'Venda Média': s.avgVenda.toFixed(2),
                          'Repasse Médio': s.avgRepasse.toFixed(2),
                          'Margem Média': s.avgMargem.toFixed(2),
                          'Venda Mín': s.minVenda.toFixed(2),
                          'Venda Máx': s.maxVenda.toFixed(2),
                          Serviços: s.serviceCount,
                        })),
                        'estatisticas_pracas.xlsx'
                      )
                    }
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Praça</TableHead>
                        <TableHead className="text-right">Venda Média</TableHead>
                        <TableHead className="text-right">Repasse Médio</TableHead>
                        <TableHead className="text-right">Margem Média</TableHead>
                        <TableHead className="text-right">Venda Mínima</TableHead>
                        <TableHead className="text-right">Venda Máxima</TableHead>
                        <TableHead className="text-right">Serviços</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plazaStats
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((stat) => (
                          <TableRow key={stat.name}>
                            <TableCell className="font-medium">{stat.name}</TableCell>
                            <TableCell className="text-right">
                              R$ {stat.avgVenda.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {stat.avgRepasse.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {stat.avgMargem.toFixed(2)}%
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todas as Correlações */}
          <TabsContent value="correlations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Todas as Correlações Entre Praças</CardTitle>
                    <CardDescription>
                      {allCorrelations.length} correlações calculadas
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportToExcel(
                        'Correlações',
                        allCorrelations.map((c) => ({
                          'Praça 1': c.plaza1,
                          'Praça 2': c.plaza2,
                          'Var. Venda (%)': c.avgVariationVenda.toFixed(2),
                          'Var. Repasse (%)': c.avgVariationRepasse.toFixed(2),
                          'Var. Margem (pp)': c.avgVariationMargem.toFixed(2),
                          'Desvio Padrão': c.stdDeviationVenda.toFixed(2),
                          Score: c.correlationScore.toFixed(2),
                          Outliers: c.outliers,
                        })),
                        'correlacoes.xlsx'
                      )
                    }
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Praça Base</TableHead>
                        <TableHead>Praça Comparada</TableHead>
                        <TableHead className="text-right">Var. Venda (%)</TableHead>
                        <TableHead className="text-right">Var. Repasse (%)</TableHead>
                        <TableHead className="text-right">Var. Margem (pp)</TableHead>
                        <TableHead className="text-right">Desvio Padrão</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Outliers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCorrelations.map((corr, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{corr.plaza1}</TableCell>
                          <TableCell>{corr.plaza2}</TableCell>
                          <TableCell className="text-right">
                            {corr.avgVariationVenda > 0 ? '+' : ''}
                            {corr.avgVariationVenda.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {corr.avgVariationRepasse > 0 ? '+' : ''}
                            {corr.avgVariationRepasse.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {corr.avgVariationMargem > 0 ? '+' : ''}
                            {corr.avgVariationMargem.toFixed(2)}pp
                          </TableCell>
                          <TableCell className="text-right">
                            {corr.stdDeviationVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {corr.correlationScore.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {corr.outliers}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Praças Parâmetro */}
          <TabsContent value="parameters">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Praças-Parâmetro e Suas Dependentes</CardTitle>
                    <CardDescription>
                      Detalhamento completo das relações entre praças-parâmetro e suas dependentes
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data: any[] = [];
                      parameterPlazas.forEach((p) => {
                        p.dependentPlazas.forEach((d) => {
                          data.push({
                            'Praça Parâmetro': p.name,
                            'Score Parâmetro': p.score.toFixed(2),
                            'Praça Dependente': d.name,
                            'Var. Venda (%)': d.avgVariationVenda.toFixed(2),
                            'Var. Repasse (%)': d.avgVariationRepasse.toFixed(2),
                            'Var. Margem (pp)': d.avgVariationMargem.toFixed(2),
                            Consistência: d.consistency.toFixed(2),
                          });
                        });
                      });
                      exportToExcel('Parâmetros', data, 'pracas_parametro.xlsx');
                    }}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Praça Parâmetro</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead>Praça Dependente</TableHead>
                        <TableHead className="text-right">Var. Venda (%)</TableHead>
                        <TableHead className="text-right">Var. Repasse (%)</TableHead>
                        <TableHead className="text-right">Var. Margem (pp)</TableHead>
                        <TableHead className="text-right">Consistência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parameterPlazas.map((param) =>
                        param.dependentPlazas.map((dep, idx) => (
                          <TableRow key={`${param.name}-${dep.name}`}>
                            {idx === 0 && (
                              <>
                                <TableCell
                                  rowSpan={param.dependentPlazas.length}
                                  className="font-bold bg-blue-50"
                                >
                                  {param.name}
                                </TableCell>
                                <TableCell
                                  rowSpan={param.dependentPlazas.length}
                                  className="text-right font-bold bg-blue-50"
                                >
                                  {param.score.toFixed(2)}
                                </TableCell>
                              </>
                            )}
                            <TableCell>{dep.name}</TableCell>
                            <TableCell className="text-right">
                              {dep.avgVariationVenda > 0 ? '+' : ''}
                              {dep.avgVariationVenda.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {dep.avgVariationRepasse > 0 ? '+' : ''}
                              {dep.avgVariationRepasse.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {dep.avgVariationMargem > 0 ? '+' : ''}
                              {dep.avgVariationMargem.toFixed(2)}pp
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {dep.consistency.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise por Grupo */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Análise Detalhada por Grupo de Serviço</CardTitle>
                    <CardDescription>
                      Como cada grupo se comporta em cada praça
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data: any[] = [];
                      groupAnalysisByPlaza.forEach((g) => {
                        g.plazaMetrics.forEach((m) => {
                          data.push({
                            Grupo: g.grupo,
                            Praça: m.plaza,
                            'Venda Média': m.avgVenda.toFixed(2),
                            'Repasse Médio': m.avgRepasse.toFixed(2),
                            'Margem Média': m.avgMargem.toFixed(2),
                            'Venda Mín': m.minVenda.toFixed(2),
                            'Venda Máx': m.maxVenda.toFixed(2),
                            Quantidade: m.count,
                          });
                        });
                      });
                      exportToExcel('Por Grupo', data, 'analise_por_grupo.xlsx');
                    }}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 overflow-x-auto">
                  {groupAnalysisByPlaza.slice(0, 10).map((group) => (
                    <div key={group.grupo} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">{group.grupo}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Praça</TableHead>
                            <TableHead className="text-right">Venda Média</TableHead>
                            <TableHead className="text-right">Repasse Médio</TableHead>
                            <TableHead className="text-right">Margem Média</TableHead>
                            <TableHead className="text-right">Venda Mín</TableHead>
                            <TableHead className="text-right">Venda Máx</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.plazaMetrics
                            .sort((a, b) => b.avgVenda - a.avgVenda)
                            .map((metric) => (
                              <TableRow key={metric.plaza}>
                                <TableCell className="font-medium">{metric.plaza}</TableCell>
                                <TableCell className="text-right">
                                  R$ {metric.avgVenda.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  R$ {metric.avgRepasse.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {metric.avgMargem.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                  R$ {metric.minVenda.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                  R$ {metric.maxVenda.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                  {metric.count}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                  {groupAnalysisByPlaza.length > 10 && (
                    <p className="text-center text-sm text-gray-600">
                      Mostrando 10 de {groupAnalysisByPlaza.length} grupos. Use o botão "Exportar" para ver todos.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}