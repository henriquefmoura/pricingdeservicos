import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PricingStrategy = 'below_market' | 'match_market' | 'above_market';

export interface CompetitorPrice {
  id: string;
  concorrente: string;
  preco: number;
  adicionadoEm: Date;
  adicionadoPor: string;
}

export interface MarketResearch {
  codigoAvulso: string;
  descricao: string;
  precosConcorrentes: CompetitorPrice[];
}

interface MarketResearchState {
  researches: MarketResearch[];
  strategy: PricingStrategy;
  addCompetitorPrice: (
    codigoAvulso: string,
    descricao: string,
    concorrente: string,
    preco: number,
    adicionadoPor: string
  ) => void;
  removeCompetitorPrice: (codigoAvulso: string, competitorId: string) => void;
  getResearchByCode: (codigoAvulso: string) => MarketResearch | undefined;
  getSuggestedPrice: (codigoAvulso: string, prestadorPrices?: number[]) => number | null;
  setStrategy: (strategy: PricingStrategy) => void;
  clearResearches: () => void;
  initializeMockResearches: () => void;
}

export const useMarketResearchStore = create<MarketResearchState>()(
  persist(
    (set, get) => ({
      researches: [],
      strategy: 'match_market',

      addCompetitorPrice: (codigoAvulso, descricao, concorrente, preco, adicionadoPor) => {
        set((state) => {
          const existingResearch = state.researches.find(
            (r) => r.codigoAvulso === codigoAvulso
          );

          if (existingResearch) {
            // Adicionar preço de concorrente a pesquisa existente
            return {
              researches: state.researches.map((r) =>
                r.codigoAvulso === codigoAvulso
                  ? {
                      ...r,
                      precosConcorrentes: [
                        ...r.precosConcorrentes,
                        {
                          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          concorrente,
                          preco,
                          adicionadoEm: new Date(),
                          adicionadoPor,
                        },
                      ],
                    }
                  : r
              ),
            };
          } else {
            // Criar nova pesquisa
            return {
              researches: [
                ...state.researches,
                {
                  codigoAvulso,
                  descricao,
                  precosConcorrentes: [
                    {
                      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      concorrente,
                      preco,
                      adicionadoEm: new Date(),
                      adicionadoPor,
                    },
                  ],
                },
              ],
            };
          }
        });
      },

      removeCompetitorPrice: (codigoAvulso, competitorId) => {
        set((state) => ({
          researches: state.researches
            .map((r) => {
              if (r.codigoAvulso === codigoAvulso) {
                const newPrices = r.precosConcorrentes.filter(
                  (c) => c.id !== competitorId
                );
                // Se não houver mais preços, remover a pesquisa inteira
                if (newPrices.length === 0) {
                  return null;
                }
                return {
                  ...r,
                  precosConcorrentes: newPrices,
                };
              }
              return r;
            })
            .filter((r) => r !== null) as MarketResearch[],
        }));
      },

      getResearchByCode: (codigoAvulso) => {
        return get().researches.find((r) => r.codigoAvulso === codigoAvulso);
      },

      getSuggestedPrice: (codigoAvulso, prestadorPrices = []) => {
        const research = get().getResearchByCode(codigoAvulso);
        const currentStrategy = get().strategy;
        
        if (!research || research.precosConcorrentes.length === 0) {
          // Se não há pesquisa de mercado, mas há preços de prestadores
          if (prestadorPrices.length > 0) {
            const avg = prestadorPrices.reduce((sum, p) => sum + p, 0) / prestadorPrices.length;
            return avg;
          }
          return null;
        }

        const competitorPrices = research.precosConcorrentes.map((c) => c.preco);
        const allPrices = [...competitorPrices, ...prestadorPrices];

        if (allPrices.length === 0) return null;

        // Definir pesos baseados na estratégia configurada
        let competitorWeight: number;
        let prestadorWeight: number;

        switch (currentStrategy) {
          case 'below_market':
            // Precificar abaixo do mercado: menor peso para concorrentes
            competitorWeight = 0.8;
            prestadorWeight = 1.2;
            break;
          case 'match_market':
            // Preço de mercado: pesos iguais
            competitorWeight = 1.0;
            prestadorWeight = 1.0;
            break;
          case 'above_market':
            // Seguir/exceder mercado: maior peso para concorrentes
            competitorWeight = 1.5;
            prestadorWeight = 1.0;
            break;
          default:
            competitorWeight = 1.0;
            prestadorWeight = 1.0;
        }

        const competitorSum = competitorPrices.reduce((sum, p) => sum + p, 0) * competitorWeight;
        const prestadorSum = prestadorPrices.reduce((sum, p) => sum + p, 0) * prestadorWeight;
        
        const totalWeight = (competitorPrices.length * competitorWeight) + (prestadorPrices.length * prestadorWeight);
        
        if (totalWeight === 0) return null;
        
        const weightedAvg = (competitorSum + prestadorSum) / totalWeight;
        
        return weightedAvg;
      },

      setStrategy: (strategy) => {
        set({ strategy });
      },

      clearResearches: () => {
        set({ researches: [] });
      },

      initializeMockResearches: () => {
        const currentResearches = get().researches;
        if (currentResearches.length === 0) {
          // Adicionar pesquisas mock para alguns códigos
          const mockResearches: MarketResearch[] = [
            {
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              precosConcorrentes: [
                {
                  id: 'comp-mock-1',
                  concorrente: 'Construtora ABC',
                  preco: 180.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-2',
                  concorrente: 'Reformas XYZ',
                  preco: 200.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-3',
                  concorrente: 'Casa & Cia',
                  preco: 175.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
              ],
            },
            {
              codigoAvulso: '50041155',
              descricao: 'Renovação dos itens do banheiro (un)',
              precosConcorrentes: [
                {
                  id: 'comp-mock-4',
                  concorrente: 'Construtora ABC',
                  preco: 2500.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-5',
                  concorrente: 'Reformas XYZ',
                  preco: 2800.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
              ],
            },
            {
              codigoAvulso: '50041157',
              descricao: 'Aplicação Pintura Epóxi (c/ preparação) (m2)',
              precosConcorrentes: [
                {
                  id: 'comp-mock-6',
                  concorrente: 'Pinturas Premium',
                  preco: 85.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-7',
                  concorrente: 'Reformas XYZ',
                  preco: 90.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-8',
                  concorrente: 'Casa & Cia',
                  preco: 78.00,
                  adicionadoEm: new Date(),
                  adicionadoPor: 'Admin São Paulo',
                },
              ],
            },
          ];

          set({ researches: mockResearches });
        }
      },
    }),
    {
      name: 'market-research-storage',
    }
  )
);