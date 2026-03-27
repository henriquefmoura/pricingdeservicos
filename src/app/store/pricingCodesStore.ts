import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PricingCode {
  id: string;
  tipo: 'Visita Técnica' | 'Serviço' | 'Complementar' | 'Deslocamento';
  descricao: string;
  unidade: string;
  codigoAtrelado?: string;
  codigoAvulso: string;
  prazo: string; // Prazo para preenchimento
  status: 'pendente' | 'em_andamento' | 'concluido';
  createdAt: Date;
  createdBy: string;
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

interface PricingCodesState {
  codes: PricingCode[];
  addCode: (code: Omit<PricingCode, 'id' | 'createdAt' | 'status'>) => void;
  addCodes: (codes: Omit<PricingCode, 'id' | 'createdAt' | 'status'>[]) => void;
  removeCode: (id: string) => void;
  updateCodePrice: (id: string, plaza: string, repasse: number, venda: number, preenchidoPor: string) => void;
  getCodesByStatus: (status: PricingCode['status']) => PricingCode[];
  getPendingCodesCount: () => number;
  clearCodes: () => void;
  initializeMockCodes: () => void;
}

export const usePricingCodesStore = create<PricingCodesState>()(
  persist(
    (set, get) => ({
      codes: [],

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
      },

      removeCode: (id) => {
        set((state) => ({
          codes: state.codes.filter((code) => code.id !== id),
        }));
      },

      updateCodePrice: (id, plaza, repasse, venda, preenchidoPor) => {
        set((state) => ({
          codes: state.codes.map((code) => {
            if (code.id === id) {
              const margem = ((venda - repasse) / venda) * 100;
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

              // Verificar se todas as praças foram preenchidas (considerando 27 praças)
              const filledPlazas = Object.keys(updatedCode.prices || {}).length;
              if (filledPlazas >= 27) {
                updatedCode.status = 'concluido';
              } else if (filledPlazas > 0) {
                updatedCode.status = 'em_andamento';
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
              tipo: 'Visita Técnica',
              descricao: 'Visita Técnica Renovação de Banheiro',
              unidade: 'un',
              codigoAvulso: '50041154',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Serviço',
              descricao: 'Renovação dos itens do banheiro (un)',
              unidade: 'un',
              codigoAvulso: '50041155',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Serviço',
              descricao: 'Aplicação Pintura Epóxi (c/ preparação) (m2)',
              unidade: 'm2',
              codigoAvulso: '50041157',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Serviço',
              descricao: 'Aplicação Pintura Epóxi (s/ preparação) (m2)',
              unidade: 'm2',
              codigoAvulso: '50041158',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Complementar',
              descricao: 'Adicional Inst. Box Padrão (un)',
              unidade: 'un',
              codigoAvulso: '50041156',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Complementar',
              descricao: 'Adicional Inst. Placas Flexíveis (m2)',
              unidade: 'm2',
              codigoAvulso: '50041369',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Complementar',
              descricao: 'Adicional Aplic. Cimento Queimado (m2)',
              unidade: 'm2',
              codigoAvulso: '50041370',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Complementar',
              descricao: 'Adicional Impermeabilização (m2)',
              unidade: 'm2',
              codigoAvulso: '50041371',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Complementar',
              descricao: 'Adicional de Obra (un)',
              unidade: 'un',
              codigoAvulso: '50041475',
              prazo: '16/03 à 31/03',
              createdBy: 'Master Admin',
              prices: {},
            },
            {
              tipo: 'Deslocamento',
              descricao: 'Deslocamento Renovação de Banheiro',
              unidade: 'km',
              codigoAvulso: '50041159',
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
