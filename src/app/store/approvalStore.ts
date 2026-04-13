import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PriceAdjustmentRecord {
  id: string;
  approvalId: string;
  codigo: string;
  descricao: string;
  grupo: string;
  plaza: string;
  // Preço sugerido (proposto pelo sistema/admin — antes da rejeição)
  suggestedRepasse: number;
  suggestedVenda: number;
  suggestedMargem: number;
  // Preço ajustado (definido pelo usuário após rejeição)
  adjustedRepasse: number;
  adjustedVenda: number;
  adjustedMargem: number;
  // Variação percentual sobre o preço de venda sugerido
  variationPercent: number;
  adjustedBy: string;
  adjustedAt: Date;
}

export interface PriceApproval {
  id: string;
  codigo: string;
  descricao: string; // Descrição do serviço
  grupo: string;
  plaza: string;
  currentRepasse: number;
  currentVenda: number;
  currentMargem: number;
  proposedRepasse: number;
  proposedVenda: number;
  proposedMargem: number;
  variation: number;
  isNewService: boolean; // true quando currentVenda === 0 (serviço novo)
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  comments?: string;
}

interface ApprovalState {
  approvals: PriceApproval[];
  // Log de comparação: preço sugerido vs preço ajustado após rejeição (para ML)
  adjustmentLog: PriceAdjustmentRecord[];
  addApproval: (approval: Omit<PriceApproval, 'id' | 'status' | 'requestedAt'>) => void;
  approvePrice: (id: string, reviewedBy: string, comments?: string) => void;
  rejectPrice: (id: string, reviewedBy: string, comments?: string) => void;
  getPendingApprovals: (plaza?: string) => PriceApproval[];
  getRejectedApprovals: (plaza?: string) => PriceApproval[];
  getApprovalsByStatus: (status: ApprovalStatus, plaza?: string) => PriceApproval[];
  getAdjustmentLog: () => PriceAdjustmentRecord[];
  initializeMockData: () => void;
  // Aplica preço ajustado após rejeição e registra no log para ML
  applyRejectedPrice: (id: string, newRepasse: number, newVenda: number, adjustedBy?: string) => void;
}



export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: [],
      adjustmentLog: [],

      initializeMockData: () => {
        // Clear any legacy mock approvals; real approvals are created via addApproval()
        const current = get().approvals;
        const hasMockApprovals = current.some((a) => a.id.startsWith('mock-'));
        if (hasMockApprovals) {
          set({ approvals: current.filter((a) => !a.id.startsWith('mock-')) });
        }
      },

      addApproval: (approval) => {
        const newApproval: PriceApproval = {
          ...approval,
          id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          requestedAt: new Date(),
        };
        
        set((state) => ({
          approvals: [...state.approvals, newApproval],
        }));
      },

      approvePrice: (id, reviewedBy, comments) => {
        set((state) => ({
          approvals: state.approvals.map((approval) =>
            approval.id === id
              ? {
                  ...approval,
                  status: 'approved' as ApprovalStatus,
                  reviewedBy,
                  reviewedAt: new Date(),
                  comments,
                }
              : approval
          ),
        }));
      },

      rejectPrice: (id, reviewedBy, comments) => {
        set((state) => ({
          approvals: state.approvals.map((approval) =>
            approval.id === id
              ? {
                  ...approval,
                  status: 'rejected' as ApprovalStatus,
                  reviewedBy,
                  reviewedAt: new Date(),
                  comments,
                }
              : approval
          ),
        }));
      },

      getPendingApprovals: (plaza) => {
        const approvals = get().approvals.filter((a) => a.status === 'pending');
        if (plaza) {
          return approvals.filter((a) => a.plaza === plaza);
        }
        return approvals;
      },

      getRejectedApprovals: (plaza) => {
        const approvals = get().approvals.filter((a) => a.status === 'rejected');
        if (plaza) {
          return approvals.filter((a) => a.plaza === plaza);
        }
        return approvals;
      },

      getApprovalsByStatus: (status, plaza) => {
        const approvals = get().approvals.filter((a) => a.status === status);
        if (plaza) {
          return approvals.filter((a) => a.plaza === plaza);
        }
        return approvals;
      },

      getAdjustmentLog: () => {
        return get().adjustmentLog;
      },

      applyRejectedPrice: (id, newRepasse, newVenda, adjustedBy) => {
        const approval = get().approvals.find((a) => a.id === id);
        if (!approval) return;

        const adjustedMargem = newVenda > 0 ? ((newVenda - newRepasse) / newVenda) * 100 : 0;
        const variationPercent =
          approval.proposedVenda > 0
            ? ((newVenda - approval.proposedVenda) / approval.proposedVenda) * 100
            : 0;

        // Registrar no log para aprendizado de ML
        const logEntry: PriceAdjustmentRecord = {
          id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          approvalId: id,
          codigo: approval.codigo,
          descricao: approval.descricao,
          grupo: approval.grupo,
          plaza: approval.plaza,
          suggestedRepasse: approval.proposedRepasse,
          suggestedVenda: approval.proposedVenda,
          suggestedMargem: approval.proposedMargem,
          adjustedRepasse: newRepasse,
          adjustedVenda: newVenda,
          adjustedMargem,
          variationPercent,
          adjustedBy: adjustedBy || approval.reviewedBy || 'Usuário',
          adjustedAt: new Date(),
        };

        set((state) => ({
          adjustmentLog: [...state.adjustmentLog, logEntry],
          approvals: state.approvals.map((a) => {
            if (a.id !== id) return a;
            const variation =
              a.currentVenda === 0
                ? 0
                : ((newVenda - a.currentVenda) / a.currentVenda) * 100;
            return {
              ...a,
              status: 'approved' as ApprovalStatus,
              proposedRepasse: newRepasse,
              proposedVenda: newVenda,
              proposedMargem: adjustedMargem,
              variation,
              isNewService: a.currentVenda === 0,
              reviewedAt: new Date(),
            };
          }),
        }));
      },
    }),
    {
      name: 'approval-storage',
    }
  )
);