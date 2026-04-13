import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePricingCodesStore } from './pricingCodesStore';
import { useApprovalStore } from './approvalStore';

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

// --- Store ---

export const useGovernanceStore = create<GovernanceState>()(
  persist(
    (set, get) => ({
      activityLogs: [],

      // Clear any legacy mock data; real activity is tracked via logActivity()
      initializeMockData: () => {
        const current = get().activityLogs;
        if (current.length > 0) {
          set({ activityLogs: [] });
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

        // Aggregate from real activity logs
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
              avgDecisionTimeMinutes: 0,
              marketResearchUsage: 0,
              lastActivity: new Date(log.timestamp),
              consistencyScore: 0,
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
        const codes = usePricingCodesStore.getState().codes;
        const approvals = useApprovalStore.getState().approvals;

        const plazaMap = new Map<string, PlazaGovernanceMetrics>();
        const plazaUsers = new Map<string, Set<string>>();

        function ensurePlaza(plaza: string) {
          if (!plazaMap.has(plaza)) {
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
        }

        // From pricing codes store — real price entries per plaza
        for (const code of codes) {
          if (!code.prices) continue;
          for (const [plaza, priceData] of Object.entries(code.prices)) {
            ensurePlaza(plaza);
            plazaMap.get(plaza)!.totalPricingsReceived++;
            if (priceData.preenchidoPor) {
              plazaUsers.get(plaza)!.add(priceData.preenchidoPor);
            }
          }
        }

        // From approval store — real approval/rejection records
        for (const approval of approvals) {
          ensurePlaza(approval.plaza);
          const m = plazaMap.get(approval.plaza)!;
          if (approval.status === 'approved') m.totalApproved++;
          else if (approval.status === 'rejected') m.totalRejected++;
          else if (approval.status === 'pending') m.totalPending++;
          if (approval.requestedBy) plazaUsers.get(approval.plaza)!.add(approval.requestedBy);
          if (approval.reviewedBy) plazaUsers.get(approval.plaza)!.add(approval.reviewedBy);
        }

        // From real activity logs
        for (const log of logs) {
          ensurePlaza(log.plaza);
          plazaUsers.get(log.plaza)!.add(log.userId);
          const m = plazaMap.get(log.plaza)!;
          if (log.action === 'price_set') m.totalPricingsReceived++;
          else if (log.action === 'price_approved') m.totalApproved++;
          else if (log.action === 'price_rejected') m.totalRejected++;
        }

        // Finalize computed fields
        for (const [plaza, m] of plazaMap) {
          const decided = m.totalApproved + m.totalRejected;
          // Pending: explicit pending approvals plus unreviewed pricings
          const unreviewedPricings = Math.max(0, m.totalPricingsReceived - decided - m.totalPending);
          m.totalPending += unreviewedPricings;
          m.approvalRate = decided > 0 ? Math.round((m.totalApproved / decided) * 100) : 0;
          m.activeUsers = plazaUsers.get(plaza)!.size;

          // Compute avg decision time from approval store timestamps
          const plazaApprovals = approvals.filter(
            (a) => a.plaza === plaza && (a.status === 'approved' || a.status === 'rejected') && a.reviewedAt && a.requestedAt
          );
          if (plazaApprovals.length > 0) {
            const totalMinutes = plazaApprovals.reduce((sum, a) => {
              const diff = new Date(a.reviewedAt!).getTime() - new Date(a.requestedAt).getTime();
              return sum + Math.max(0, diff / (1000 * 60));
            }, 0);
            m.avgDecisionTime = Math.round(totalMinutes / plazaApprovals.length);
          }
        }

        return Array.from(plazaMap.values());
      },

      getTopUsers: (limit: number) => {
        const metrics = get().getUserMetrics();

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
