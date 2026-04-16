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

// ─── Admin plazas: only SP, Brasília, São José ───────────────────────────────
// All other plazas have user-role accounts only.
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'master@empresa.com': {
    password: 'master123',
    user: { id: '1', name: 'Master', email: 'master@empresa.com', role: 'master' },
  },

  // ── Praça São Paulo (ADMIN) ──────────────────────────────────────────────
  'admin.sp@empresa.com': {
    password: 'admin123',
    user: { id: '2', name: 'Admin São Paulo', email: 'admin.sp@empresa.com', role: 'admin', plaza: 'Praça São Paulo' },
  },
  'usuario.sp@empresa.com': {
    password: 'user123',
    user: { id: '20', name: 'Usuário São Paulo', email: 'usuario.sp@empresa.com', role: 'user', plaza: 'Praça São Paulo' },
  },

  // ── Praça Brasília (ADMIN) ───────────────────────────────────────────────
  'admin.bsb@empresa.com': {
    password: 'admin123',
    user: { id: '7', name: 'Admin Brasília', email: 'admin.bsb@empresa.com', role: 'admin', plaza: 'Praça Brasília' },
  },
  'usuario.bsb@empresa.com': {
    password: 'user123',
    user: { id: '25', name: 'Usuário Brasília', email: 'usuario.bsb@empresa.com', role: 'user', plaza: 'Praça Brasília' },
  },

  // ── Praça São José (ADMIN) ───────────────────────────────────────────────
  'admin.sc@empresa.com': {
    password: 'admin123',
    user: { id: '12', name: 'Admin São José', email: 'admin.sc@empresa.com', role: 'admin', plaza: 'Praça São José' },
  },
  'usuario.sc@empresa.com': {
    password: 'user123',
    user: { id: '30', name: 'Usuário São José', email: 'usuario.sc@empresa.com', role: 'user', plaza: 'Praça São José' },
  },

  // ── Praças com usuário apenas (sem admin) ────────────────────────────────
  'usuario.rj@empresa.com': {
    password: 'user123',
    user: { id: '21', name: 'Usuário RJ', email: 'usuario.rj@empresa.com', role: 'user', plaza: 'Praça RJ' },
  },
  'usuario.bh@empresa.com': {
    password: 'user123',
    user: { id: '22', name: 'Usuário BH', email: 'usuario.bh@empresa.com', role: 'user', plaza: 'Praça BH' },
  },
  'usuario.mg@empresa.com': {
    password: 'user123',
    user: { id: '78', name: 'Usuário BH', email: 'usuario.mg@empresa.com', role: 'user', plaza: 'Praça BH' },
  },
  'usuario.uber@empresa.com': {
    password: 'user123',
    user: { id: '23', name: 'Usuário Uberlândia', email: 'usuario.uber@empresa.com', role: 'user', plaza: 'Praça Uberlândia' },
  },
  'usuario.vit@empresa.com': {
    password: 'user123',
    user: { id: '24', name: 'Usuário Vitória', email: 'usuario.vit@empresa.com', role: 'user', plaza: 'Praça Vitória' },
  },
  'usuario.gyn@empresa.com': {
    password: 'user123',
    user: { id: '26', name: 'Usuário Goiânia', email: 'usuario.gyn@empresa.com', role: 'user', plaza: 'Praça Goiânia' },
  },
  'usuario.cgd@empresa.com': {
    password: 'user123',
    user: { id: '27', name: 'Usuário Campo Grande', email: 'usuario.cgd@empresa.com', role: 'user', plaza: 'Praça Campo Grande' },
  },
  'usuario.cur@empresa.com': {
    password: 'user123',
    user: { id: '28', name: 'Usuário Curitiba', email: 'usuario.cur@empresa.com', role: 'user', plaza: 'Praça Curitiba' },
  },
  'usuario.pr@empresa.com': {
    password: 'user123',
    user: { id: '100', name: 'Usuário Curitiba', email: 'usuario.pr@empresa.com', role: 'user', plaza: 'Praça Curitiba' },
  },
  'usuario.lon@empresa.com': {
    password: 'user123',
    user: { id: '29', name: 'Usuário Londrina', email: 'usuario.lon@empresa.com', role: 'user', plaza: 'Praça Londrina' },
  },
  'usuario.jv@empresa.com': {
    password: 'user123',
    user: { id: '31', name: 'Usuário Joinville', email: 'usuario.jv@empresa.com', role: 'user', plaza: 'Praça Joinville' },
  },
  'usuario.poa@empresa.com': {
    password: 'user123',
    user: { id: '32', name: 'Usuário Porto Alegre', email: 'usuario.poa@empresa.com', role: 'user', plaza: 'Praça Porto Alegre' },
  },
  'usuario.rs@empresa.com': {
    password: 'user123',
    user: { id: '116', name: 'Usuário Porto Alegre', email: 'usuario.rs@empresa.com', role: 'user', plaza: 'Praça Porto Alegre' },
  },
  'usuario.saoleopoldo@empresa.com': {
    password: 'user123',
    user: { id: '33', name: 'Usuário São Leopoldo', email: 'usuario.saoleopoldo@empresa.com', role: 'user', plaza: 'Praça São Leopoldo' },
  },
  'usuario.ssa@empresa.com': {
    password: 'user123',
    user: { id: '34', name: 'Usuário Salvador', email: 'usuario.ssa@empresa.com', role: 'user', plaza: 'Praça Salvador' },
  },
  'usuario.ba@empresa.com': {
    password: 'user123',
    user: { id: '129', name: 'Usuário Salvador', email: 'usuario.ba@empresa.com', role: 'user', plaza: 'Praça Salvador' },
  },
  'usuario.for@empresa.com': {
    password: 'user123',
    user: { id: '35', name: 'Usuário Fortaleza', email: 'usuario.for@empresa.com', role: 'user', plaza: 'Praça Fortaleza' },
  },
  'usuario.mac@empresa.com': {
    password: 'user123',
    user: { id: '36', name: 'Usuário Maceió', email: 'usuario.mac@empresa.com', role: 'user', plaza: 'Praça Maceió' },
  },
  'usuario.nat@empresa.com': {
    password: 'user123',
    user: { id: '37', name: 'Usuário Natal', email: 'usuario.nat@empresa.com', role: 'user', plaza: 'Praça Natal' },
  },
  'usuario.abc@empresa.com': {
    password: 'user123',
    user: { id: '50', name: 'Usuário ABC', email: 'usuario.abc@empresa.com', role: 'user', plaza: 'Praça ABC' },
  },
  'usuario.santos@empresa.com': {
    password: 'user123',
    user: { id: '51', name: 'Usuário Santos', email: 'usuario.santos@empresa.com', role: 'user', plaza: 'Praça Santos' },
  },
  'usuario.rib@empresa.com': {
    password: 'user123',
    user: { id: '52', name: 'Usuário Ribeirão Preto', email: 'usuario.rib@empresa.com', role: 'user', plaza: 'Praça Ribeirão Preto' },
  },
  'usuario.camp@empresa.com': {
    password: 'user123',
    user: { id: '53', name: 'Usuário Campinas', email: 'usuario.camp@empresa.com', role: 'user', plaza: 'Praça Campinas' },
  },
  'usuario.sor@empresa.com': {
    password: 'user123',
    user: { id: '54', name: 'Usuário Sorocaba', email: 'usuario.sor@empresa.com', role: 'user', plaza: 'Praça Sorocaba' },
  },
  'usuario.sjrp@empresa.com': {
    password: 'user123',
    user: { id: '55', name: 'Usuário São José do Rio Preto', email: 'usuario.sjrp@empresa.com', role: 'user', plaza: 'Praça São José do Rio Preto' },
  },
  'usuario.sjc@empresa.com': {
    password: 'user123',
    user: { id: '56', name: 'Usuário São José dos Campos', email: 'usuario.sjc@empresa.com', role: 'user', plaza: 'Praça São José dos Campos/Taubaté' },
  },
  'usuario.jd@empresa.com': {
    password: 'user123',
    user: { id: '57', name: 'Usuário Jundiaí', email: 'usuario.jd@empresa.com', role: 'user', plaza: 'Praça Jundiaí' },
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