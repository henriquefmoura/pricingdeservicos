// ============================================================================
// Sales Data Store — dados de vendas carregados semanalmente pelo master
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SalesSnapshot, SalesDataRow } from '../types/mlPricing';

interface SalesDataState {
  snapshots: SalesSnapshot[];
  isLoading: boolean;

  /** Adiciona um novo snapshot semanal */
  addSnapshot: (snapshot: Omit<SalesSnapshot, 'id'>) => void;

  /** Remove um snapshot pelo id */
  removeSnapshot: (id: string) => void;

  /** Retorna todos os snapshots em ordem cronológica */
  getAllSnapshots: () => SalesSnapshot[];

  /** Retorna as N semanas mais recentes de dados para um grupo × praça */
  getHistory: (grupoServico: string, plaza: string, nWeeks?: number) => SalesDataRow[];

  /** Retorna o snapshot mais recente */
  getLatestSnapshot: () => SalesSnapshot | null;

  /** Limpa todos os dados */
  clearAll: () => void;
}

export const useSalesDataStore = create<SalesDataState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      isLoading: false,

      addSnapshot: (snapshot) => {
        const newSnapshot: SalesSnapshot = {
          ...snapshot,
          id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          snapshots: [...state.snapshots, newSnapshot].sort(
            (a, b) => new Date(a.semanaReferencia).getTime() - new Date(b.semanaReferencia).getTime()
          ),
        }));
      },

      removeSnapshot: (id) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
        }));
      },

      getAllSnapshots: () => {
        return get().snapshots;
      },

      getHistory: (grupoServico, plaza, nWeeks = 12) => {
        const all = get().snapshots
          .slice(-nWeeks)
          .flatMap((s) => s.rows)
          .filter((r) => r.grupoServico === grupoServico && r.plaza === plaza);
        return all;
      },

      getLatestSnapshot: () => {
        const snaps = get().snapshots;
        if (snaps.length === 0) return null;
        return snaps[snaps.length - 1];
      },

      clearAll: () => {
        set({ snapshots: [] });
      },
    }),
    {
      name: 'ml-sales-data-storage',
    }
  )
);
