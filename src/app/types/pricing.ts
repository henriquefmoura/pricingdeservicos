export interface ServiceData {
  codigo: string;
  grupo: string;
  [key: string]: string | number; // Permite colunas dinâmicas como SP_Repasse, SP_Venda, SP_Margem
}

export interface PlazaStats {
  name: string;
  avgRepasse: number;
  avgVenda: number;
  avgMargem: number;
  minVenda: number;
  maxVenda: number;
  serviceCount: number;
}

export interface PlazaCorrelation {
  plaza1: string;
  plaza2: string;
  avgVariationRepasse: number;
  avgVariationVenda: number;
  avgVariationMargem: number;
  stdDeviationVenda: number;
  correlationScore: number;
  pearsonR: number; // Raw Pearson value (-1 to +1)
  outliers: number;
}

export interface ParameterPlaza {
  name: string;
  dependentPlazas: Array<{
    name: string;
    avgVariationRepasse: number;
    avgVariationVenda: number;
    avgVariationMargem: number;
    consistency: number;
  }>;
  score: number;
}

export interface PlazaData {
  repasse: number;
  venda: number;
  margem: number;
}