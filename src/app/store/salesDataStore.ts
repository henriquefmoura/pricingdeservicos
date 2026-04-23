// ============================================================================
// Sales Data Store — dados de vendas carregados semanalmente pelo master
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SalesSnapshot, SalesDataRow } from '../types/mlPricing';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

  /** Sincroniza snapshots e rows do banco de dados Supabase */
  syncFromBackend: () => Promise<void>;
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

      syncFromBackend: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          // Fetch all snapshots
          const { data: snapshotRows, error: snapshotError } = await supabase!
            .from('ml_sales_snapshots')
            .select('*')
            .order('semana_referencia', { ascending: true });

          if (snapshotError) throw snapshotError;
          if (!snapshotRows || snapshotRows.length === 0) {
            set({ isLoading: false });
            return;
          }

          // Fetch all sales rows for these snapshots
          const snapshotIds = snapshotRows.map((s) => s.id);
          const { data: salesRows, error: rowsError } = await supabase!
            .from('ml_sales_rows')
            .select('*')
            .in('snapshot_id', snapshotIds);

          if (rowsError) throw rowsError;

          const rowsBySnapshot: Record<string, SalesDataRow[]> = {};
          for (const row of salesRows ?? []) {
            if (!rowsBySnapshot[row.snapshot_id]) rowsBySnapshot[row.snapshot_id] = [];
            rowsBySnapshot[row.snapshot_id].push({
              grupoServico: row.grupo_servico,
              plaza: row.plaza,
              semana: row.semana,
              totalOs: row.total_os,
              osConvertidas: row.os_convertidas,
              taxaConversao: Number(row.taxa_conversao),
              adesoes: row.adesoes,
              taxaAdesao: Number(row.taxa_adesao),
              precoMedioVenda: Number(row.preco_medio_venda),
              precoMedioRepasse: Number(row.preco_medio_repasse),
              prestadoresAtivos: row.prestadores_ativos,
              redeConcorrentes: row.rede_concorrentes,
              capacidadeCompraRegional: row.capacidade_compra_regional,
              receitaTotal: row.receita_total != null ? Number(row.receita_total) : undefined,
              observacoes: row.observacoes ?? undefined,
            });
          }

          const snapshots: SalesSnapshot[] = snapshotRows.map((s) => ({
            id: s.id,
            uploadedAt: s.uploaded_at,
            uploadedBy: s.uploaded_by,
            semanaReferencia: s.semana_referencia,
            rowCount: s.row_count,
            rows: rowsBySnapshot[s.id] ?? [],
          }));

          set({ snapshots, isLoading: false });
        } catch (err) {
          console.error('[salesDataStore] syncFromBackend error:', err);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'ml-sales-data-storage',
    }
  )
);
