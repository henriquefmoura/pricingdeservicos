import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '../lib/supabase';
import * as authApi from '../services/api/authApi';

export type UserRole = 'master' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plaza?: string; // Praça do usuário (se aplicável)
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Tries Supabase Auth first; falls back to offline mock users. */
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  /** Restore session from Supabase on app start. */
  restoreSession: () => Promise<void>;
}

// ─── Offline / mock users (used when Supabase is NOT configured) ────────────
//
// ════════════════════════════════════════════════════════════════════════════
// COMO ADICIONAR NOVOS LOGINS MANUALMENTE:
//
// Copie o bloco abaixo e cole antes do fechamento do objeto (antes do `}`),
// substituindo os valores conforme necessário:
//
//   'email@empresa.com': {
//     password: 'senha123',
//     user: {
//       id: 'ID_UNICO',          // número único, ex: '99'
//       name: 'Nome do Usuário',
//       email: 'email@empresa.com',
//       role: 'user',            // 'master' | 'admin' | 'user'
//       plaza: 'Praça NOME',     // obrigatório para role 'admin' e 'user'
//     },
//   },
// ════════════════════════════════════════════════════════════════════════════
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  // ── Master ───────────────────────────────────────────────────────────────
  'master@empresa.com': {
    password: 'master123',
    user: { id: '1', name: 'Master', email: 'master@empresa.com', role: 'master' },
  },

  // ── Praça São Paulo (ADMIN) ──────────────────────────────────────────────
  'admin.sp@empresa.com': {
    password: 'admin123',
    user: { id: '2', name: 'Admin São Paulo', email: 'admin.sp@empresa.com', role: 'admin', plaza: 'Praça São Paulo' },
  },

  // ── Praça Brasília (ADMIN) ───────────────────────────────────────────────
  'admin.bsb@empresa.com': {
    password: 'admin123',
    user: { id: '3', name: 'Admin Brasília', email: 'admin.bsb@empresa.com', role: 'admin', plaza: 'Praça Brasília' },
  },

  // ── Praça São José (ADMIN) ───────────────────────────────────────────────
  'admin.sc@empresa.com': {
    password: 'admin123',
    user: { id: '4', name: 'Admin São José', email: 'admin.sc@empresa.com', role: 'admin', plaza: 'Praça São José' },
  },

  // ── Praça São Paulo (USER) ───────────────────────────────────────────────
  'usuario.sp@empresa.com': {
    password: 'user123',
    user: { id: '11', name: 'Usuário SP', email: 'usuario.sp@empresa.com', role: 'user', plaza: 'Praça São Paulo' },
  },

  // ── Praça RJ (USER) ──────────────────────────────────────────────────────
  'usuario.rj@empresa.com': {
    password: 'user123',
    user: { id: '21', name: 'Usuário RJ', email: 'usuario.rj@empresa.com', role: 'user', plaza: 'Praça RJ' },
  },

  // ── Adicione novos logins aqui ───────────────────────────────────────────
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        // ── Try Supabase Auth first ──
        if (isSupabaseConfigured()) {
          try {
            const authUser = await authApi.signIn(email, password);
            if (authUser) {
              set({
                user: {
                  id: authUser.id,
                  name: authUser.name,
                  email: authUser.email,
                  role: authUser.role,
                  plaza: authUser.plaza ?? undefined,
                },
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            }
          } catch (err) {
            console.error('[AuthStore] login error:', err);
          }
          // If Supabase rejects or throws, don't fall back to mock in online mode
          set({ isLoading: false });
          return false;
        }

        // ── Offline mock fallback ──
        const userRecord = MOCK_USERS[email];
        if (userRecord && userRecord.password === password) {
          set({ user: userRecord.user, isAuthenticated: true, isLoading: false });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: async () => {
        if (isSupabaseConfigured()) {
          await authApi.signOut();
        }
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      restoreSession: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          const authUser = await authApi.getCurrentUser();
          if (authUser) {
            set({
              user: {
                id: authUser.id,
                name: authUser.name,
                email: authUser.email,
                role: authUser.role,
                plaza: authUser.plaza ?? undefined,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          console.error('[AuthStore] restoreSession error:', err);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Never persist isLoading – it should always start as false
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);