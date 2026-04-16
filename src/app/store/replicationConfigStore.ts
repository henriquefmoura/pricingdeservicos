import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReplicationRule {
  id: string;
  replicatorPlaza: string; // Praça replicadora (parâmetro)
  targetPlazas: string[]; // Praças que receberão a replicação
  isActive: boolean;
}

interface ReplicationConfigState {
  // Configurações
  rules: ReplicationRule[];
  
  // Ações
  addRule: (replicatorPlaza: string, targetPlazas: string[]) => void;
  updateRule: (ruleId: string, targetPlazas: string[]) => void;
  deleteRule: (ruleId: string) => void;
  toggleRuleActive: (ruleId: string) => void;
  
  // Helpers
  getTargetPlazasForReplicator: (replicatorPlaza: string) => string[];
  getAllReplicatorPlazas: () => string[];
  isPlazaReplicator: (plaza: string) => boolean;
  clearAllRules: () => void;
}

export const useReplicationConfigStore = create<ReplicationConfigState>()(
  persist(
    (set, get) => ({
      // Estado inicial com configuração dos 3 grupos usando nomes reais das praças
      rules: [
        {
          id: 'rule-1',
          replicatorPlaza: 'Praça São Paulo',
          targetPlazas: [
            'Praça RJ',
            'Praça BH',
            'Praça Uberlândia',
            'Praça Vitória',
            'Praça Brasília',
            'Praça Goiânia',
            'Praça Campo Grande',
            'Praça Curitiba',
            'Praça Londrina',
            'Praça São José',
            'Praça Joinville',
            'Praça Porto Alegre',
            'Praça São Leopoldo',
          ],
          isActive: true,
        },
        {
          id: 'rule-2',
          replicatorPlaza: 'Praça Salvador',
          targetPlazas: ['Praça Fortaleza', 'Praça Maceió', 'Praça Natal'],
          isActive: true,
        },
        {
          id: 'rule-3',
          replicatorPlaza: 'Praça ABC',
          targetPlazas: [
            'Praça Santos',
            'Praça Ribeirão Preto',
            'Praça Campinas',
            'Praça Sorocaba',
            'Praça São José do Rio Preto',
            'Praça São José dos Campos/Taubaté',
            'Praça Jundiaí',
          ],
          isActive: true,
        },
      ],

      // Adicionar nova regra
      addRule: (replicatorPlaza, targetPlazas) => {
        const newRule: ReplicationRule = {
          id: `rule-${Date.now()}`,
          replicatorPlaza,
          targetPlazas,
          isActive: true,
        };

        set((state) => ({
          rules: [...state.rules, newRule],
        }));
      },

      // Atualizar praças alvo de uma regra
      updateRule: (ruleId, targetPlazas) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === ruleId ? { ...rule, targetPlazas } : rule
          ),
        }));
      },

      // Deletar uma regra
      deleteRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== ruleId),
        }));
      },

      // Ativar/desativar uma regra
      toggleRuleActive: (ruleId) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
          ),
        }));
      },

      // Obter praças alvo para uma praça replicadora
      getTargetPlazasForReplicator: (replicatorPlaza) => {
        const rule = get().rules.find(
          (r) => r.replicatorPlaza === replicatorPlaza && r.isActive
        );
        return rule ? rule.targetPlazas : [];
      },

      // Obter todas as praças replicadoras
      getAllReplicatorPlazas: () => {
        return get()
          .rules.filter((r) => r.isActive)
          .map((r) => r.replicatorPlaza);
      },

      // Verificar se uma praça é replicadora
      isPlazaReplicator: (plaza) => {
        return get().rules.some(
          (r) => r.replicatorPlaza === plaza && r.isActive
        );
      },

      // Limpar todas as regras
      clearAllRules: () => {
        set({ rules: [] });
      },
    }),
    {
      name: 'replication-config-storage-v2',
    }
  )
);
