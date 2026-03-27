import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'master' | 'admin' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plaza?: string; // Praça do usuário (se aplicável)
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setUser: (user: User) => void;
}

// Usuários mock (em produção, viria de um backend/Supabase)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'master@empresa.com': {
    password: 'master123',
    user: {
      id: '1',
      name: 'Master',
      email: 'master@empresa.com',
      role: 'master',
    },
  },
  // Admins por Praça
  'admin.sp@empresa.com': {
    password: 'admin123',
    user: {
      id: '2',
      name: 'Admin São Paulo',
      email: 'admin.sp@empresa.com',
      role: 'admin',
      plaza: 'SP',
    },
  },
  'admin.rj@empresa.com': {
    password: 'admin123',
    user: {
      id: '3',
      name: 'Admin Rio de Janeiro',
      email: 'admin.rj@empresa.com',
      role: 'admin',
      plaza: 'RJ',
    },
  },
  'admin.mg@empresa.com': {
    password: 'admin123',
    user: {
      id: '4',
      name: 'Admin Minas Gerais',
      email: 'admin.mg@empresa.com',
      role: 'admin',
      plaza: 'MG',
    },
  },
  'admin.pr@empresa.com': {
    password: 'admin123',
    user: {
      id: '5',
      name: 'Admin Paraná',
      email: 'admin.pr@empresa.com',
      role: 'admin',
      plaza: 'PR',
    },
  },
  'admin.sc@empresa.com': {
    password: 'admin123',
    user: {
      id: '6',
      name: 'Admin Santa Catarina',
      email: 'admin.sc@empresa.com',
      role: 'admin',
      plaza: 'SC',
    },
  },
  'admin.rs@empresa.com': {
    password: 'admin123',
    user: {
      id: '7',
      name: 'Admin Rio Grande do Sul',
      email: 'admin.rs@empresa.com',
      role: 'admin',
      plaza: 'RS',
    },
  },
  'admin.ba@empresa.com': {
    password: 'admin123',
    user: {
      id: '8',
      name: 'Admin Bahia',
      email: 'admin.ba@empresa.com',
      role: 'admin',
      plaza: 'BA',
    },
  },
  'admin.pe@empresa.com': {
    password: 'admin123',
    user: {
      id: '9',
      name: 'Admin Pernambuco',
      email: 'admin.pe@empresa.com',
      role: 'admin',
      plaza: 'PE',
    },
  },
  'admin.ce@empresa.com': {
    password: 'admin123',
    user: {
      id: '10',
      name: 'Admin Ceará',
      email: 'admin.ce@empresa.com',
      role: 'admin',
      plaza: 'CE',
    },
  },
  // Usuários Comuns
  'usuario.sp@empresa.com': {
    password: 'user123',
    user: {
      id: '11',
      name: 'Usuário SP',
      email: 'usuario.sp@empresa.com',
      role: 'user',
      plaza: 'SP',
    },
  },
  'usuario.rj@empresa.com': {
    password: 'user123',
    user: {
      id: '12',
      name: 'Usuário RJ',
      email: 'usuario.rj@empresa.com',
      role: 'user',
      plaza: 'RJ',
    },
  },
  'usuario.mg@empresa.com': {
    password: 'user123',
    user: {
      id: '13',
      name: 'Usuário Minas Gerais',
      email: 'usuario.mg@empresa.com',
      role: 'user',
      plaza: 'MG',
    },
  },
  'usuario.pr@empresa.com': {
    password: 'user123',
    user: {
      id: '14',
      name: 'Usuário Paraná',
      email: 'usuario.pr@empresa.com',
      role: 'user',
      plaza: 'PR',
    },
  },
  'usuario.sc@empresa.com': {
    password: 'user123',
    user: {
      id: '15',
      name: 'Usuário Santa Catarina',
      email: 'usuario.sc@empresa.com',
      role: 'user',
      plaza: 'SC',
    },
  },
  'usuario.rs@empresa.com': {
    password: 'user123',
    user: {
      id: '16',
      name: 'Usuário Rio Grande do Sul',
      email: 'usuario.rs@empresa.com',
      role: 'user',
      plaza: 'RS',
    },
  },
  'usuario.ba@empresa.com': {
    password: 'user123',
    user: {
      id: '17',
      name: 'Usuário Bahia',
      email: 'usuario.ba@empresa.com',
      role: 'user',
      plaza: 'BA',
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, password: string) => {
        const userRecord = MOCK_USERS[email];
        
        if (userRecord && userRecord.password === password) {
          set({ user: userRecord.user, isAuthenticated: true });
          return true;
        }
        
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);