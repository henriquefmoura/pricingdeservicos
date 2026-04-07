import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MentorMessage, MentorNudge, UserLevel, MentorCategory, PricingAnalysisContext, UserBehavior } from '../types/pricingMentor';
import {
  getGreetingMessage,
  generateResponseAsync,
  getRandomNudge,
  analyzePricingContext,
  getMicroLesson,
  formatLessonAsMessage,
  simulatePrice,
} from '../services/pricingMentorService';

interface PricingMentorState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  messages: MentorMessage[];
  nudges: MentorNudge[];
  userLevel: UserLevel;
  questionCount: number;
  hasGreeted: boolean;
  behavior: UserBehavior;
  expression: 'happy' | 'thinking' | 'alert' | 'wink' | 'surprised' | 'pointing';
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
  setExpression: (expr: PricingMentorState['expression']) => void;
}

type PricingMentorStore = PricingMentorState & PricingMentorActions;

const DEFAULT_BEHAVIOR: UserBehavior = {
  topicFrequency: {},
  totalQuestions: 0,
  lastActiveTimestamp: 0,
  preferredTopics: [],
  sessionCount: 0,
};

function computeUserLevel(behavior: UserBehavior): UserLevel {
  if (behavior.totalQuestions > 30) return 'avancado';
  if (behavior.totalQuestions > 10) return 'intermediario';
  return 'iniciante';
}

function updateBehavior(behavior: UserBehavior, category: MentorCategory): UserBehavior {
  const freq = { ...behavior.topicFrequency };
  freq[category] = (freq[category] || 0) + 1;

  // Compute top 3 preferred topics
  const sorted = (Object.entries(freq) as [MentorCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return {
    ...behavior,
    topicFrequency: freq,
    totalQuestions: behavior.totalQuestions + 1,
    lastActiveTimestamp: Date.now(),
    preferredTopics: sorted,
  };
}

export const usePricingMentorStore = create<PricingMentorStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      isTyping: false,
      messages: [] as MentorMessage[],
      nudges: [] as MentorNudge[],
      userLevel: 'iniciante' as UserLevel,
      questionCount: 0,
      hasGreeted: false,
      behavior: DEFAULT_BEHAVIOR,
      expression: 'happy' as PricingMentorState['expression'],

      toggleOpen: () => {
        const state = get();
        if (!state.isOpen && !state.hasGreeted) {
          const greeting = getGreetingMessage();
          set({
            isOpen: true,
            isMinimized: false,
            hasGreeted: true,
            messages: [...state.messages, greeting],
            expression: 'wink',
            behavior: {
              ...state.behavior,
              sessionCount: state.behavior.sessionCount + 1,
            },
          });
          // Reset expression after animation
          setTimeout(() => {
            set({ expression: 'happy' });
          }, 2000);
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

        // Show typing indicator
        set({
          messages: [...state.messages, userMsg],
          isTyping: true,
          expression: 'thinking',
        });

        // Generate async AI response
        generateResponseAsync(text, context).then((response) => {
          const currentState = get();
          const category = response.category || 'geral';
          const newBehavior = updateBehavior(currentState.behavior, category);
          const newLevel = computeUserLevel(newBehavior);

          set({
            messages: [...currentState.messages, response],
            isTyping: false,
            questionCount: currentState.questionCount + 1,
            userLevel: newLevel,
            behavior: newBehavior,
            expression: 'happy',
          });
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
          set({
            messages: [...state.messages, msg],
            expression: 'pointing',
          });
          setTimeout(() => set({ expression: 'happy' }), 2000);
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

        // Alert expression for negative margins
        const alertExpr = result.newMargin < 0 ? 'alert' : result.newMargin > 30 ? 'happy' : 'thinking';
        set({
          messages: [...state.messages, msg],
          expression: alertExpr,
        });
        setTimeout(() => set({ expression: 'happy' }), 3000);
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
          set((state) => ({
            nudges: [...state.nudges, ...newNudges],
            expression: newNudges.some(n => n.type === 'alert') ? 'alert' : 'pointing',
          }));
          setTimeout(() => set({ expression: 'happy' }), 4000);
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

      setExpression: (expr) => set({ expression: expr }),
    }),
    {
      name: 'pricing-mentor-storage',
      partialize: (state: PricingMentorStore) => ({
        messages: state.messages.slice(-50),
        userLevel: state.userLevel,
        questionCount: state.questionCount,
        hasGreeted: state.hasGreeted,
        behavior: state.behavior,
      }),
    },
  ),
);
