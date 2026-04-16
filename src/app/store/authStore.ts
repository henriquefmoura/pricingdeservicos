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

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'master@empresa.com': {
    password: 'master123',
    user: { id: '1', name: 'Master', email: 'master@empresa.com', role: 'master' },
  },
  'admin.sp@empresa.com': {
    password: 'admin123',
    user: { id: '2', name: 'Admin São Paulo', email: 'admin.sp@empresa.com', role: 'admin', plaza: 'Praça São Paulo' },
  },
  'admin.rj@empresa.com': {
    password: 'admin123',
    user: { id: '3', name: 'Admin Rio de Janeiro', email: 'admin.rj@empresa.com', role: 'admin', plaza: 'Praça RJ' },
  },
  'admin.mg@empresa.com': {
    password: 'admin123',
    user: { id: '4', name: 'Admin Minas Gerais', email: 'admin.mg@empresa.com', role: 'admin', plaza: 'Praça BH' },
  },
  'admin.pr@empresa.com': {
    password: 'admin123',
    user: { id: '5', name: 'Admin Curitiba', email: 'admin.pr@empresa.com', role: 'admin', plaza: 'Praça Curitiba' },
  },
  'admin.sc@empresa.com': {
    password: 'admin123',
    user: { id: '6', name: 'Admin São José', email: 'admin.sc@empresa.com', role: 'admin', plaza: 'Praça São José' },
  },
  'admin.rs@empresa.com': {
    password: 'admin123',
    user: { id: '7', name: 'Admin Porto Alegre', email: 'admin.rs@empresa.com', role: 'admin', plaza: 'Praça Porto Alegre' },
  },
  'admin.ba@empresa.com': {
    password: 'admin123',
    user: { id: '8', name: 'Admin Salvador', email: 'admin.ba@empresa.com', role: 'admin', plaza: 'Praça Salvador' },
  },
  'admin.pe@empresa.com': {
    password: 'admin123',
    user: { id: '9', name: 'Admin Campinas', email: 'admin.pe@empresa.com', role: 'admin', plaza: 'Praça Campinas' },
  },
  'admin.ce@empresa.com': {
    password: 'admin123',
    user: { id: '10', name: 'Admin Fortaleza', email: 'admin.ce@empresa.com', role: 'admin', plaza: 'Praça Fortaleza' },
  },
  'usuario.sp@empresa.com': {
    password: 'user123',
    user: { id: '11', name: 'Usuário São Paulo', email: 'usuario.sp@empresa.com', role: 'user', plaza: 'Praça São Paulo' },
  },
  'usuario.rj@empresa.com': {
    password: 'user123',
    user: { id: '12', name: 'Usuário Rio de Janeiro', email: 'usuario.rj@empresa.com', role: 'user', plaza: 'Praça RJ' },
  },
  'usuario.mg@empresa.com': {
    password: 'user123',
    user: { id: '13', name: 'Usuário Minas Gerais', email: 'usuario.mg@empresa.com', role: 'user', plaza: 'Praça BH' },
  },
  'usuario.pr@empresa.com': {
    password: 'user123',
    user: { id: '14', name: 'Usuário Curitiba', email: 'usuario.pr@empresa.com', role: 'user', plaza: 'Praça Curitiba' },
  },
  'usuario.sc@empresa.com': {
    password: 'user123',
    user: { id: '15', name: 'Usuário São José', email: 'usuario.sc@empresa.com', role: 'user', plaza: 'Praça São José' },
  },
  'usuario.rs@empresa.com': {
    password: 'user123',
    user: { id: '16', name: 'Usuário Porto Alegre', email: 'usuario.rs@empresa.com', role: 'user', plaza: 'Praça Porto Alegre' },
  },
  'usuario.ba@empresa.com': {
    password: 'user123',
    user: { id: '17', name: 'Usuário Salvador', email: 'usuario.ba@empresa.com', role: 'user', plaza: 'Praça Salvador' },
  },
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
          // If Supabase rejects, don't fall back to mock in online mode
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
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);