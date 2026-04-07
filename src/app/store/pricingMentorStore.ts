import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MentorMessage, MentorNudge, UserLevel, MentorCategory, PricingAnalysisContext } from '../types/pricingMentor';
import {
  getGreetingMessage,
  generateResponse,
  getRandomNudge,
  analyzePricingContext,
  getMicroLesson,
  formatLessonAsMessage,
  simulatePrice,
} from '../services/pricingMentorService';

interface PricingMentorState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: MentorMessage[];
  nudges: MentorNudge[];
  userLevel: UserLevel;
  questionCount: number;
  hasGreeted: boolean;
}

interface PricingMentorActions {
  toggleOpen: () => void;
  minimize: () => void;
  expand: () => void;
  sendMessage: (text: string, context?: PricingAnalysisContext) => void;
  requestLesson: (category: string) => void;
  requestSimulation: (currentPrice: number, costPrice: number, newPrice: number, quantity?: number) => void;
  addNudge: (nudge: MentorNudge) => void;
  dismissNudge: (id: string) => void;
  analyzeContext: (context: PricingAnalysisContext) => void;
  clearMessages: () => void;
  initGreeting: () => void;
  triggerRandomNudge: () => void;
}

type PricingMentorStore = PricingMentorState & PricingMentorActions;

export const usePricingMentorStore = create<PricingMentorStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      messages: [] as MentorMessage[],
      nudges: [] as MentorNudge[],
      userLevel: 'iniciante' as UserLevel,
      questionCount: 0,
      hasGreeted: false,

      toggleOpen: () => {
        const state = get();
        if (!state.isOpen && !state.hasGreeted) {
          const greeting = getGreetingMessage();
          set({
            isOpen: true,
            isMinimized: false,
            hasGreeted: true,
            messages: [...state.messages, greeting],
          });
        } else {
          set({ isOpen: !state.isOpen, isMinimized: false });
        }
      },

      minimize: () => set({ isMinimized: true }),

      expand: () => set({ isMinimized: false }),

      sendMessage: (text: string, context?: PricingAnalysisContext) => {
        const state = get();
        const userMsg: MentorMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: Date.now(),
        };
        const response = generateResponse(text, context);
        const newCount = state.questionCount + 1;
        const level: UserLevel = newCount > 15 ? 'avancado' : 'iniciante';

        set({
          messages: [...state.messages, userMsg, response],
          questionCount: newCount,
          userLevel: level,
        });
      },

      requestLesson: (category: string) => {
        const state = get();
        const lesson = getMicroLesson(category as MentorCategory);
        if (lesson) {
          const msg: MentorMessage = {
            id: `lesson-${Date.now()}`,
            role: 'mentor',
            content: formatLessonAsMessage(lesson),
            timestamp: Date.now(),
            category: lesson.category,
          };
          set({ messages: [...state.messages, msg] });
        }
      },

      requestSimulation: (currentPrice: number, costPrice: number, newPrice: number, quantity: number = 1) => {
        const state = get();
        const result = simulatePrice(currentPrice, costPrice, newPrice, quantity);
        const content =
          `🔬 **Simulação de Preço**\n\n` +
          `📊 Preço atual: R$${result.currentPrice.toFixed(2)} → Novo: R$${result.newPrice.toFixed(2)} (${result.percentChange > 0 ? '+' : ''}${result.percentChange.toFixed(1)}%)\n\n` +
          `📈 Margem: ${result.currentMargin.toFixed(1)}% → ${result.newMargin.toFixed(1)}%\n\n` +
          `💰 Lucro (${quantity} un.): R$${result.currentProfit.toFixed(2)} → R$${result.newProfit.toFixed(2)}\n\n` +
          `${result.recommendation}`;
        const msg: MentorMessage = {
          id: `sim-${Date.now()}`,
          role: 'mentor',
          content,
          timestamp: Date.now(),
          category: 'simulacao',
        };
        set({ messages: [...state.messages, msg] });
      },

      addNudge: (nudge: MentorNudge) => {
        set((state) => ({ nudges: [...state.nudges, nudge] }));
      },

      dismissNudge: (id: string) => {
        set((state) => ({
          nudges: state.nudges.map((n: MentorNudge) => (n.id === id ? { ...n, dismissed: true } : n)),
        }));
      },

      analyzeContext: (context: PricingAnalysisContext) => {
        const newNudges = analyzePricingContext(context);
        if (newNudges.length > 0) {
          set((state) => ({ nudges: [...state.nudges, ...newNudges] }));
        }
      },

      clearMessages: () => set({ messages: [], hasGreeted: false }),

      initGreeting: () => {
        const state = get();
        if (!state.hasGreeted) {
          const greeting = getGreetingMessage();
          set({ messages: [greeting], hasGreeted: true });
        }
      },

      triggerRandomNudge: () => {
        const nudge = getRandomNudge();
        set((state) => ({ nudges: [...state.nudges, nudge] }));
      },
    }),
    {
      name: 'pricing-mentor-storage',
      partialize: (state: PricingMentorStore) => ({
        messages: state.messages.slice(-50),
        userLevel: state.userLevel,
        questionCount: state.questionCount,
        hasGreeted: state.hasGreeted,
      }),
    },
  ),
);
