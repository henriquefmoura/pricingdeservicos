import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PricingCodeTipo = 'Visita Técnica' | 'Serviço' | 'Inst + Pague -' | 'Emergencial' | 'Complementar' | 'Deslocamento';

// Lista de todas as 27 praças
export const ALL_PLAZAS = [
  'SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 
  'DF', 'GO', 'MT', 'MS', 'BA', 'SE', 'AL', 
  'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'AM', 
  'PA', 'AC', 'RO', 'RR', 'AP', 'TO'
];

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

              // Verificar se todas as praças foram preenchidas
              const filledPlazas = Object.keys(updatedCode.prices || {}).length;
              const totalPlazas = code.targetPlazas?.length || ALL_PLAZAS.length;
              if (filledPlazas >= totalPlazas) {
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
