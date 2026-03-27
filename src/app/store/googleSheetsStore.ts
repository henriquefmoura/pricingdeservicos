import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { googleSheetsService, GoogleSheetsConfig } from '../services/googleSheetsService';

interface GoogleSheetsState {
  // Configurações
  config: GoogleSheetsConfig | null;
  isConfigured: boolean;
  
  // Estado de sincronização
  lastSync: Date | null;
  isSyncing: boolean;
  syncError: string | null;
  
  // Dados brutos da última sincronização
  rawData: Record<string, any>[] | null;
  
  // Ações
  setConfig: (config: GoogleSheetsConfig) => void;
  clearConfig: () => void;
  syncData: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  testConnection: () => Promise<{ success: boolean; message: string; preview?: any }>;
  clearData: () => void;
}

export const useGoogleSheetsStore = create<GoogleSheetsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: null,
      isConfigured: false,
      lastSync: null,
      isSyncing: false,
      syncError: null,
      rawData: null,

      // Configurar credenciais do Google Sheets
      setConfig: (config) => {
        googleSheetsService.setConfig(config);
        set({ 
          config, 
          isConfigured: true,
          syncError: null,
        });
      },

      // Limpar configuração
      clearConfig: () => {
        set({ 
          config: null, 
          isConfigured: false,
          lastSync: null,
          syncError: null,
          rawData: null,
        });
      },

      // Sincronizar dados do Google Sheets
      syncData: async () => {
        const { config } = get();
        
        if (!config) {
          const error = 'Google Sheets não configurado';
          set({ syncError: error });
          return { success: false, error };
        }

        set({ isSyncing: true, syncError: null });

        try {
          const data = await googleSheetsService.fetchAndConvert();
          
          set({ 
            rawData: data,
            lastSync: new Date(),
            isSyncing: false,
            syncError: null,
          });

          return { success: true, data };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          
          set({ 
            isSyncing: false,
            syncError: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      // Testar conexão
      testConnection: async () => {
        const { config } = get();
        
        if (!config) {
          return { 
            success: false, 
            message: 'Google Sheets não configurado' 
          };
        }

        try {
          return await googleSheetsService.testConnection();
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro desconhecido',
          };
        }
      },

      // Limpar dados
      clearData: () => {
        set({ 
          rawData: null,
          lastSync: null,
          syncError: null,
        });
      },
    }),
    {
      name: 'google-sheets-storage',
      // Não persiste o estado de sincronização (apenas config e dados)
      partialize: (state) => ({
        config: state.config,
        isConfigured: state.isConfigured,
        lastSync: state.lastSync,
        rawData: state.rawData,
      }),
    }
  )
);
