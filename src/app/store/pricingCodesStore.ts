import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '../lib/supabase';
import * as pricingCodesApi from '../services/api/pricingCodesApi';
import { ALL_PLAZAS as PLAZAS_LIST, calculateMargemComImpostos } from '../data/plazasData';

export type PricingCodeTipo = 'Visita Técnica' | 'Serviço' | 'Inst + Pague -' | 'Emergencial' | 'Complementar' | 'Deslocamento' | 'Reforma';

// Chave para códigos sem grupo de serviço
export const UNGROUPED_KEY = '__sem_grupo__';

// Lista de todas as 26 praças (importada de plazasData.ts)
export const ALL_PLAZAS = PLAZAS_LIST;

export interface PricingCode {
  id: string;
  grupoServico?: string; // Grupo de Serviço para agrupamento
  tipo: PricingCodeTipo;
  descricao: string;
  unidade: string;
  codigoAtrelado?: string;
  codigoAvulso?: string;
  prazo: string; // Prazo para preenchimento
  status: 'pendente' | 'em_andamento' | 'concluido';
  createdAt: Date;
  createdBy: string;
  targetPlazas?: string[]; // Praças alvo para este código
  fichaTecnica?: string; // URL da ficha técnica do serviço
  comentario?: string; // Comentário/observação sobre o serviço
  prices?: {
    [plaza: string]: {
      repasse: number;
      venda: number;
      margem: number;
      preenchidoPor?: string;
      preenchidoEm?: Date;
    };
  };
}

export interface GroupMeta {
  fichaTecnica?: string;
  comentario?: string;
}

interface PricingCodesState {
  codes: PricingCode[];
  groupMetadata: Record<string, GroupMeta>;
  isLoading: boolean;
  addCode: (code: Omit<PricingCode, 'id' | 'createdAt' | 'status'>) => void;
  addCodes: (codes: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[]) => void;
  removeCode: (id: string) => void;
  updateCodePrice: (id: string, plaza: string, repasse: number, venda: number, preenchidoPor: string) => void;
  updateCodeMeta: (id: string, meta: { fichaTecnica?: string; comentario?: string }) => void;
  updateGroupMeta: (groupName: string, meta: GroupMeta) => void;
  getCodesByStatus: (status: PricingCode['status']) => PricingCode[];
  getPendingCodesCount: () => number;
  clearCodes: () => void;
  initializeMockCodes: () => void;
  /** Load codes from Supabase (no-op when offline). */
  syncFromBackend: () => Promise<void>;
}

export const usePricingCodesStore = create<PricingCodesState>()(
  persist(
    (set, get) => ({
      codes: [],
      groupMetadata: {},
      isLoading: false,

      syncFromBackend: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          const [dbCodes, dbPrices] = await Promise.all([
            pricingCodesApi.fetchPricingCodes(),
            pricingCodesApi.fetchAllPrices(),
          ]);
          if (dbCodes) {
            // Build a map of code_id → prices
            const priceMap = new Map<string, PricingCode['prices']>();
            if (dbPrices) {
              for (const p of dbPrices) {
                if (!priceMap.has(p.code_id)) priceMap.set(p.code_id, {});
                priceMap.get(p.code_id)![p.plaza] = {
                  repasse: Number(p.repasse),
                  venda: Number(p.venda),
                  margem: Number(p.margem),
                  preenchidoPor: p.preenchido_por ?? undefined,
                  preenchidoEm: p.preenchido_em ? new Date(p.preenchido_em) : undefined,
                };
              }
            }
            const codes: PricingCode[] = dbCodes.map((c) => ({
              id: c.id,
              grupoServico: c.grupo_servico ?? undefined,
              tipo: c.tipo as PricingCodeTipo,
              descricao: c.descricao,
              unidade: c.unidade,
              codigoAtrelado: c.codigo_atrelado ?? undefined,
              codigoAvulso: c.codigo_avulso ?? undefined,
              prazo: c.prazo,
              status: c.status as PricingCode['status'],
              createdAt: new Date(c.created_at),
              createdBy: c.created_by,
              targetPlazas: c.target_plazas ?? undefined,
              prices: priceMap.get(c.id) ?? {},
            }));
            set({ codes });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addCode: (code) => {
        const newCode: PricingCode = {
          ...code,
          id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          status: 'pendente',
        };
        set((state) => ({
          codes: [...state.codes, newCode],
        }));

        // Sync to backend (fire and forget)
        if (isSupabaseConfigured()) {
          pricingCodesApi.insertPricingCode({
            grupo_servico: code.grupoServico ?? null,
            tipo: code.tipo,
            descricao: code.descricao,
            unidade: code.unidade,
            codigo_atrelado: code.codigoAtrelado ?? null,
            codigo_avulso: code.codigoAvulso ?? null,
            prazo: code.prazo,
            created_by: code.createdBy,
            target_plazas: code.targetPlazas ?? null,
          }).then((dbCode) => {
            if (dbCode) {
              // Replace the temporary ID with the Supabase UUID
              set((state) => ({
                codes: state.codes.map((c) =>
                  c.id === newCode.id ? { ...c, id: dbCode.id, createdAt: new Date(dbCode.created_at) } : c
                ),
              }));
            }
          });
        }
      },

      addCodes: (codes) => {
        const newCodes = codes.map((code) => ({
          ...code,
          id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          status: 'pendente' as const,
        }));
        set((state) => ({
          codes: [...state.codes, ...newCodes],
        }));

        if (isSupabaseConfigured()) {
          const dbInserts = codes.map((code) => ({
            grupo_servico: code.grupoServico ?? null,
            tipo: code.tipo,
            descricao: code.descricao,
            unidade: code.unidade,
            codigo_atrelado: code.codigoAtrelado ?? null,
            codigo_avulso: code.codigoAvulso ?? null,
            prazo: code.prazo,
            created_by: code.createdBy,
            target_plazas: code.targetPlazas ?? null,
          }));
          pricingCodesApi.insertPricingCodes(dbInserts).then(() => {
            // Refresh from backend to get real IDs
            get().syncFromBackend();
          });
        }
      },

      removeCode: (id) => {
        set((state) => ({
          codes: state.codes.filter((code) => code.id !== id),
        }));
        if (isSupabaseConfigured()) {
          pricingCodesApi.deletePricingCode(id);
        }
      },

      updateCodePrice: (id, plaza, repasse, venda, preenchidoPor) => {
        set((state) => ({
          codes: state.codes.map((code) => {
            if (code.id === id) {
              const margem = calculateMargemComImpostos(venda, repasse, plaza);
              const updatedCode = {
                ...code,
                prices: {
                  ...code.prices,
                  [plaza]: {
                    repasse,
                    venda,
                    margem,
                    preenchidoPor,
                    preenchidoEm: new Date(),
                  },
                },
              };

              // Verificar se todas as praças foram preenchidas
              const filledPlazas = Object.keys(updatedCode.prices || {}).length;
              const totalPlazas = code.targetPlazas?.length || ALL_PLAZAS.length;
              if (filledPlazas >= totalPlazas) {
                updatedCode.status = 'concluido';
              } else if (filledPlazas > 0) {
                updatedCode.status = 'em_andamento';
              }

              // Sync price to backend
              if (isSupabaseConfigured()) {
                pricingCodesApi.upsertPrice(id, plaza, repasse, venda, margem, preenchidoPor);
                if (updatedCode.status !== code.status) {
                  pricingCodesApi.updatePricingCodeStatus(id, updatedCode.status);
                }
              }

              return updatedCode;
            }
            return code;
          }),
        }));
      },

      getCodesByStatus: (status) => {
        return get().codes.filter((code) => code.status === status);
      },

      updateCodeMeta: (id, meta) => {
        set((state) => ({
          codes: state.codes.map((code) =>
            code.id === id ? { ...code, ...meta } : code
          ),
        }));
      },

      updateGroupMeta: (groupName, meta) => {
        set((state) => ({
          groupMetadata: {
            ...state.groupMetadata,
            [groupName]: {
              ...state.groupMetadata[groupName],
              ...meta,
            },
          },
        }));
      },

      getPendingCodesCount: () => {
        return get().codes.filter((code) => code.status === 'pendente').length;
      },

      clearCodes: () => {
        set({ codes: [] });
      },

      initializeMockCodes: () => {
        const currentCodes = get().codes;
        if (currentCodes.length === 0) {
          const mockCodes: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[] = [
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Visita Técnica',
              descricao: 'Visita Téc Chuveiro/Torneira Elétrica',
              unidade: 'un',
              codigoAvulso: '50000515',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Serviço',
              descricao: 'Subst/Inst de Chuveiro Elétrico (un)',
              unidade: 'un',
              codigoAtrelado: '49050960',
              codigoAvulso: '50019855',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Inst + Pague -',
              descricao: '(+2un) Subst/Inst Chuveiro Eletrico',
              unidade: 'un',
              codigoAtrelado: '50018045',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Emergencial',
              descricao: '(Express) Subst/Inst Chuveiro Elét',
              unidade: 'un',
              codigoAtrelado: '50019312',
              codigoAvulso: '50022134',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Complementar',
              descricao: 'Inst. Pressurizador de Chuveiro (un)',
              unidade: 'un',
              codigoAtrelado: '50000510',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              grupoServico: 'Chuveiro/Torneira Elétrica',
              tipo: 'Deslocamento',
              descricao: 'Desloc Prestador Chuveiro/Torneira Elét',
              unidade: 'un',
              codigoAtrelado: '50000825',
              codigoAvulso: '50026524',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
          ];

          get().addCodes(mockCodes);
        }
      },
    }),
    {
      name: 'pricing-codes-storage',
    }
  )
);
