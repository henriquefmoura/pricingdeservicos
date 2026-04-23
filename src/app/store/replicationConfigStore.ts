import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DbReplicationRule } from '../lib/database.types';

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

  /** Sincroniza regras de replicação do banco de dados Supabase */
  syncFromBackend: () => Promise<void>;
}

export const useReplicationConfigStore = create<ReplicationConfigState>()(
  persist(
    (set, get) => ({
      // Estado inicial: 3 praças admin como replicadoras
      rules: [
        {
          id: 'rule-1',
          replicatorPlaza: 'Praça São Paulo',
          // SP replica para o Sudeste, Nordeste e interior paulista
          targetPlazas: [
            'Praça RJ',
            'Praça BH',
            'Praça Uberlândia',
            'Praça Vitória',
            'Praça Salvador',
            'Praça Fortaleza',
            'Praça Maceió',
            'Praça Natal',
            'Praça ABC',
            'Praça Santos',
            'Praça Ribeirão Preto',
            'Praça São José do Rio Preto',
            'Praça São José dos Campos/Taubaté',
            'Praça Campinas',
            'Praça Sorocaba',
            'Praça Jundiaí',
          ],
          isActive: true,
        },
        {
          id: 'rule-2',
          replicatorPlaza: 'Praça Brasília',
          // Brasília replica para o Centro-Oeste
          targetPlazas: [
            'Praça Goiânia',
            'Praça Campo Grande',
          ],
          isActive: true,
        },
        {
          id: 'rule-3',
          replicatorPlaza: 'Praça São José',
          // São José replica para o Sul
          targetPlazas: [
            'Praça Curitiba',
            'Praça Londrina',
            'Praça Porto Alegre',
            'Praça São Leopoldo',
            'Praça Joinville',
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

      // Sincroniza regras de replicação do banco de dados Supabase
      syncFromBackend: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const { data, error } = await supabase!
            .from('replication_rules')
            .select('*')
            .order('created_at', { ascending: true });

          if (error) throw error;
          const rows = data as DbReplicationRule[] | null;
          if (!rows || rows.length === 0) return;

          const rules: ReplicationRule[] = rows.map((r) => ({
            id: r.id,
            replicatorPlaza: r.replicator_plaza,
            targetPlazas: r.target_plazas ?? [],
            isActive: r.is_active,
          }));

          set({ rules });
        } catch (err) {
          console.error('[replicationConfigStore] syncFromBackend error:', err);
        }
      },
    }),
    {
      name: 'replication-config-storage-v3',
    }
  )
);
