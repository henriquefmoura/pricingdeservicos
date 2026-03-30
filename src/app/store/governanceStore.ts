import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Interfaces ---

export interface UserActivityLog {
  userId: string;
  userName: string;
  userRole: 'admin' | 'user';
  plaza: string;
  action: 'login' | 'price_set' | 'price_approved' | 'price_rejected' | 'analysis_viewed' | 'market_research';
  timestamp: Date;
  details?: string;
}

export interface UserGovernanceMetrics {
  userId: string;
  userName: string;
  plaza: string;
  role: 'admin' | 'user';
  totalLogins: number;
  totalPricesSet: number;
  totalApprovals: number;
  totalRejections: number;
  avgDecisionTimeMinutes: number;
  marketResearchUsage: number;
  lastActivity: Date;
  consistencyScore: number; // 0-100
}

export interface PlazaGovernanceMetrics {
  plaza: string;
  totalPricingsReceived: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  approvalRate: number;
  avgDecisionTime: number;
  activeUsers: number;
}

interface GovernanceState {
  activityLogs: UserActivityLog[];
  logActivity: (log: Omit<UserActivityLog, 'timestamp'>) => void;
  getUserMetrics: () => UserGovernanceMetrics[];
  getPlazaMetrics: () => PlazaGovernanceMetrics[];
  getTopUsers: (limit: number) => UserGovernanceMetrics[];
  getActivityTimeline: (days: number) => { date: string; count: number }[];
  initializeMockData: () => void;
}

// --- Helpers ---

const PLAZAS = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE'] as const;

const ACTION_DETAILS: Record<UserActivityLog['action'], string[]> = {
  login: ['Login via painel', 'Sessão iniciada'],
  price_set: [
    'Precificou VIS-001 Vistoria de Imóveis',
    'Precificou AVA-042 Avaliação Residencial',
    'Precificou LAU-015 Laudo Estrutural',
    'Precificou VIS-088 Vistoria Predial',
    'Precificou AVA-103 Avaliação Comercial',
    'Precificou LAU-067 Laudo Elétrico',
    'Precificou VIS-045 Vistoria Cautelar',
  ],
  price_approved: [
    'Aprovou ajuste de preço VIS-001',
    'Aprovou reajuste AVA-042',
    'Aprovou novo preço LAU-015',
    'Aprovou variação de VIS-088',
  ],
  price_rejected: [
    'Rejeitou ajuste VIS-023 — margem abaixo do mínimo',
    'Rejeitou reajuste AVA-042 — variação acima de 15%',
    'Rejeitou LAU-015 — falta pesquisa de mercado',
  ],
  analysis_viewed: [
    'Visualizou análise de margens SP',
    'Consultou dashboard de preços',
    'Acessou relatório de variações',
    'Visualizou histórico de precificação',
  ],
  market_research: [
    'Pesquisou referência de mercado para Vistoria',
    'Consultou índices IGPM/IPCA',
    'Pesquisou preços concorrência Avaliação',
    'Consultou tabela SINAPI',
    'Pesquisou referência Laudos regionais',
  ],
};

// Seeded pseudo-random for reproducible mock data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateMockLogs(): UserActivityLog[] {
  const rand = seededRandom(42);
  const logs: UserActivityLog[] = [];
  const now = Date.now();
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  // Admin users — one per plaza, plus one extra for SP
  const adminUsers = [
    { id: '2', name: 'Admin São Paulo', plaza: 'SP' },
    { id: '3', name: 'Admin Rio de Janeiro', plaza: 'RJ' },
    { id: '4', name: 'Admin Minas Gerais', plaza: 'MG' },
    { id: '5', name: 'Admin Paraná', plaza: 'PR' },
    { id: '6', name: 'Admin Santa Catarina', plaza: 'SC' },
    { id: '7', name: 'Admin Rio Grande do Sul', plaza: 'RS' },
    { id: '8', name: 'Admin Bahia', plaza: 'BA' },
    { id: '9', name: 'Admin Pernambuco', plaza: 'PE' },
    { id: '10', name: 'Admin Ceará', plaza: 'CE' },
    { id: '18', name: 'Admin SP Regional', plaza: 'SP' },
  ];

  // Regular users — 7 spread across plazas
  const regularUsers = [
    { id: '11', name: 'Usuário SP', plaza: 'SP' },
    { id: '12', name: 'Usuário RJ', plaza: 'RJ' },
    { id: '13', name: 'Usuário Minas Gerais', plaza: 'MG' },
    { id: '14', name: 'Usuário Paraná', plaza: 'PR' },
    { id: '15', name: 'Usuário Santa Catarina', plaza: 'SC' },
    { id: '16', name: 'Usuário Rio Grande do Sul', plaza: 'RS' },
    { id: '17', name: 'Usuário Bahia', plaza: 'BA' },
  ];

  // Activity-level multipliers give users different engagement levels
  const adminActivityMultipliers = [1.4, 1.1, 0.9, 0.7, 1.2, 0.6, 0.8, 1.0, 0.5, 1.3];
  const userActivityMultipliers = [1.5, 0.8, 1.0, 0.6, 1.1, 0.4, 0.9];

  // Admin action weight distribution — admins approve/reject more
  const adminActionWeights: [UserActivityLog['action'], number][] = [
    ['login', 0.15],
    ['price_set', 0.20],
    ['price_approved', 0.22],
    ['price_rejected', 0.08],
    ['analysis_viewed', 0.20],
    ['market_research', 0.15],
  ];

  // User action weight distribution — users set prices and research more
  const userActionWeights: [UserActivityLog['action'], number][] = [
    ['login', 0.15],
    ['price_set', 0.35],
    ['price_approved', 0.0],
    ['price_rejected', 0.0],
    ['analysis_viewed', 0.25],
    ['market_research', 0.25],
  ];

  function pickWeighted(weights: [UserActivityLog['action'], number][], r: number): UserActivityLog['action'] {
    let cumulative = 0;
    for (const [action, weight] of weights) {
      cumulative += weight;
      if (r < cumulative) return action;
    }
    return weights[weights.length - 1][0];
  }

  // Generate admin logs
  adminUsers.forEach((user, idx) => {
    const baseCount = Math.floor(120 * adminActivityMultipliers[idx]);
    for (let i = 0; i < baseCount; i++) {
      const action = pickWeighted(adminActionWeights, rand());
      const timestamp = new Date(now - Math.floor(rand() * NINETY_DAYS));
      logs.push({
        userId: user.id,
        userName: user.name,
        userRole: 'admin',
        plaza: user.plaza,
        action,
        timestamp,
        details: pick(ACTION_DETAILS[action], rand),
      });
    }
  });

  // Generate regular user logs
  regularUsers.forEach((user, idx) => {
    const baseCount = Math.floor(80 * userActivityMultipliers[idx]);
    for (let i = 0; i < baseCount; i++) {
      const action = pickWeighted(userActionWeights, rand());
      const timestamp = new Date(now - Math.floor(rand() * NINETY_DAYS));
      logs.push({
        userId: user.id,
        userName: user.name,
        userRole: 'user',
        plaza: user.plaza,
        action,
        timestamp,
        details: pick(ACTION_DETAILS[action], rand),
      });
    }
  });

  // Sort chronologically
  logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return logs;
}

// Pre-defined consistency scores per user (seeded)
const CONSISTENCY_SCORES: Record<string, number> = {
  '2': 92,
  '3': 85,
  '4': 78,
  '5': 88,
  '6': 70,
  '7': 95,
  '8': 62,
  '9': 81,
  '10': 74,
  '18': 90,
  '11': 87,
  '12': 65,
  '13': 79,
  '14': 83,
  '15': 71,
  '16': 58,
  '17': 76,
};

// Pre-defined average decision times per user (minutes)
const AVG_DECISION_TIMES: Record<string, number> = {
  '2': 14,
  '3': 22,
  '4': 38,
  '5': 18,
  '6': 45,
  '7': 12,
  '8': 55,
  '9': 30,
  '10': 48,
  '18': 16,
  '11': 0,
  '12': 0,
  '13': 0,
  '14': 0,
  '15': 0,
  '16': 0,
  '17': 0,
};

// --- Store ---

export const useGovernanceStore = create<GovernanceState>()(
  persist(
    (set, get) => ({
      activityLogs: [],

      initializeMockData: () => {
        const current = get().activityLogs;
        if (current.length === 0) {
          set({ activityLogs: generateMockLogs() });
        }
      },

      logActivity: (log) => {
        const entry: UserActivityLog = {
          ...log,
          timestamp: new Date(),
        };
        set((state) => ({
          activityLogs: [...state.activityLogs, entry],
        }));
      },

      getUserMetrics: () => {
        const logs = get().activityLogs;
        const usersMap = new Map<string, UserGovernanceMetrics>();

        for (const log of logs) {
          if (!usersMap.has(log.userId)) {
            usersMap.set(log.userId, {
              userId: log.userId,
              userName: log.userName,
              plaza: log.plaza,
              role: log.userRole,
              totalLogins: 0,
              totalPricesSet: 0,
              totalApprovals: 0,
              totalRejections: 0,
              avgDecisionTimeMinutes: AVG_DECISION_TIMES[log.userId] ?? 0,
              marketResearchUsage: 0,
              lastActivity: new Date(log.timestamp),
              consistencyScore: CONSISTENCY_SCORES[log.userId] ?? 75,
            });
          }

          const m = usersMap.get(log.userId)!;
          const ts = new Date(log.timestamp);
          if (ts > m.lastActivity) m.lastActivity = ts;

          switch (log.action) {
            case 'login':
              m.totalLogins++;
              break;
            case 'price_set':
              m.totalPricesSet++;
              break;
            case 'price_approved':
              m.totalApprovals++;
              break;
            case 'price_rejected':
              m.totalRejections++;
              break;
            case 'market_research':
              m.marketResearchUsage++;
              break;
          }
        }

        return Array.from(usersMap.values());
      },

      getPlazaMetrics: () => {
        const logs = get().activityLogs;
        const plazaMap = new Map<string, PlazaGovernanceMetrics>();
        const plazaUsers = new Map<string, Set<string>>();

        // Initialize all plazas
        for (const plaza of PLAZAS) {
          plazaMap.set(plaza, {
            plaza,
            totalPricingsReceived: 0,
            totalApproved: 0,
            totalRejected: 0,
            totalPending: 0,
            approvalRate: 0,
            avgDecisionTime: 0,
            activeUsers: 0,
          });
          plazaUsers.set(plaza, new Set());
        }

        for (const log of logs) {
          const m = plazaMap.get(log.plaza);
          if (!m) continue;

          plazaUsers.get(log.plaza)!.add(log.userId);

          switch (log.action) {
            case 'price_set':
              m.totalPricingsReceived++;
              break;
            case 'price_approved':
              m.totalApproved++;
              break;
            case 'price_rejected':
              m.totalRejected++;
              break;
          }
        }

        const userMetrics = get().getUserMetrics();

        for (const plaza of PLAZAS) {
          const m = plazaMap.get(plaza)!;
          const decided = m.totalApproved + m.totalRejected;
          m.totalPending = Math.max(0, m.totalPricingsReceived - decided);
          m.approvalRate = decided > 0 ? Math.round((m.totalApproved / decided) * 100) : 0;
          m.activeUsers = plazaUsers.get(plaza)!.size;

          // Average decision time across admin users in this plaza
          const plazaAdmins = userMetrics.filter(
            (u) => u.plaza === plaza && u.role === 'admin' && u.avgDecisionTimeMinutes > 0
          );
          m.avgDecisionTime =
            plazaAdmins.length > 0
              ? Math.round(plazaAdmins.reduce((sum, a) => sum + a.avgDecisionTimeMinutes, 0) / plazaAdmins.length)
              : 0;
        }

        return Array.from(plazaMap.values());
      },

      getTopUsers: (limit: number) => {
        const metrics = get().getUserMetrics();

        // Rank by total activity (logins + prices set + approvals + rejections + research)
        return metrics
          .map((m) => ({
            ...m,
            _score:
              m.totalLogins +
              m.totalPricesSet * 2 +
              m.totalApprovals * 3 +
              m.totalRejections * 3 +
              m.marketResearchUsage * 1.5,
          }))
          .sort((a, b) => b._score - a._score)
          .slice(0, limit)
          .map(({ _score, ...rest }) => rest);
      },

      getActivityTimeline: (days: number) => {
        const logs = get().activityLogs;
        const now = Date.now();
        const cutoff = now - days * 24 * 60 * 60 * 1000;

        const buckets = new Map<string, number>();

        // Pre-fill all dates in range
        for (let d = 0; d < days; d++) {
          const date = new Date(now - d * 24 * 60 * 60 * 1000);
          const key = date.toISOString().slice(0, 10);
          buckets.set(key, 0);
        }

        for (const log of logs) {
          const ts = new Date(log.timestamp).getTime();
          if (ts < cutoff) continue;
          const key = new Date(log.timestamp).toISOString().slice(0, 10);
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }

        return Array.from(buckets.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    {
      name: 'governance-storage',
    }
  )
);
