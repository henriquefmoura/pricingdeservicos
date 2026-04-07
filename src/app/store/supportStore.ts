import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportThread, SupportMessage } from '../types/notification';

interface SupportState {
  threads: SupportThread[];
  createThread: (thread: Omit<SupportThread, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'messages'>) => string;
  addMessage: (threadId: string, message: Omit<SupportMessage, 'id' | 'threadId' | 'createdAt' | 'read'>) => void;
  closeThread: (threadId: string) => void;
  getThreadsForRole: (role: 'master' | 'admin' | 'user', plaza?: string) => SupportThread[];
  getThreadById: (threadId: string) => SupportThread | undefined;
  markThreadMessagesRead: (threadId: string, readerRole: 'master' | 'admin' | 'user') => void;
  getUnreadThreadCount: (role: 'master' | 'admin' | 'user', plaza?: string) => number;
  initializeMockThreads: () => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const createMockThreads = (): SupportThread[] => {
  const now = Date.now();
  return [
    {
      id: 'thread-mock-1',
      subject: 'Dúvida sobre margem mínima - Pintura Epóxi',
      fromUserId: '2',
      fromUserName: 'Admin São Paulo',
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: 'SP',
      status: 'open',
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
      updatedAt: new Date(now - 30 * 60 * 1000),
      messages: [
        {
          id: 'msg-mock-1',
          threadId: 'thread-mock-1',
          fromUserId: '2',
          fromUserName: 'Admin São Paulo',
          fromUserRole: 'admin',
          toRole: 'master',
          message: 'Olá, tenho uma dúvida sobre a margem mínima aceitável para os códigos de Pintura Epóxi (50041157 e 50041158). O mercado local está com preços mais baixos.',
          createdAt: new Date(now - 5 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-2',
          threadId: 'thread-mock-1',
          fromUserId: '1',
          fromUserName: 'Master',
          fromUserRole: 'master',
          toRole: 'admin',
          toPlaza: 'SP',
          message: 'A margem mínima para Pintura Epóxi deve ser de 35%. Se o mercado está abaixo, podemos analisar uma exceção. Me envie os dados da pesquisa de mercado.',
          createdAt: new Date(now - 3 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-3',
          threadId: 'thread-mock-1',
          fromUserId: '2',
          fromUserName: 'Admin São Paulo',
          fromUserRole: 'admin',
          toRole: 'master',
          message: 'Enviei os dados pela pesquisa de mercado. Os concorrentes estão praticando entre R$45-55/m². Nossa sugestão ficaria em R$62/m². Seria possível ajustar?',
          createdAt: new Date(now - 30 * 60 * 1000),
          read: false,
        },
      ],
    },
    {
      id: 'thread-mock-2',
      subject: 'Código de deslocamento com valor inconsistente',
      fromUserId: '3',
      fromUserName: 'Admin Rio de Janeiro',
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: 'RJ',
      status: 'open',
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-mock-4',
          threadId: 'thread-mock-2',
          fromUserId: '3',
          fromUserName: 'Admin Rio de Janeiro',
          fromUserRole: 'admin',
          toRole: 'master',
          message: 'O código 50041159 de Deslocamento Renovação de Banheiro está com valor de repasse muito alto comparado com outras praças. Pode verificar?',
          createdAt: new Date(now - 8 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-5',
          threadId: 'thread-mock-2',
          fromUserId: '1',
          fromUserName: 'Master',
          fromUserRole: 'master',
          toRole: 'admin',
          toPlaza: 'RJ',
          message: 'Vou verificar. O valor base deveria ser calculado por km. Qual é o valor que está aparecendo para você?',
          createdAt: new Date(now - 4 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-6',
          threadId: 'thread-mock-2',
          fromUserId: '3',
          fromUserName: 'Admin Rio de Janeiro',
          fromUserRole: 'admin',
          toRole: 'master',
          message: 'Está aparecendo R$15,00/km de repasse, enquanto SP está com R$8,50/km. A diferença parece alta.',
          createdAt: new Date(now - 1 * 60 * 60 * 1000),
          read: false,
        },
      ],
    },
    {
      id: 'thread-mock-3',
      subject: 'Solicitação de revisão - Vistoria de Imóveis',
      fromUserId: '11',
      fromUserName: 'Usuário SP',
      fromUserRole: 'user',
      toRole: 'admin',
      plaza: 'SP',
      status: 'open',
      createdAt: new Date(now - 6 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-mock-7',
          threadId: 'thread-mock-3',
          fromUserId: '11',
          fromUserName: 'Usuário SP',
          fromUserRole: 'user',
          toRole: 'admin',
          toPlaza: 'SP',
          message: 'O preço de venda aprovado para Vistoria de Imóveis (R$280) parece estar abaixo da referência de mercado atual. Podemos revisar?',
          createdAt: new Date(now - 6 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-8',
          threadId: 'thread-mock-3',
          fromUserId: '2',
          fromUserName: 'Admin São Paulo',
          fromUserRole: 'admin',
          toRole: 'user',
          toPlaza: 'SP',
          message: 'Entendo sua preocupação. Vou verificar os dados da pesquisa de mercado e solicitar uma análise ao Master se necessário.',
          createdAt: new Date(now - 2 * 60 * 60 * 1000),
          read: false,
        },
      ],
    },
    {
      id: 'thread-mock-4',
      subject: 'Problema técnico na interface',
      fromUserId: '12',
      fromUserName: 'Usuário RJ',
      fromUserRole: 'user',
      toRole: 'admin',
      plaza: 'RJ',
      status: 'closed',
      createdAt: new Date(now - 48 * 60 * 60 * 1000),
      updatedAt: new Date(now - 24 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-mock-9',
          threadId: 'thread-mock-4',
          fromUserId: '12',
          fromUserName: 'Usuário RJ',
          fromUserRole: 'user',
          toRole: 'admin',
          toPlaza: 'RJ',
          message: 'Estou com dificuldade para visualizar os preços propostos na aba de pendentes.',
          createdAt: new Date(now - 48 * 60 * 60 * 1000),
          read: true,
        },
        {
          id: 'msg-mock-10',
          threadId: 'thread-mock-4',
          fromUserId: '3',
          fromUserName: 'Admin Rio de Janeiro',
          fromUserRole: 'admin',
          toRole: 'user',
          toPlaza: 'RJ',
          message: 'Tente limpar o cache do navegador e atualizar a página. Se persistir, me avise.',
          createdAt: new Date(now - 24 * 60 * 60 * 1000),
          read: true,
        },
      ],
    },
  ];
};

export const useSupportStore = create<SupportState>()(
  persist(
    (set, get) => ({
      threads: [],

      createThread: (thread) => {
        const id = generateId('thread');
        const now = new Date();
        const newThread: SupportThread = {
          ...thread,
          id,
          status: 'open',
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({
          threads: [newThread, ...state.threads],
        }));
        return id;
      },

      addMessage: (threadId, message) => {
        const msg: SupportMessage = {
          ...message,
          id: generateId('msg'),
          threadId,
          createdAt: new Date(),
          read: false,
        };
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: [...t.messages, msg], updatedAt: new Date() }
              : t
          ),
        }));
      },

      closeThread: (threadId) => {
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, status: 'closed', updatedAt: new Date() } : t
          ),
        }));
      },

      getThreadsForRole: (role, plaza) => {
        return get()
          .threads.filter((t) => {
            // Master sees all threads where toRole is master, OR threads originated by admin/user
            if (role === 'master') {
              return t.toRole === 'master' || t.fromUserRole !== 'master';
            }
            // Admin sees threads where they are participant
            if (role === 'admin') {
              const isParticipant =
                (t.fromUserRole === 'admin' && (!plaza || t.plaza === plaza)) ||
                (t.toRole === 'admin' && (!plaza || t.plaza === plaza));
              return isParticipant;
            }
            // User sees threads where they are participant
            if (role === 'user') {
              const isParticipant =
                (t.fromUserRole === 'user' && (!plaza || t.plaza === plaza)) ||
                (t.toRole === 'user' && (!plaza || t.plaza === plaza));
              return isParticipant;
            }
            return false;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getThreadById: (threadId) => {
        return get().threads.find((t) => t.id === threadId);
      },

      markThreadMessagesRead: (threadId, readerRole) => {
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              messages: t.messages.map((m) => {
                // Mark as read if the message was sent TO the reader's role
                if (m.fromUserRole !== readerRole) {
                  return { ...m, read: true };
                }
                return m;
              }),
            };
          }),
        }));
      },

      getUnreadThreadCount: (role, plaza) => {
        const threads = get().getThreadsForRole(role, plaza);
        return threads.filter((t) =>
          t.messages.some((m) => !m.read && m.fromUserRole !== role)
        ).length;
      },

      initializeMockThreads: () => {
        const current = get().threads;
        if (current.length === 0) {
          set({ threads: createMockThreads() });
        }
      },
    }),
    {
      name: 'support-storage',
    }
  )
);
