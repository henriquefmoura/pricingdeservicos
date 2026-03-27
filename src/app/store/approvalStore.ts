import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

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
  addApproval: (approval: Omit<PriceApproval, 'id' | 'status' | 'requestedAt'>) => void;
  approvePrice: (id: string, reviewedBy: string, comments?: string) => void;
  rejectPrice: (id: string, reviewedBy: string, comments?: string) => void;
  getPendingApprovals: (plaza?: string) => PriceApproval[];
  getRejectedApprovals: (plaza?: string) => PriceApproval[];
  getApprovalsByStatus: (status: ApprovalStatus, plaza?: string) => PriceApproval[];
  initializeMockData: () => void;
  // Nova função para aplicar preço editado após rejeição
  applyRejectedPrice: (id: string, newRepasse: number, newVenda: number) => void;
}

// Dados mock para demonstração
const MOCK_APPROVALS: PriceApproval[] = [
  {
    id: 'mock-1',
    codigo: 'VIS-001',
    descricao: 'Vistoria de Imóveis', // Descrição do serviço
    grupo: 'Vistoria',
    plaza: 'SP',
    currentRepasse: 150.00,
    currentVenda: 250.00,
    currentMargem: 40.00,
    proposedRepasse: 160.00,
    proposedVenda: 280.00,
    proposedMargem: 42.86,
    variation: 12.00,
    isNewService: false,
    status: 'pending',
    requestedBy: 'Sistema de Simulação',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
  },
  {
    id: 'mock-2',
    codigo: 'AVA-042',
    descricao: 'Avaliação de Imóveis', // Descrição do serviço
    grupo: 'Avaliação',
    plaza: 'RJ',
    currentRepasse: 320.00,
    currentVenda: 500.00,
    currentMargem: 36.00,
    proposedRepasse: 340.00,
    proposedVenda: 550.00,
    proposedMargem: 38.18,
    variation: 10.00,
    isNewService: false,
    status: 'pending',
    requestedBy: 'Admin',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
  },
  {
    id: 'mock-3',
    codigo: 'LAU-015',
    descricao: 'Laudo de Imóveis', // Descrição do serviço
    grupo: 'Laudo',
    plaza: 'SP',
    currentRepasse: 280.00,
    currentVenda: 450.00,
    currentMargem: 37.78,
    proposedRepasse: 290.00,
    proposedVenda: 480.00,
    proposedMargem: 39.58,
    variation: 6.67,
    isNewService: false,
    status: 'pending',
    requestedBy: 'Sistema de Simulação',
    requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
  },
  {
    id: 'mock-4',
    codigo: 'VIS-023',
    descricao: 'Vistoria de Imóveis', // Descrição do serviço
    grupo: 'Vistoria',
    plaza: 'BH',
    currentRepasse: 130.00,
    currentVenda: 220.00,
    currentMargem: 40.91,
    proposedRepasse: 135.00,
    proposedVenda: 230.00,
    proposedMargem: 41.30,
    variation: 4.55,
    isNewService: false,
    status: 'pending',
    requestedBy: 'Admin',
    requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
  },
];

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      approvals: [],

      initializeMockData: () => {
        const current = get().approvals;
        if (current.length === 0) {
          set({ approvals: MOCK_APPROVALS });
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

      applyRejectedPrice: (id, newRepasse, newVenda) => {
        set((state) => ({
          approvals: state.approvals.map((approval) => {
            if (approval.id === id) {
              // Calcular variação correta
              const variation = approval.currentVenda === 0 
                ? 0 
                : ((newVenda - approval.currentVenda) / approval.currentVenda) * 100;
              
              return {
                ...approval,
                status: 'approved' as ApprovalStatus,
                proposedRepasse: newRepasse,
                proposedVenda: newVenda,
                proposedMargem: ((newVenda - newRepasse) / newVenda) * 100,
                variation,
                isNewService: approval.currentVenda === 0,
                reviewedAt: new Date(),
              };
            }
            return approval;
          }),
        }));
      },
    }),
    {
      name: 'approval-storage',
    }
  )
);