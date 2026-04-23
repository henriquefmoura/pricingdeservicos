// ============================================================================
// ML Pricing — Types
// ============================================================================
// Tipos para o sistema de sugestão de preço baseado em aprendizado de máquina.
// O ML aqui é implementado como um modelo de regressão ponderada que evolui
// conforme os dados históricos e o comportamento dos usuários.
// ============================================================================

// ─── Dados de Vendas (upload semanal do master) ──────────────────────────────

/** Uma linha de dados de vendas/conversão/adesão para um grupo de serviço × praça */
export interface SalesDataRow {
  /** Grupo de serviço (ex: "Chuveiro/Torneira Elétrica") */
  grupoServico: string;
  /** Nome da praça (ex: "Praça SP") */
  plaza: string;
  /** Semana de referência (ISO 8601, ex: "2025-01-06") */
  semana: string;
  /** Total de OS abertas no período */
  totalOs: number;
  /** Total de OS convertidas (serviço efetivamente executado) */
  osConvertidas: number;
  /** Taxa de conversão calculada (0–1) */
  taxaConversao: number;
  /** Total de adesões (clientes que aceitaram o orçamento) */
  adesoes: number;
  /** Taxa de adesão calculada (0–1) */
  taxaAdesao: number;
  /** Preço médio de venda praticado no período */
  precoMedioVenda: number;
  /** Preço médio de repasse praticado no período */
  precoMedioRepasse: number;
  /** Quantidade de prestadores ativos nesta praça para o grupo */
  prestadoresAtivos: number;
  /** Estimativa da rede de concorrentes na região */
  redeConcorrentes: number;
  /** Indicador de capacidade de compra da região (1 = baixa … 5 = muito alta) */
  capacidadeCompraRegional: number;
  /** Receita total gerada no período */
  receitaTotal?: number;
  /** Campo livre para observações */
  observacoes?: string;
}

/** Snapshot semanal completo carregado pelo master */
export interface SalesSnapshot {
  id: string;
  uploadedAt: string;       // ISO 8601
  uploadedBy: string;       // nome do master
  semanaReferencia: string; // ISO 8601 da semana
  rowCount?: number;
  rows: SalesDataRow[];
}

// ─── Sugestão de Preço (saída do serviço ML) ─────────────────────────────────

export type MLConfidenceLevel = 'baixa' | 'media' | 'alta';

export interface MLPriceSuggestion {
  grupoServico: string;
  plaza: string;
  /** Preço de venda sugerido */
  suggestedVenda: number;
  /** Preço de repasse sugerido */
  suggestedRepasse: number;
  /** Faixa mínima de venda recomendada */
  vendaMin: number;
  /** Faixa máxima de venda recomendada */
  vendaMax: number;
  /** Score de confiança 0–100 */
  confidence: number;
  confidenceLevel: MLConfidenceLevel;
  /** Margem estimada (%) com os valores sugeridos */
  estimatedMargem: number;
  /** Fatores que mais influenciaram a sugestão */
  keyFactors: MLFactor[];
  /** Resumo em linguagem natural */
  summary: string;
  /** Data/hora em que a sugestão foi gerada */
  generatedAt: string;
  /** Quantidade de semanas de histórico usadas */
  historicoSemanas: number;
}

export interface MLFactor {
  label: string;
  impact: 'positivo' | 'neutro' | 'negativo';
  description: string;
}

// ─── Comportamento do usuário (feedback implícito) ───────────────────────────

export type MLBehaviorAction =
  | 'suggestion_used'      // usuário clicou em "Usar sugestão"
  | 'suggestion_overridden' // usuário inseriu preço diferente do sugerido
  | 'suggestion_ignored';  // usuário viu a sugestão mas não interagiu

export interface MLBehaviorLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  plaza: string;
  grupoServico: string;
  codeId?: string;
  action: MLBehaviorAction;
  /** Preço sugerido pelo ML */
  suggestedVenda: number;
  suggestedRepasse: number;
  /** Preço efetivamente usado (quando action ≠ suggestion_ignored) */
  actualVenda?: number;
  actualRepasse?: number;
  /** Diferença percentual: (actual - suggested) / suggested */
  vendaDeltaPercent?: number;
}

// ─── Pesos adaptativos por praça × grupo ─────────────────────────────────────
// Os pesos são ajustados automaticamente pelo serviço ML com base nos logs
// de comportamento. Persistidos no store.

export interface MLWeights {
  /** Peso do histórico de preços (0–1) */
  wHistoricoPreco: number;
  /** Peso da taxa de conversão (0–1) */
  wConversao: number;
  /** Peso da taxa de adesão (0–1) */
  wAdesao: number;
  /** Peso da rede de prestadores (0–1) — mais prestadores → pressão de baixa */
  wPrestadores: number;
  /** Peso da rede de concorrentes (0–1) */
  wConcorrentes: number;
  /** Peso da capacidade de compra regional (0–1) */
  wCapacidadeCompra: number;
  /** Bias de correção aprendido com comportamento (-0.5 a +0.5) */
  biasCorrecao: number;
  /** Número de amostras de comportamento usadas para calibrar */
  nSamples: number;
}

export const DEFAULT_ML_WEIGHTS: MLWeights = {
  // Histórico de preços tem peso menor: o preço do admin (âncora de praça
  // correlacionada) já captura o nível de preço do mercado local.
  wHistoricoPreco:   0.10,
  // Conversão e adesão são os melhores sinais de demanda — recebem mais peso.
  wConversao:        0.28,
  wAdesao:           0.28,
  // Pressão competitiva (prestadores + concorrentes)
  wPrestadores:      0.12,
  wConcorrentes:     0.12,
  // Poder de compra regional
  wCapacidadeCompra: 0.10,
  biasCorrecao:      0,
  nSamples:          0,
};
