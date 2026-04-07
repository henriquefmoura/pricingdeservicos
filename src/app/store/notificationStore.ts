import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationType, NotificationPriority } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (role: 'master' | 'admin' | 'user', plaza?: string) => void;
  getNotificationsForRole: (role: 'master' | 'admin' | 'user', plaza?: string) => Notification[];
  getUnreadCount: (role: 'master' | 'admin' | 'user', plaza?: string) => number;
  deleteNotification: (id: string) => void;
  initializeMockNotifications: () => void;
}

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const MOCK_NOTIFICATIONS: Omit<Notification, 'id'>[] = [
  // Support requests from admins to master
  {
    type: 'support_request',
    title: 'Dúvida sobre precificação',
    message: 'Admin SP tem uma dúvida sobre os códigos de pintura epóxi. Precisa de orientação sobre a margem mínima.',
    fromUserId: '2',
    fromUserName: 'Admin São Paulo',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'SP',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    type: 'support_request',
    title: 'Problema com código de deslocamento',
    message: 'O código 50041159 de deslocamento está com valores inconsistentes. Preciso de ajuda para corrigir.',
    fromUserId: '3',
    fromUserName: 'Admin Rio de Janeiro',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'RJ',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  // Support from user to master
  {
    type: 'support_request',
    title: 'Solicitação de revisão de preço',
    message: 'Usuário SP solicita revisão do preço aprovado para Vistoria de Imóveis. O valor está abaixo do mercado local.',
    fromUserId: '11',
    fromUserName: 'Usuário SP',
    fromUserRole: 'user',
    toRole: 'master',
    plaza: 'SP',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  // Plaza pricing complete notifications
  {
    type: 'plaza_pricing_complete',
    title: 'Praça SP concluiu precificação',
    message: 'Todos os códigos da praça São Paulo foram precificados com sucesso. 10 códigos concluídos.',
    fromUserId: 'system',
    fromUserName: 'Sistema',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'SP',
    priority: 'low',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    type: 'plaza_pricing_complete',
    title: 'Praça MG concluiu precificação',
    message: 'Todos os códigos da praça Minas Gerais foram precificados. 10 códigos concluídos.',
    fromUserId: 'system',
    fromUserName: 'Sistema',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'MG',
    priority: 'low',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  // New codes to price (master → admin)
  {
    type: 'new_codes_to_price',
    title: 'Novos códigos para precificar',
    message: 'O Master adicionou 10 novos códigos de Renovação de Banheiro para precificação. Prazo: 16/03 à 31/03.',
    fromUserId: '1',
    fromUserName: 'Master',
    fromUserRole: 'master',
    toRole: 'admin',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    type: 'new_codes_to_price',
    title: 'Códigos atualizados',
    message: 'Novos códigos complementares foram adicionados: Inst. Box Padrão, Placas Flexíveis, Cimento Queimado.',
    fromUserId: '1',
    fromUserName: 'Master',
    fromUserRole: 'master',
    toRole: 'admin',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  // Codes from admin → user
  {
    type: 'codes_from_admin',
    title: 'Novos preços para validação',
    message: 'Admin SP definiu novos preços que precisam da sua validação. 3 itens pendentes de aprovação.',
    fromUserId: '2',
    fromUserName: 'Admin São Paulo',
    fromUserRole: 'admin',
    toRole: 'user',
    toPlaza: 'SP',
    plaza: 'SP',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    type: 'codes_from_admin',
    title: 'Preços replicados para validação',
    message: 'Preços foram replicados da praça SP para RJ. 2 itens aguardando sua aprovação.',
    fromUserId: '2',
    fromUserName: 'Admin São Paulo',
    fromUserRole: 'admin',
    toRole: 'user',
    toPlaza: 'RJ',
    plaza: 'RJ',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  // Support reply
  {
    type: 'support_reply',
    title: 'Resposta do Master',
    message: 'O Master respondeu sua solicitação sobre margem mínima de pintura epóxi. Confira na aba de suporte.',
    fromUserId: '1',
    fromUserName: 'Master',
    fromUserRole: 'master',
    toRole: 'admin',
    toPlaza: 'SP',
    plaza: 'SP',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: new Date(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: (role, plaza) => {
        set((state) => ({
          notifications: state.notifications.map((n) => {
            const isForRole = n.toRole === role;
            const isForPlaza = !plaza || !n.toPlaza || n.toPlaza === plaza;
            if (isForRole && isForPlaza) {
              return { ...n, read: true };
            }
            return n;
          }),
        }));
      },

      getNotificationsForRole: (role, plaza) => {
        return get().notifications
          .filter((n) => {
            const isForRole = n.toRole === role;
            const isForPlaza = !plaza || !n.toPlaza || n.toPlaza === plaza;
            return isForRole && isForPlaza;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getUnreadCount: (role, plaza) => {
        return get().notifications.filter((n) => {
          const isForRole = n.toRole === role;
          const isForPlaza = !plaza || !n.toPlaza || n.toPlaza === plaza;
          return isForRole && isForPlaza && !n.read;
        }).length;
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      initializeMockNotifications: () => {
        const current = get().notifications;
        if (current.length === 0) {
          set({
            notifications: MOCK_NOTIFICATIONS.map((n) => ({
              ...n,
              id: generateId(),
            })),
          });
        }
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);
