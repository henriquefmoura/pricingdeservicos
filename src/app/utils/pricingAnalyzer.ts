import { ServiceData, PlazaStats, PlazaCorrelation, ParameterPlaza, PlazaData } from '../types/pricing';

export class PricingAnalyzer {
  private data: ServiceData[];
  private plazas: string[];

  constructor(data: ServiceData[]) {
    this.data = data;
    this.plazas = this.extractPlazas();
  }

  private extractPlazas(): string[] {
    if (this.data.length === 0) return [];
    const firstRow = this.data[0];
    const plazaSet = new Set<string>();

    // Identifica praças pelo padrão: NomePraça_Repasse, NomePraça_Venda, NomePraça_Margem
    Object.keys(firstRow).forEach((key) => {
      if (key !== 'codigo' && key !== 'grupo') {
        const parts = key.split('_');
        if (parts.length >= 2 && (parts[parts.length - 1] === 'Repasse' || parts[parts.length - 1] === 'Venda' || parts[parts.length - 1] === 'Margem')) {
          // Remove o sufixo para obter o nome da praça
          const plazaName = parts.slice(0, -1).join('_');
          plazaSet.add(plazaName);
        }
      }
    });

    return Array.from(plazaSet);
  }

  private getPlazaData(row: ServiceData, plaza: string): PlazaData | null {
    const repasseKey = `${plaza}_Repasse`;
    const vendaKey = `${plaza}_Venda`;
    const margemKey = `${plaza}_Margem`;

    const repasse = typeof row[repasseKey] === 'number' ? row[repasseKey] : parseFloat(row[repasseKey] as string);
    const venda = typeof row[vendaKey] === 'number' ? row[vendaKey] : parseFloat(row[vendaKey] as string);
    const margem = typeof row[margemKey] === 'number' ? row[margemKey] : parseFloat(row[margemKey] as string);

    if (isNaN(repasse) || isNaN(venda) || isNaN(margem)) {
      return null;
    }

    return { repasse, venda, margem };
  }

  getPlazas(): string[] {
    return this.plazas;
  }

  /**
   * Calcula o coeficiente de correlação de Pearson entre dois vetores
   * @param x Primeiro vetor de valores
   * @param y Segundo vetor de valores
   * @returns Valor entre -1 e +1 (-1 = correlação negativa perfeita, 0 = sem correlação, +1 = correlação positiva perfeita)
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    
    if (n === 0 || n !== y.length) {
      return 0;
    }

    // Se os arrays têm menos de 2 elementos, não podemos calcular correlação
    if (n < 2) {
      return 0;
    }

    // Somatórias necessárias
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    // Fórmula de Pearson: r = (n·Σxy - Σx·Σy) / sqrt((n·Σx² - (Σx)²) · (n·Σy² - (Σy)²))
    const numerator = n * sumXY - sumX * sumY;
    const denominatorX = n * sumX2 - sumX * sumX;
    const denominatorY = n * sumY2 - sumY * sumY;
    const denominator = Math.sqrt(denominatorX * denominatorY);

    // Se o denominador é 0 (vetores constantes), não há correlação
    if (denominator === 0 || denominatorX < 0 || denominatorY < 0) {
      return 0;
    }

    const correlation = numerator / denominator;
    
    // Garantir que o valor está entre -1 e 1 (correção de erros de ponto flutuante)
    return Math.max(-1, Math.min(1, correlation));
  }

  getPlazaStats(): PlazaStats[] {
    return this.plazas.map((plaza) => {
      const stats = {
        repasses: [] as number[],
        vendas: [] as number[],
        margens: [] as number[],
      };

      this.data.forEach((row) => {
        const plazaData = this.getPlazaData(row, plaza);
        if (plazaData) {
          stats.repasses.push(plazaData.repasse);
          stats.vendas.push(plazaData.venda);
          stats.margens.push(plazaData.margem);
        }
      });

      return {
        name: plaza,
        avgRepasse: stats.repasses.length > 0 ? stats.repasses.reduce((a, b) => a + b, 0) / stats.repasses.length : 0,
        avgVenda: stats.vendas.length > 0 ? stats.vendas.reduce((a, b) => a + b, 0) / stats.vendas.length : 0,
        avgMargem: stats.margens.length > 0 ? stats.margens.reduce((a, b) => a + b, 0) / stats.margens.length : 0,
        minVenda: stats.vendas.length > 0 ? Math.min(...stats.vendas) : 0,
        maxVenda: stats.vendas.length > 0 ? Math.max(...stats.vendas) : 0,
        serviceCount: stats.vendas.length,
      };
    });
  }

  calculateCorrelation(plaza1: string, plaza2: string): PlazaCorrelation {
    const variationsRepasse: number[] = [];
    const variationsVenda: number[] = [];
    const variationsMargem: number[] = [];
    const vendas1: number[] = [];
    const vendas2: number[] = [];
    let outlierCount = 0;

    this.data.forEach((row) => {
      const data1 = this.getPlazaData(row, plaza1);
      const data2 = this.getPlazaData(row, plaza2);

      if (data1 && data2 && data1.venda > 0 && data2.venda > 0) {
        const varRepasse = ((data2.repasse - data1.repasse) / data1.repasse) * 100;
        const varVenda = ((data2.venda - data1.venda) / data1.venda) * 100;
        const varMargem = data2.margem - data1.margem; // Diferença absoluta de margem

        variationsRepasse.push(varRepasse);
        variationsVenda.push(varVenda);
        variationsMargem.push(varMargem);
        
        // Coletar valores de venda para cálculo de Pearson
        vendas1.push(data1.venda);
        vendas2.push(data2.venda);

        // Considera outlier se o preço de venda variar mais de 50%
        if (Math.abs(varVenda) > 50) {
          outlierCount++;
        }
      }
    });

    if (variationsVenda.length === 0) {
      return {
        plaza1,
        plaza2,
        avgVariationRepasse: 0,
        avgVariationVenda: 0,
        avgVariationMargem: 0,
        stdDeviationVenda: 0,
        correlationScore: 0,
        pearsonR: 0,
        outliers: 0,
      };
    }

    const avgVariationRepasse = variationsRepasse.reduce((a, b) => a + b, 0) / variationsRepasse.length;
    const avgVariationVenda = variationsVenda.reduce((a, b) => a + b, 0) / variationsVenda.length;
    const avgVariationMargem = variationsMargem.reduce((a, b) => a + b, 0) / variationsMargem.length;

    const varianceVenda =
      variationsVenda.reduce((sum, val) => sum + Math.pow(val - avgVariationVenda, 2), 0) /
      variationsVenda.length;

    const stdDeviationVenda = Math.sqrt(varianceVenda);

    // Calcula correlação de Pearson real
    const pearson = this.pearsonCorrelation(vendas1, vendas2);
    
    // Normaliza Pearson (-1 a +1) para 0-100 para compatibilidade com a UI
    const correlationScore = Math.round(((pearson + 1) / 2) * 100);

    return {
      plaza1,
      plaza2,
      avgVariationRepasse,
      avgVariationVenda,
      avgVariationMargem,
      stdDeviationVenda,
      correlationScore,
      pearsonR: pearson,
      outliers: outlierCount,
    };
  }

  getAllCorrelations(): PlazaCorrelation[] {
    const correlations: PlazaCorrelation[] = [];

    for (let i = 0; i < this.plazas.length; i++) {
      for (let j = i + 1; j < this.plazas.length; j++) {
        const correlation = this.calculateCorrelation(
          this.plazas[i],
          this.plazas[j]
        );
        correlations.push(correlation);
      }
    }

    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  findParameterPlazas(minDependents: number = 3, maxParameters: number = 5): ParameterPlaza[] {
    const allCorrelations = this.getAllCorrelations();
    const plazaScores = new Map<string, { total: number; count: number; dependents: Map<string, PlazaCorrelation> }>();

    // Inicializa scores para cada praça
    this.plazas.forEach((plaza) => {
      plazaScores.set(plaza, { total: 0, count: 0, dependents: new Map() });
    });

    // Calcula scores baseado em correlações (usa Pearson real)
    allCorrelations.forEach((corr) => {
      // Usa o valor de Pearson: correlação forte (> 0.6)
      if (corr.pearsonR > 0.6) {
        const scores1 = plazaScores.get(corr.plaza1)!;
        const scores2 = plazaScores.get(corr.plaza2)!;

        scores1.total += corr.correlationScore;
        scores1.count++;
        scores1.dependents.set(corr.plaza2, corr);

        scores2.total += corr.correlationScore;
        scores2.count++;
        scores2.dependents.set(corr.plaza1, corr);
      }
    });

    // Identifica melhores praças-parâmetro
    const parameterPlazas: ParameterPlaza[] = [];

    Array.from(plazaScores.entries())
      .filter(([_, scores]) => scores.dependents.size >= minDependents)
      .sort((a, b) => {
        const avgA = a[1].total / a[1].count;
        const avgB = b[1].total / b[1].count;
        return avgB - avgA;
      })
      .slice(0, maxParameters)
      .forEach(([plaza, scores]) => {
        const dependents = Array.from(scores.dependents.entries()).map(
          ([depPlaza, corr]) => ({
            name: depPlaza,
            avgVariationRepasse: corr.plaza1 === plaza ? corr.avgVariationRepasse : -corr.avgVariationRepasse,
            avgVariationVenda: corr.plaza1 === plaza ? corr.avgVariationVenda : -corr.avgVariationVenda,
            avgVariationMargem: corr.plaza1 === plaza ? corr.avgVariationMargem : -corr.avgVariationMargem,
            consistency: corr.correlationScore,
          })
        );

        parameterPlazas.push({
          name: plaza,
          dependentPlazas: dependents.sort((a, b) => b.consistency - a.consistency),
          score: scores.total / scores.count,
        });
      });

    return parameterPlazas;
  }

  findTop3ParameterPlazas(): ParameterPlaza[] {
    const allCorrelations = this.getAllCorrelations();
    
    // Garante que SP está nos dados
    if (!this.plazas.includes('SP')) {
      return [];
    }

    // Calcula scores para cada praça (exceto SP que já é garantida)
    const plazaScores = new Map<string, { total: number; count: number; correlations: PlazaCorrelation[] }>();

    this.plazas.forEach((plaza) => {
      if (plaza !== 'SP') {
        plazaScores.set(plaza, { total: 0, count: 0, correlations: [] });
      }
    });

    // Calcula scores baseado em correlações
    allCorrelations.forEach((corr) => {
      if (corr.plaza1 !== 'SP' && corr.plaza2 !== 'SP') {
        const scores1 = plazaScores.get(corr.plaza1);
        const scores2 = plazaScores.get(corr.plaza2);

        if (scores1) {
          scores1.total += corr.correlationScore;
          scores1.count++;
          scores1.correlations.push(corr);
        }

        if (scores2) {
          scores2.total += corr.correlationScore;
          scores2.count++;
          scores2.correlations.push(corr);
        }
      }
    });

    // Seleciona as 2 melhores praças parâmetro (além de SP)
    const top2Plazas = Array.from(plazaScores.entries())
      .filter(([_, scores]) => scores.count > 0)
      .sort((a, b) => {
        const avgA = a[1].total / a[1].count;
        const avgB = b[1].total / b[1].count;
        return avgB - avgA;
      })
      .slice(0, 2)
      .map(([plaza, _]) => plaza);

    const parameterPlazaNames = ['SP', ...top2Plazas];

    // Agora agrupa TODAS as outras praças em uma das 3 praças parâmetro
    const parameterPlazasMap = new Map<string, {
      dependencies: Array<{
        name: string;
        avgVariationRepasse: number;
        avgVariationVenda: number;
        avgVariationMargem: number;
        consistency: number;
      }>;
      totalScore: number;
      count: number;
    }>();

    parameterPlazaNames.forEach((plaza) => {
      parameterPlazasMap.set(plaza, { dependencies: [], totalScore: 0, count: 0 });
    });

    // Para cada praça não-parâmetro, encontra a melhor praça parâmetro
    const nonParameterPlazas = this.plazas.filter(p => !parameterPlazaNames.includes(p));

    nonParameterPlazas.forEach((plaza) => {
      let bestParameterPlaza = parameterPlazaNames[0];
      let bestCorrelation: PlazaCorrelation | null = null as PlazaCorrelation | null;

      // Encontra a praça parâmetro com melhor correlação
      parameterPlazaNames.forEach((paramPlaza) => {
        const correlation = allCorrelations.find(
          (c) =>
            (c.plaza1 === paramPlaza && c.plaza2 === plaza) ||
            (c.plaza1 === plaza && c.plaza2 === paramPlaza)
        );

        if (correlation && (!bestCorrelation || correlation.correlationScore > bestCorrelation.correlationScore)) {
          bestCorrelation = correlation;
          bestParameterPlaza = paramPlaza;
        }
      });

      // Adiciona à praça parâmetro correspondente
      if (bestCorrelation) {
        const paramData = parameterPlazasMap.get(bestParameterPlaza)!;
        const isPlaza1Param = bestCorrelation.plaza1 === bestParameterPlaza;

        paramData.dependencies.push({
          name: plaza,
          avgVariationRepasse: isPlaza1Param ? bestCorrelation.avgVariationRepasse : -bestCorrelation.avgVariationRepasse,
          avgVariationVenda: isPlaza1Param ? bestCorrelation.avgVariationVenda : -bestCorrelation.avgVariationVenda,
          avgVariationMargem: isPlaza1Param ? bestCorrelation.avgVariationMargem : -bestCorrelation.avgVariationMargem,
          consistency: bestCorrelation.correlationScore,
        });

        paramData.totalScore += bestCorrelation.correlationScore;
        paramData.count++;
      }
    });

    // Constrói o resultado final
    const result: ParameterPlaza[] = parameterPlazaNames.map((plaza) => {
      const data = parameterPlazasMap.get(plaza)!;
      return {
        name: plaza,
        dependentPlazas: data.dependencies.sort((a, b) => b.consistency - a.consistency),
        score: data.count > 0 ? data.totalScore / data.count : 0,
      };
    });

    return result;
  }

  getDetailedComparison(plaza1: string, plaza2: string): Array<{
    codigo: string;
    grupo: string;
    repasse1: number;
    venda1: number;
    margem1: number;
    repasse2: number;
    venda2: number;
    margem2: number;
    variationRepasse: number;
    variationVenda: number;
    variationMargem: number;
  }> {
    return this.data
      .map((row) => {
        const data1 = this.getPlazaData(row, plaza1);
        const data2 = this.getPlazaData(row, plaza2);

        if (data1 && data2 && data1.venda > 0 && data2.venda > 0) {
          return {
            codigo: row.codigo as string,
            grupo: row.grupo as string,
            repasse1: data1.repasse,
            venda1: data1.venda,
            margem1: data1.margem,
            repasse2: data2.repasse,
            venda2: data2.venda,
            margem2: data2.margem,
            variationRepasse: ((data2.repasse - data1.repasse) / data1.repasse) * 100,
            variationVenda: ((data2.venda - data1.venda) / data1.venda) * 100,
            variationMargem: data2.margem - data1.margem,
          };
        }
        return null;
      })
      .filter((item) => item !== null) as Array<{
      codigo: string;
      grupo: string;
      repasse1: number;
      venda1: number;
      margem1: number;
      repasse2: number;
      venda2: number;
      margem2: number;
      variationRepasse: number;
      variationVenda: number;
      variationMargem: number;
    }>;
  }
}