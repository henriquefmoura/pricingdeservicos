// ============================================================================
// ML Behavior Store — rastreia o feedback implícito dos usuários/admins
// sobre as sugestões de preço, permitindo que o modelo aprenda
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MLBehaviorLog, MLBehaviorAction, MLWeights } from '../types/mlPricing';
import { DEFAULT_ML_WEIGHTS } from '../types/mlPricing';

// Chave usada no mapa de pesos: "grupoServico::plaza"
function weightsKey(grupoServico: string, plaza: string): string {
  return `${grupoServico}::${plaza}`;
}

interface MLBehaviorState {
  logs: MLBehaviorLog[];
  /** Mapa de pesos adaptativos por grupoServico × plaza */
  weights: Record<string, MLWeights>;

  /** Registra uma interação do usuário com a sugestão */
  logBehavior: (log: Omit<MLBehaviorLog, 'id' | 'timestamp'>) => void;

  /** Retorna pesos para um grupo × praça (usa default se não houver amostras) */
  getWeights: (grupoServico: string, plaza: string) => MLWeights;

  /** Retorna todos os logs de comportamento para auditoria */
  getLogs: () => MLBehaviorLog[];

  /** Retorna logs filtrados por plaza */
  getLogsByPlaza: (plaza: string) => MLBehaviorLog[];

  /** Taxa de aceitação de sugestões (action === 'suggestion_used') */
  getAcceptanceRate: (grupoServico?: string, plaza?: string) => number;

  clearLogs: () => void;
}

/**
 * Recalcula os pesos adaptativos a partir dos logs de comportamento para um
 * determinado par grupoServico × plaza.
 *
 * Lógica principal:
 *  - Se o admin sistematicamente define preços acima do sugerido → biasCorrecao sobe
 *  - Se define abaixo → biasCorrecao desce
 *  - Quanto maior o n de amostras, mais confiante o bias
 */
function recalcWeights(logs: MLBehaviorLog[], existing: MLWeights): MLWeights {
  const overrides = logs.filter((l) => l.action === 'suggestion_overridden' && l.vendaDeltaPercent !== undefined);

  if (overrides.length === 0) return existing;

  const avgDelta =
    overrides.reduce((sum, l) => sum + (l.vendaDeltaPercent ?? 0), 0) / overrides.length;

  // Clamp bias entre -0.5 e +0.5
  const rawBias = avgDelta / 100; // converte percentual para fração
  const biasCorrecao = Math.max(-0.5, Math.min(0.5, rawBias));

  const nSamples = logs.length;

  // Quanto mais aceitação (suggestion_used), maior peso no histórico de preço
  const accepted = logs.filter((l) => l.action === 'suggestion_used').length;
  const acceptRate = nSamples > 0 ? accepted / nSamples : 0;
  const wHistoricoPreco = 0.25 + acceptRate * 0.15; // 0.25–0.40

  return {
    ...existing,
    wHistoricoPreco,
    biasCorrecao,
    nSamples,
  };
}

export const useMLBehaviorStore = create<MLBehaviorState>()(
  persist(
    (set, get) => ({
      logs: [],
      weights: {},

      logBehavior: (logData) => {
        const log: MLBehaviorLog = {
          ...logData,
          id: `ml-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          const newLogs = [...state.logs, log];

          // Recalcula pesos para esse par grupoServico × plaza
          const key = weightsKey(log.grupoServico, log.plaza);
          const existingWeights = state.weights[key] ?? DEFAULT_ML_WEIGHTS;
          const relevantLogs = newLogs.filter(
            (l) => l.grupoServico === log.grupoServico && l.plaza === log.plaza
          );
          const updatedWeights = recalcWeights(relevantLogs, existingWeights);

          return {
            logs: newLogs,
            weights: { ...state.weights, [key]: updatedWeights },
          };
        });
      },

      getWeights: (grupoServico, plaza) => {
        const key = weightsKey(grupoServico, plaza);
        return get().weights[key] ?? DEFAULT_ML_WEIGHTS;
      },

      getLogs: () => get().logs,

      getLogsByPlaza: (plaza) => get().logs.filter((l) => l.plaza === plaza),

      getAcceptanceRate: (grupoServico, plaza) => {
        let relevant = get().logs;
        if (grupoServico) relevant = relevant.filter((l) => l.grupoServico === grupoServico);
        if (plaza) relevant = relevant.filter((l) => l.plaza === plaza);
        if (relevant.length === 0) return 0;
        const accepted = relevant.filter((l) => l.action === 'suggestion_used').length;
        return (accepted / relevant.length) * 100;
      },

      clearLogs: () => {
        set({ logs: [], weights: {} });
      },
    }),
    {
      name: 'ml-behavior-storage',
    }
  )
);
