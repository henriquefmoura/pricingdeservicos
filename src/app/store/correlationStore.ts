import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParameterPlaza } from '../types/pricing';

interface CorrelationState {
  parameterPlazas: ParameterPlaza[];
  setParameterPlazas: (plazas: ParameterPlaza[]) => void;
  getSimilarPlazas: (plaza: string) => string[];
  initializeMockData: () => void;
}

// Dados mock de análise de correlação - CORRIGIDOS para o tipo correto
const MOCK_PARAMETER_PLAZAS: ParameterPlaza[] = [
  {
    name: 'SP',
    score: 82.5,
    dependentPlazas: [
      { name: 'MG', avgVariationRepasse: 5.2, avgVariationVenda: 7.5, avgVariationMargem: 2.1, consistency: 85.2 },
      { name: 'PR', avgVariationRepasse: 6.1, avgVariationVenda: 8.2, avgVariationMargem: 2.3, consistency: 83.8 },
      { name: 'SC', avgVariationRepasse: 7.0, avgVariationVenda: 9.1, avgVariationMargem: 2.5, consistency: 81.4 },
      { name: 'RS', avgVariationRepasse: 7.8, avgVariationVenda: 9.8, avgVariationMargem: 2.7, consistency: 80.6 },
      { name: 'ES', avgVariationRepasse: 8.5, avgVariationVenda: 10.5, avgVariationMargem: 2.9, consistency: 79.3 },
      { name: 'MS', avgVariationRepasse: 9.2, avgVariationVenda: 11.2, avgVariationMargem: 3.1, consistency: 78.1 },
    ],
  },
  {
    name: 'RJ',
    score: 75.3,
    dependentPlazas: [
      { name: 'BA', avgVariationRepasse: 9.5, avgVariationVenda: 11.9, avgVariationMargem: 3.2, consistency: 76.8 },
      { name: 'PE', avgVariationRepasse: 10.8, avgVariationVenda: 13.1, avgVariationMargem: 3.5, consistency: 74.2 },
      { name: 'CE', avgVariationRepasse: 11.5, avgVariationVenda: 13.8, avgVariationMargem: 3.7, consistency: 73.5 },
      { name: 'PB', avgVariationRepasse: 12.2, avgVariationVenda: 14.5, avgVariationMargem: 3.9, consistency: 72.1 },
      { name: 'RN', avgVariationRepasse: 13.0, avgVariationVenda: 15.2, avgVariationMargem: 4.1, consistency: 71.6 },
    ],
  },
  {
    name: 'DF',
    score: 70.8,
    dependentPlazas: [
      { name: 'GO', avgVariationRepasse: 12.5, avgVariationVenda: 14.8, avgVariationMargem: 3.8, consistency: 72.3 },
      { name: 'MT', avgVariationRepasse: 14.0, avgVariationVenda: 16.2, avgVariationMargem: 4.2, consistency: 69.7 },
      { name: 'TO', avgVariationRepasse: 15.2, avgVariationVenda: 17.1, avgVariationMargem: 4.5, consistency: 68.2 },
      { name: 'RO', avgVariationRepasse: 16.0, avgVariationVenda: 17.8, avgVariationMargem: 4.8, consistency: 67.5 },
    ],
  },
];

export const useCorrelationStore = create<CorrelationState>()(
  persist(
    (set, get) => ({
      parameterPlazas: [],

      initializeMockData: () => {
        const current = get().parameterPlazas;
        if (current.length === 0) {
          set({ parameterPlazas: MOCK_PARAMETER_PLAZAS });
        }
      },

      setParameterPlazas: (plazas) => {
        set({ parameterPlazas: plazas });
      },

      // Retorna praças similares para uma praça específica
      getSimilarPlazas: (plaza: string) => {
        const { parameterPlazas } = get();
        
        // Se a praça for parâmetro, retorna suas dependentes
        const asParameter = parameterPlazas.find(p => p.name === plaza);
        if (asParameter) {
          return asParameter.dependentPlazas.map(d => d.name);
        }
        
        // Se a praça for dependente, retorna outras dependentes da mesma praça parâmetro
        for (const param of parameterPlazas) {
          const isDependent = param.dependentPlazas.find(d => d.name === plaza);
          if (isDependent) {
            return param.dependentPlazas
              .filter(d => d.name !== plaza)
              .map(d => d.name);
          }
        }
        
        return [];
      },
    }),
    {
      name: 'correlation-storage',
    }
  )
);