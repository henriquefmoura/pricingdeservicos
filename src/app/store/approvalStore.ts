import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '../lib/supabase';
import * as approvalsApi from '../services/api/approvalsApi';
import { calculateMargemComImpostos } from '../data/plazasData';
import { usePricingCodesStore } from './pricingCodesStore';

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
  codeId?: string; // Internal ID in pricingCodesStore (used to write price on approval)
  codigo: string;
  descricao: string; // Descrição do serviço
  grupo: string;
  /** Grupo de serviço (ex: "Chuveiro/Torneira Elétrica") — usado para sugestão ML */
  grupoServico?: string;
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
  isLoading: boolean;
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
  /** Load approvals from Supabase (no-op when offline). */
  syncFromBackend: () => Promise<void>;
}

/** Resolves the internal pricingCodesStore ID from an approval record and writes the confirmed price. */
function applyPriceToPricingStore(
  approval: PriceApproval,
  repasse: number,
  venda: number,
  filledBy: string,
) {
  const pricingStore = usePricingCodesStore.getState();
  let resolvedCodeId = approval.codeId;
  if (!resolvedCodeId) {
    const match = pricingStore.codes.find(
      (c) =>
        c.codigoAvulso === approval.codigo ||
        c.codigoAtrelado === approval.codigo ||
        c.descricao === approval.descricao,
    );
    resolvedCodeId = match?.id;
  }
  if (resolvedCodeId) {
    pricingStore.updateCodePrice(resolvedCodeId, approval.plaza, repasse, venda, filledBy);
  }
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: [],
      adjustmentLog: [],
      isLoading: false,

      syncFromBackend: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          const [dbApprovals, dbLog] = await Promise.all([
            approvalsApi.fetchApprovals(),
            approvalsApi.fetchAdjustmentLog(),
          ]);
          if (dbApprovals) {
            set({
              approvals: dbApprovals.map((a) => ({
                id: a.id,
                codigo: a.codigo,
                descricao: a.descricao,
                grupo: a.grupo,
                grupoServico: (a as Record<string, unknown>).grupo_servico as string | undefined,
                plaza: a.plaza,
                currentRepasse: Number(a.current_repasse),
                currentVenda: Number(a.current_venda),
                currentMargem: Number(a.current_margem),
                proposedRepasse: Number(a.proposed_repasse),
                proposedVenda: Number(a.proposed_venda),
                proposedMargem: Number(a.proposed_margem),
                variation: Number(a.variation),
                isNewService: a.is_new_service,
                status: a.status as ApprovalStatus,
                requestedBy: a.requested_by,
                requestedAt: new Date(a.requested_at),
                reviewedBy: a.reviewed_by ?? undefined,
                reviewedAt: a.reviewed_at ? new Date(a.reviewed_at) : undefined,
                comments: a.comments ?? undefined,
              })),
            });
          }
          if (dbLog) {
            set({
              adjustmentLog: dbLog.map((l) => ({
                id: l.id,
                approvalId: l.approval_id,
                codigo: l.codigo,
                descricao: l.descricao,
                grupo: l.grupo,
                plaza: l.plaza,
                suggestedRepasse: Number(l.suggested_repasse),
                suggestedVenda: Number(l.suggested_venda),
                suggestedMargem: Number(l.suggested_margem),
                adjustedRepasse: Number(l.adjusted_repasse),
                adjustedVenda: Number(l.adjusted_venda),
                adjustedMargem: Number(l.adjusted_margem),
                variationPercent: Number(l.variation_percent),
                adjustedBy: l.adjusted_by,
                adjustedAt: new Date(l.adjusted_at),
              })),
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

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

        if (isSupabaseConfigured()) {
          approvalsApi.insertApproval({
            codigo: approval.codigo,
            descricao: approval.descricao,
            grupo: approval.grupo,
            plaza: approval.plaza,
            current_repasse: approval.currentRepasse,
            current_venda: approval.currentVenda,
            current_margem: approval.currentMargem,
            proposed_repasse: approval.proposedRepasse,
            proposed_venda: approval.proposedVenda,
            proposed_margem: approval.proposedMargem,
            variation: approval.variation,
            is_new_service: approval.isNewService,
            requested_by: approval.requestedBy,
            reviewed_by: null,
            reviewed_at: null,
            comments: null,
          }).then((dbApproval) => {
            if (dbApproval) {
              set((state) => ({
                approvals: state.approvals.map((a) =>
                  a.id === newApproval.id ? { ...a, id: dbApproval.id } : a
                ),
              }));
            }
          });
        }
      },

      approvePrice: (id, reviewedBy, comments) => {
        const approval = get().approvals.find((a) => a.id === id);

        set((state) => ({
          approvals: state.approvals.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'approved' as ApprovalStatus,
                  reviewedBy,
                  reviewedAt: new Date(),
                  comments,
                }
              : a
          ),
        }));

        // Write the confirmed price into pricingCodesStore for the target plaza
        if (approval) {
          applyPriceToPricingStore(approval, approval.proposedRepasse, approval.proposedVenda, reviewedBy);
        }

        if (isSupabaseConfigured()) {
          approvalsApi.updateApprovalStatus(id, 'approved', reviewedBy, comments);
        }
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
        if (isSupabaseConfigured()) {
          approvalsApi.updateApprovalStatus(id, 'rejected', reviewedBy, comments);
        }
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

        const adjustedMargem = calculateMargemComImpostos(newVenda, newRepasse, approval.plaza);
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

        // Write the adjusted price into pricingCodesStore for the target plaza
        applyPriceToPricingStore(approval, newRepasse, newVenda, adjustedBy || approval.reviewedBy || 'Usuário');

        // Sync to backend
        if (isSupabaseConfigured()) {
          const finalVariation =
            approval.currentVenda === 0
              ? 0
              : ((newVenda - approval.currentVenda) / approval.currentVenda) * 100;
          approvalsApi.updateApprovalAfterAdjustment(
            id, newRepasse, newVenda, adjustedMargem, finalVariation,
          );
          approvalsApi.insertAdjustmentLog({
            approval_id: id,
            codigo: approval.codigo,
            descricao: approval.descricao,
            grupo: approval.grupo,
            plaza: approval.plaza,
            suggested_repasse: approval.proposedRepasse,
            suggested_venda: approval.proposedVenda,
            suggested_margem: approval.proposedMargem,
            adjusted_repasse: newRepasse,
            adjusted_venda: newVenda,
            adjusted_margem: adjustedMargem,
            variation_percent: variationPercent,
            adjusted_by: adjustedBy || approval.reviewedBy || 'Usuário',
            adjusted_at: new Date().toISOString(),
          });
        }
      },
    }),
    {
      name: 'approval-storage',
    }
  )
);