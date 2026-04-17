import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationType, NotificationPriority } from '../types/notification';
import { isSupabaseConfigured } from '../lib/supabase';
import * as notificationsApi from '../services/api/notificationsApi';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (role: 'master' | 'admin' | 'user', plaza?: string) => void;
  getNotificationsForRole: (role: 'master' | 'admin' | 'user', plaza?: string) => Notification[];
  getUnreadCount: (role: 'master' | 'admin' | 'user', plaza?: string) => number;
  deleteNotification: (id: string) => void;
  initializeMockNotifications: () => void;
  /** Load notifications from Supabase (no-op when offline). */
  syncFromBackend: () => Promise<void>;
  /** Start realtime subscription for new notifications. Returns unsubscribe fn. */
  subscribeRealtime: () => { unsubscribe: () => void };
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
    plaza: 'Praça São Paulo',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    type: 'support_request',
    title: 'Problema com código de deslocamento',
    message: 'O código 50041159 de deslocamento está com valores inconsistentes. Preciso de ajuda para corrigir.',
    fromUserId: '7',
    fromUserName: 'Admin Brasília',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'Praça Brasília',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  // Support from user to master
  {
    type: 'support_request',
    title: 'Solicitação de revisão de preço',
    message: 'Usuário SP solicita revisão do preço aprovado para Vistoria de Imóveis. O valor está abaixo do mercado local.',
    fromUserId: '20',
    fromUserName: 'Usuário São Paulo',
    fromUserRole: 'user',
    toRole: 'master',
    plaza: 'Praça São Paulo',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  // Plaza pricing complete notifications
  {
    type: 'plaza_pricing_complete',
    title: 'Praça São Paulo concluiu precificação',
    message: 'Todos os códigos da praça São Paulo foram precificados com sucesso. 10 códigos concluídos.',
    fromUserId: 'system',
    fromUserName: 'Sistema',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'Praça São Paulo',
    priority: 'low',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    type: 'plaza_pricing_complete',
    title: 'Praça São José concluiu precificação',
    message: 'Todos os códigos da praça São José foram precificados. 10 códigos concluídos.',
    fromUserId: 'system',
    fromUserName: 'Sistema',
    fromUserRole: 'admin',
    toRole: 'master',
    plaza: 'Praça São José',
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
    message: 'Admin São Paulo definiu novos preços que precisam da sua validação. 3 itens pendentes de aprovação.',
    fromUserId: '2',
    fromUserName: 'Admin São Paulo',
    fromUserRole: 'admin',
    toRole: 'user',
    toPlaza: 'Praça São Paulo',
    plaza: 'Praça São Paulo',
    priority: 'high',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    type: 'codes_from_admin',
    title: 'Preços replicados para validação',
    message: 'Preços foram replicados da praça São Paulo para RJ. 2 itens aguardando sua aprovação.',
    fromUserId: '2',
    fromUserName: 'Admin São Paulo',
    fromUserRole: 'admin',
    toRole: 'user',
    toPlaza: 'Praça RJ',
    plaza: 'Praça RJ',
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
    toPlaza: 'Praça São Paulo',
    plaza: 'Praça São Paulo',
    priority: 'medium',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,

      syncFromBackend: async () => {
        if (!isSupabaseConfigured()) return;
        set({ isLoading: true });
        try {
          const dbNotifications = await notificationsApi.fetchNotifications();
          if (dbNotifications) {
            set({
              notifications: dbNotifications.map((n) => ({
                id: n.id,
                type: n.type as Notification['type'],
                title: n.title,
                message: n.message,
                fromUserId: n.from_user_id,
                fromUserName: n.from_user_name,
                fromUserRole: n.from_user_role as Notification['fromUserRole'],
                toRole: n.to_role as Notification['toRole'],
                toPlaza: n.to_plaza ?? undefined,
                plaza: n.plaza ?? undefined,
                priority: n.priority as Notification['priority'],
                read: n.read,
                createdAt: new Date(n.created_at),
                metadata: n.metadata ?? undefined,
              })),
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeRealtime: () => {
        return notificationsApi.subscribeToNotifications((dbNotif) => {
          const n: Notification = {
            id: dbNotif.id,
            type: dbNotif.type as Notification['type'],
            title: dbNotif.title,
            message: dbNotif.message,
            fromUserId: dbNotif.from_user_id,
            fromUserName: dbNotif.from_user_name,
            fromUserRole: dbNotif.from_user_role as Notification['fromUserRole'],
            toRole: dbNotif.to_role as Notification['toRole'],
            toPlaza: dbNotif.to_plaza ?? undefined,
            plaza: dbNotif.plaza ?? undefined,
            priority: dbNotif.priority as Notification['priority'],
            read: dbNotif.read,
            createdAt: new Date(dbNotif.created_at),
            metadata: dbNotif.metadata ?? undefined,
          };
          // Only add if we don't already have it
          const existing = get().notifications.find((ex) => ex.id === n.id);
          if (!existing) {
            set((state) => ({ notifications: [n, ...state.notifications] }));
          }
        });
      },

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

        if (isSupabaseConfigured()) {
          notificationsApi.insertNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            from_user_id: notification.fromUserId,
            from_user_name: notification.fromUserName,
            from_user_role: notification.fromUserRole,
            to_role: notification.toRole,
            to_plaza: notification.toPlaza ?? null,
            plaza: notification.plaza ?? null,
            priority: notification.priority,
            read: false,
            metadata: notification.metadata ?? null,
          }).then((dbNotif) => {
            if (dbNotif) {
              set((state) => ({
                notifications: state.notifications.map((n) =>
                  n.id === newNotification.id ? { ...n, id: dbNotif.id } : n
                ),
              }));
            }
          });
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
        if (isSupabaseConfigured()) {
          notificationsApi.markNotificationRead(id);
        }
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
        if (isSupabaseConfigured()) {
          notificationsApi.markAllNotificationsRead(role, plaza);
        }
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
        if (isSupabaseConfigured()) {
          notificationsApi.deleteNotification(id);
        }
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
