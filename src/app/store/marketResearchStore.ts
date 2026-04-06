import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PricingStrategy = 'below_market' | 'match_market' | 'above_market';

export type PriceHistoryAction = 'added' | 'removed' | 'updated';

export interface CompetitorPrice {
  id: string;
  concorrente: string;
  preco: number;
  adicionadoEm: string;
  adicionadoPor: string;
}

export interface PriceHistoryEntry {
  id: string;
  codigoAvulso: string;
  descricao: string;
  concorrente: string;
  preco: number;
  precoAnterior?: number;
  acao: PriceHistoryAction;
  timestamp: string;
  registradoPor: string;
}

export interface MarketResearch {
  codigoAvulso: string;
  descricao: string;
  precosConcorrentes: CompetitorPrice[];
}

interface MarketResearchState {
  researches: MarketResearch[];
  strategy: PricingStrategy;
  priceHistory: PriceHistoryEntry[];
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
  getPriceHistoryByCode: (codigoAvulso: string) => PriceHistoryEntry[];
  getAllPriceHistory: () => PriceHistoryEntry[];
  exportData: () => { researches: MarketResearch[]; priceHistory: PriceHistoryEntry[]; strategy: PricingStrategy; exportedAt: string };
}

export const useMarketResearchStore = create<MarketResearchState>()(
  persist(
    (set, get) => ({
      researches: [],
      strategy: 'match_market',
      priceHistory: [],

      addCompetitorPrice: (codigoAvulso, descricao, concorrente, preco, adicionadoPor) => {
        const now = new Date().toISOString();
        const historyId = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        set((state) => {
          const existingResearch = state.researches.find(
            (r) => r.codigoAvulso === codigoAvulso
          );

          // Verificar se já existe um preço para o mesmo concorrente nesse serviço
          const existingCompetitorPrice = existingResearch?.precosConcorrentes.find(
            (c) => c.concorrente.toLowerCase() === concorrente.toLowerCase()
          );

          const isUpdate = !!existingCompetitorPrice;
          const precoAnterior = existingCompetitorPrice?.preco;

          // Registrar no histórico
          const historyEntry: PriceHistoryEntry = {
            id: historyId,
            codigoAvulso,
            descricao,
            concorrente,
            preco,
            precoAnterior: isUpdate ? precoAnterior : undefined,
            acao: isUpdate ? 'updated' : 'added',
            timestamp: now,
            registradoPor: adicionadoPor,
          };

          if (existingResearch) {
            if (isUpdate) {
              // Atualizar preço existente do concorrente
              return {
                researches: state.researches.map((r) =>
                  r.codigoAvulso === codigoAvulso
                    ? {
                        ...r,
                        precosConcorrentes: r.precosConcorrentes.map((c) =>
                          c.concorrente.toLowerCase() === concorrente.toLowerCase()
                            ? { ...c, preco, adicionadoEm: now, adicionadoPor }
                            : c
                        ),
                      }
                    : r
                ),
                priceHistory: [...state.priceHistory, historyEntry],
              };
            }

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
                          adicionadoEm: now,
                          adicionadoPor,
                        },
                      ],
                    }
                  : r
              ),
              priceHistory: [...state.priceHistory, historyEntry],
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
                      adicionadoEm: now,
                      adicionadoPor,
                    },
                  ],
                },
              ],
              priceHistory: [...state.priceHistory, historyEntry],
            };
          }
        });
      },

      removeCompetitorPrice: (codigoAvulso, competitorId) => {
        set((state) => {
          // Encontrar o concorrente sendo removido para registrar no histórico
          const research = state.researches.find((r) => r.codigoAvulso === codigoAvulso);
          const removedCompetitor = research?.precosConcorrentes.find((c) => c.id === competitorId);

          const historyEntry: PriceHistoryEntry | null = removedCompetitor
            ? {
                id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                codigoAvulso,
                descricao: research?.descricao || '',
                concorrente: removedCompetitor.concorrente,
                preco: removedCompetitor.preco,
                acao: 'removed',
                timestamp: new Date().toISOString(),
                registradoPor: removedCompetitor.adicionadoPor,
              }
            : null;

          return {
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
            priceHistory: historyEntry
              ? [...state.priceHistory, historyEntry]
              : state.priceHistory,
          };
        });
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
        set({ researches: [], priceHistory: [] });
      },

      getPriceHistoryByCode: (codigoAvulso) => {
        return get()
          .priceHistory.filter((h) => h.codigoAvulso === codigoAvulso)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      getAllPriceHistory: () => {
        return [...get().priceHistory].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      exportData: () => {
        const state = get();
        return {
          researches: state.researches,
          priceHistory: state.priceHistory,
          strategy: state.strategy,
          exportedAt: new Date().toISOString(),
        };
      },

      initializeMockResearches: () => {
        const currentResearches = get().researches;
        if (currentResearches.length === 0) {
          const now = new Date().toISOString();
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

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
                  adicionadoEm: oneWeekAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-2',
                  concorrente: 'Reformas XYZ',
                  preco: 200.00,
                  adicionadoEm: oneWeekAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-3',
                  concorrente: 'Casa & Cia',
                  preco: 175.00,
                  adicionadoEm: twoWeeksAgo,
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
                  adicionadoEm: oneWeekAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-5',
                  concorrente: 'Reformas XYZ',
                  preco: 2800.00,
                  adicionadoEm: twoWeeksAgo,
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
                  adicionadoEm: twoWeeksAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-7',
                  concorrente: 'Reformas XYZ',
                  preco: 90.00,
                  adicionadoEm: oneWeekAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
                {
                  id: 'comp-mock-8',
                  concorrente: 'Casa & Cia',
                  preco: 78.00,
                  adicionadoEm: threeWeeksAgo,
                  adicionadoPor: 'Admin São Paulo',
                },
              ],
            },
          ];

          // Criar histórico mock correspondente
          const mockHistory: PriceHistoryEntry[] = [
            {
              id: 'hist-mock-1',
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              concorrente: 'Casa & Cia',
              preco: 175.00,
              acao: 'added',
              timestamp: twoWeeksAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-2',
              codigoAvulso: '50041157',
              descricao: 'Aplicação Pintura Epóxi (c/ preparação) (m2)',
              concorrente: 'Casa & Cia',
              preco: 78.00,
              acao: 'added',
              timestamp: threeWeeksAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-3',
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              concorrente: 'Construtora ABC',
              preco: 180.00,
              acao: 'added',
              timestamp: oneWeekAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-4',
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              concorrente: 'Reformas XYZ',
              preco: 200.00,
              acao: 'added',
              timestamp: oneWeekAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-5',
              codigoAvulso: '50041155',
              descricao: 'Renovação dos itens do banheiro (un)',
              concorrente: 'Construtora ABC',
              preco: 2500.00,
              acao: 'added',
              timestamp: oneWeekAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-6',
              codigoAvulso: '50041155',
              descricao: 'Renovação dos itens do banheiro (un)',
              concorrente: 'Reformas XYZ',
              preco: 2800.00,
              acao: 'added',
              timestamp: twoWeeksAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-7',
              codigoAvulso: '50041157',
              descricao: 'Aplicação Pintura Epóxi (c/ preparação) (m2)',
              concorrente: 'Pinturas Premium',
              preco: 85.00,
              acao: 'added',
              timestamp: twoWeeksAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-8',
              codigoAvulso: '50041157',
              descricao: 'Aplicação Pintura Epóxi (c/ preparação) (m2)',
              concorrente: 'Reformas XYZ',
              preco: 90.00,
              acao: 'added',
              timestamp: oneWeekAgo,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-9',
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              concorrente: 'Construtora ABC',
              preco: 180.00,
              precoAnterior: 170.00,
              acao: 'updated',
              timestamp: now,
              registradoPor: 'Admin São Paulo',
            },
            {
              id: 'hist-mock-0',
              codigoAvulso: '50041154',
              descricao: 'Visita Técnica Renovação de Banheiro',
              concorrente: 'Construtora ABC',
              preco: 170.00,
              acao: 'added',
              timestamp: threeWeeksAgo,
              registradoPor: 'Admin São Paulo',
            },
          ];

          set({ researches: mockResearches, priceHistory: mockHistory });
        }
      },
    }),
    {
      name: 'market-research-storage',
    }
  )
);