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
  // ── Praça São Paulo ──────────────────────────────────────────────────────
  'admin.sp@empresa.com': {
    password: 'admin123',
    user: { id: '2', name: 'Admin São Paulo', email: 'admin.sp@empresa.com', role: 'admin', plaza: 'Praça São Paulo' },
  },
  'usuario.sp@empresa.com': {
    password: 'user123',
    user: { id: '20', name: 'Usuário São Paulo', email: 'usuario.sp@empresa.com', role: 'user', plaza: 'Praça São Paulo' },
  },
  // ── Praça RJ ─────────────────────────────────────────────────────────────
  'admin.rj@empresa.com': {
    password: 'admin123',
    user: { id: '3', name: 'Admin RJ', email: 'admin.rj@empresa.com', role: 'admin', plaza: 'Praça RJ' },
  },
  'usuario.rj@empresa.com': {
    password: 'user123',
    user: { id: '21', name: 'Usuário RJ', email: 'usuario.rj@empresa.com', role: 'user', plaza: 'Praça RJ' },
  },
  // ── Praça BH ─────────────────────────────────────────────────────────────
  'admin.bh@empresa.com': {
    password: 'admin123',
    user: { id: '4', name: 'Admin BH', email: 'admin.bh@empresa.com', role: 'admin', plaza: 'Praça BH' },
  },
  'admin.mg@empresa.com': {
    password: 'admin123',
    user: { id: '104', name: 'Admin BH', email: 'admin.mg@empresa.com', role: 'admin', plaza: 'Praça BH' },
  },
  'usuario.bh@empresa.com': {
    password: 'user123',
    user: { id: '22', name: 'Usuário BH', email: 'usuario.bh@empresa.com', role: 'user', plaza: 'Praça BH' },
  },
  'usuario.mg@empresa.com': {
    password: 'user123',
    user: { id: '122', name: 'Usuário BH', email: 'usuario.mg@empresa.com', role: 'user', plaza: 'Praça BH' },
  },
  // ── Praça Uberlândia ─────────────────────────────────────────────────────
  'admin.uber@empresa.com': {
    password: 'admin123',
    user: { id: '5', name: 'Admin Uberlândia', email: 'admin.uber@empresa.com', role: 'admin', plaza: 'Praça Uberlândia' },
  },
  'usuario.uber@empresa.com': {
    password: 'user123',
    user: { id: '23', name: 'Usuário Uberlândia', email: 'usuario.uber@empresa.com', role: 'user', plaza: 'Praça Uberlândia' },
  },
  // ── Praça Vitória ────────────────────────────────────────────────────────
  'admin.vit@empresa.com': {
    password: 'admin123',
    user: { id: '6', name: 'Admin Vitória', email: 'admin.vit@empresa.com', role: 'admin', plaza: 'Praça Vitória' },
  },
  'usuario.vit@empresa.com': {
    password: 'user123',
    user: { id: '24', name: 'Usuário Vitória', email: 'usuario.vit@empresa.com', role: 'user', plaza: 'Praça Vitória' },
  },
  // ── Praça Brasília ───────────────────────────────────────────────────────
  'admin.bsb@empresa.com': {
    password: 'admin123',
    user: { id: '7', name: 'Admin Brasília', email: 'admin.bsb@empresa.com', role: 'admin', plaza: 'Praça Brasília' },
  },
  'usuario.bsb@empresa.com': {
    password: 'user123',
    user: { id: '25', name: 'Usuário Brasília', email: 'usuario.bsb@empresa.com', role: 'user', plaza: 'Praça Brasília' },
  },
  // ── Praça Goiânia ────────────────────────────────────────────────────────
  'admin.gyn@empresa.com': {
    password: 'admin123',
    user: { id: '8', name: 'Admin Goiânia', email: 'admin.gyn@empresa.com', role: 'admin', plaza: 'Praça Goiânia' },
  },
  'usuario.gyn@empresa.com': {
    password: 'user123',
    user: { id: '26', name: 'Usuário Goiânia', email: 'usuario.gyn@empresa.com', role: 'user', plaza: 'Praça Goiânia' },
  },
  // ── Praça Campo Grande ───────────────────────────────────────────────────
  'admin.cgd@empresa.com': {
    password: 'admin123',
    user: { id: '9', name: 'Admin Campo Grande', email: 'admin.cgd@empresa.com', role: 'admin', plaza: 'Praça Campo Grande' },
  },
  'usuario.cgd@empresa.com': {
    password: 'user123',
    user: { id: '27', name: 'Usuário Campo Grande', email: 'usuario.cgd@empresa.com', role: 'user', plaza: 'Praça Campo Grande' },
  },
  // ── Praça Curitiba ───────────────────────────────────────────────────────
  'admin.cur@empresa.com': {
    password: 'admin123',
    user: { id: '10', name: 'Admin Curitiba', email: 'admin.cur@empresa.com', role: 'admin', plaza: 'Praça Curitiba' },
  },
  'admin.pr@empresa.com': {
    password: 'admin123',
    user: { id: '110', name: 'Admin Curitiba', email: 'admin.pr@empresa.com', role: 'admin', plaza: 'Praça Curitiba' },
  },
  'usuario.cur@empresa.com': {
    password: 'user123',
    user: { id: '28', name: 'Usuário Curitiba', email: 'usuario.cur@empresa.com', role: 'user', plaza: 'Praça Curitiba' },
  },
  'usuario.pr@empresa.com': {
    password: 'user123',
    user: { id: '128', name: 'Usuário Curitiba', email: 'usuario.pr@empresa.com', role: 'user', plaza: 'Praça Curitiba' },
  },
  // ── Praça Londrina ───────────────────────────────────────────────────────
  'admin.lon@empresa.com': {
    password: 'admin123',
    user: { id: '11', name: 'Admin Londrina', email: 'admin.lon@empresa.com', role: 'admin', plaza: 'Praça Londrina' },
  },
  'usuario.lon@empresa.com': {
    password: 'user123',
    user: { id: '29', name: 'Usuário Londrina', email: 'usuario.lon@empresa.com', role: 'user', plaza: 'Praça Londrina' },
  },
  // ── Praça São José ───────────────────────────────────────────────────────
  'admin.sc@empresa.com': {
    password: 'admin123',
    user: { id: '12', name: 'Admin São José', email: 'admin.sc@empresa.com', role: 'admin', plaza: 'Praça São José' },
  },
  'usuario.sc@empresa.com': {
    password: 'user123',
    user: { id: '30', name: 'Usuário São José', email: 'usuario.sc@empresa.com', role: 'user', plaza: 'Praça São José' },
  },
  // ── Praça Joinville ──────────────────────────────────────────────────────
  'admin.jv@empresa.com': {
    password: 'admin123',
    user: { id: '13', name: 'Admin Joinville', email: 'admin.jv@empresa.com', role: 'admin', plaza: 'Praça Joinville' },
  },
  'usuario.jv@empresa.com': {
    password: 'user123',
    user: { id: '31', name: 'Usuário Joinville', email: 'usuario.jv@empresa.com', role: 'user', plaza: 'Praça Joinville' },
  },
  // ── Praça Porto Alegre ───────────────────────────────────────────────────
  'admin.poa@empresa.com': {
    password: 'admin123',
    user: { id: '14', name: 'Admin Porto Alegre', email: 'admin.poa@empresa.com', role: 'admin', plaza: 'Praça Porto Alegre' },
  },
  'admin.rs@empresa.com': {
    password: 'admin123',
    user: { id: '114', name: 'Admin Porto Alegre', email: 'admin.rs@empresa.com', role: 'admin', plaza: 'Praça Porto Alegre' },
  },
  'usuario.poa@empresa.com': {
    password: 'user123',
    user: { id: '32', name: 'Usuário Porto Alegre', email: 'usuario.poa@empresa.com', role: 'user', plaza: 'Praça Porto Alegre' },
  },
  'usuario.rs@empresa.com': {
    password: 'user123',
    user: { id: '132', name: 'Usuário Porto Alegre', email: 'usuario.rs@empresa.com', role: 'user', plaza: 'Praça Porto Alegre' },
  },
  // ── Praça São Leopoldo ───────────────────────────────────────────────────
  'admin.saoleopoldo@empresa.com': {
    password: 'admin123',
    user: { id: '15', name: 'Admin São Leopoldo', email: 'admin.saoleopoldo@empresa.com', role: 'admin', plaza: 'Praça São Leopoldo' },
  },
  'usuario.saoleopoldo@empresa.com': {
    password: 'user123',
    user: { id: '33', name: 'Usuário São Leopoldo', email: 'usuario.saoleopoldo@empresa.com', role: 'user', plaza: 'Praça São Leopoldo' },
  },
  // ── Praça Salvador ───────────────────────────────────────────────────────
  'admin.ssa@empresa.com': {
    password: 'admin123',
    user: { id: '16', name: 'Admin Salvador', email: 'admin.ssa@empresa.com', role: 'admin', plaza: 'Praça Salvador' },
  },
  'admin.ba@empresa.com': {
    password: 'admin123',
    user: { id: '116', name: 'Admin Salvador', email: 'admin.ba@empresa.com', role: 'admin', plaza: 'Praça Salvador' },
  },
  'usuario.ssa@empresa.com': {
    password: 'user123',
    user: { id: '34', name: 'Usuário Salvador', email: 'usuario.ssa@empresa.com', role: 'user', plaza: 'Praça Salvador' },
  },
  'usuario.ba@empresa.com': {
    password: 'user123',
    user: { id: '134', name: 'Usuário Salvador', email: 'usuario.ba@empresa.com', role: 'user', plaza: 'Praça Salvador' },
  },
  // ── Praça Fortaleza ──────────────────────────────────────────────────────
  'admin.for@empresa.com': {
    password: 'admin123',
    user: { id: '17', name: 'Admin Fortaleza', email: 'admin.for@empresa.com', role: 'admin', plaza: 'Praça Fortaleza' },
  },
  'admin.ce@empresa.com': {
    password: 'admin123',
    user: { id: '117', name: 'Admin Fortaleza', email: 'admin.ce@empresa.com', role: 'admin', plaza: 'Praça Fortaleza' },
  },
  'usuario.for@empresa.com': {
    password: 'user123',
    user: { id: '35', name: 'Usuário Fortaleza', email: 'usuario.for@empresa.com', role: 'user', plaza: 'Praça Fortaleza' },
  },
  // ── Praça Maceió ─────────────────────────────────────────────────────────
  'admin.mac@empresa.com': {
    password: 'admin123',
    user: { id: '18', name: 'Admin Maceió', email: 'admin.mac@empresa.com', role: 'admin', plaza: 'Praça Maceió' },
  },
  'usuario.mac@empresa.com': {
    password: 'user123',
    user: { id: '36', name: 'Usuário Maceió', email: 'usuario.mac@empresa.com', role: 'user', plaza: 'Praça Maceió' },
  },
  // ── Praça Natal ──────────────────────────────────────────────────────────
  'admin.nat@empresa.com': {
    password: 'admin123',
    user: { id: '19', name: 'Admin Natal', email: 'admin.nat@empresa.com', role: 'admin', plaza: 'Praça Natal' },
  },
  'usuario.nat@empresa.com': {
    password: 'user123',
    user: { id: '37', name: 'Usuário Natal', email: 'usuario.nat@empresa.com', role: 'user', plaza: 'Praça Natal' },
  },
  // ── Praça ABC ────────────────────────────────────────────────────────────
  'admin.abc@empresa.com': {
    password: 'admin123',
    user: { id: '40', name: 'Admin ABC', email: 'admin.abc@empresa.com', role: 'admin', plaza: 'Praça ABC' },
  },
  'usuario.abc@empresa.com': {
    password: 'user123',
    user: { id: '50', name: 'Usuário ABC', email: 'usuario.abc@empresa.com', role: 'user', plaza: 'Praça ABC' },
  },
  // ── Praça Santos ─────────────────────────────────────────────────────────
  'admin.santos@empresa.com': {
    password: 'admin123',
    user: { id: '41', name: 'Admin Santos', email: 'admin.santos@empresa.com', role: 'admin', plaza: 'Praça Santos' },
  },
  'usuario.santos@empresa.com': {
    password: 'user123',
    user: { id: '51', name: 'Usuário Santos', email: 'usuario.santos@empresa.com', role: 'user', plaza: 'Praça Santos' },
  },
  // ── Praça Ribeirão Preto ─────────────────────────────────────────────────
  'admin.rib@empresa.com': {
    password: 'admin123',
    user: { id: '42', name: 'Admin Ribeirão Preto', email: 'admin.rib@empresa.com', role: 'admin', plaza: 'Praça Ribeirão Preto' },
  },
  'usuario.rib@empresa.com': {
    password: 'user123',
    user: { id: '52', name: 'Usuário Ribeirão Preto', email: 'usuario.rib@empresa.com', role: 'user', plaza: 'Praça Ribeirão Preto' },
  },
  // ── Praça Campinas ───────────────────────────────────────────────────────
  'admin.camp@empresa.com': {
    password: 'admin123',
    user: { id: '43', name: 'Admin Campinas', email: 'admin.camp@empresa.com', role: 'admin', plaza: 'Praça Campinas' },
  },
  'usuario.camp@empresa.com': {
    password: 'user123',
    user: { id: '53', name: 'Usuário Campinas', email: 'usuario.camp@empresa.com', role: 'user', plaza: 'Praça Campinas' },
  },
  // ── Praça Sorocaba ───────────────────────────────────────────────────────
  'admin.sor@empresa.com': {
    password: 'admin123',
    user: { id: '44', name: 'Admin Sorocaba', email: 'admin.sor@empresa.com', role: 'admin', plaza: 'Praça Sorocaba' },
  },
  'usuario.sor@empresa.com': {
    password: 'user123',
    user: { id: '54', name: 'Usuário Sorocaba', email: 'usuario.sor@empresa.com', role: 'user', plaza: 'Praça Sorocaba' },
  },
  // ── Praça São José do Rio Preto ──────────────────────────────────────────
  'admin.sjrp@empresa.com': {
    password: 'admin123',
    user: { id: '45', name: 'Admin São José do Rio Preto', email: 'admin.sjrp@empresa.com', role: 'admin', plaza: 'Praça São José do Rio Preto' },
  },
  'usuario.sjrp@empresa.com': {
    password: 'user123',
    user: { id: '55', name: 'Usuário São José do Rio Preto', email: 'usuario.sjrp@empresa.com', role: 'user', plaza: 'Praça São José do Rio Preto' },
  },
  // ── Praça São José dos Campos/Taubaté ────────────────────────────────────
  'admin.sjc@empresa.com': {
    password: 'admin123',
    user: { id: '46', name: 'Admin São José dos Campos', email: 'admin.sjc@empresa.com', role: 'admin', plaza: 'Praça São José dos Campos/Taubaté' },
  },
  'usuario.sjc@empresa.com': {
    password: 'user123',
    user: { id: '56', name: 'Usuário São José dos Campos', email: 'usuario.sjc@empresa.com', role: 'user', plaza: 'Praça São José dos Campos/Taubaté' },
  },
  // ── Praça Jundiaí ────────────────────────────────────────────────────────
  'admin.jd@empresa.com': {
    password: 'admin123',
    user: { id: '47', name: 'Admin Jundiaí', email: 'admin.jd@empresa.com', role: 'admin', plaza: 'Praça Jundiaí' },
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