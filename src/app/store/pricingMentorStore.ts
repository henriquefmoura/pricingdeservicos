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
import { clearConversationHistory } from '../services/pricingMentorAIService';

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
  /** Counts consecutive user messages that may indicate difficulty */
  consecutiveQuestionCount: number;
  /** Whether to show the escalation card suggesting human specialist */
  showEscalation: boolean;
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
  dismissEscalation: () => void;
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

/**
 * Phrases that indicate the user explicitly wants human support.
 * Matched case-insensitively against user input.
 */
const HUMAN_HELP_PHRASES = [
  'não entendi',
  'nao entendi',
  'ainda tenho dúvida',
  'ainda tenho duvida',
  'quero falar com alguém',
  'quero falar com alguem',
  'preciso de ajuda',
  'não resolveu',
  'nao resolveu',
  'falar com humano',
  'falar com pessoa',
  'ajuda humana',
  'suporte humano',
  'falar com especialista',
  'falar com pedro',
];

/** Returns true if the message text suggests the user needs human help */
function needsHumanHelp(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return HUMAN_HELP_PHRASES.some((phrase) => lower.includes(phrase));
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
      consecutiveQuestionCount: 0,
      showEscalation: false,

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

        // Check for explicit human help request
        const explicitHelp = needsHumanHelp(text);

        // Track consecutive questions for escalation detection
        const newConsecutiveCount = state.consecutiveQuestionCount + 1;

        // Show typing indicator
        set({
          messages: [...state.messages, userMsg],
          isTyping: true,
          expression: 'thinking',
          consecutiveQuestionCount: newConsecutiveCount,
          // Show escalation immediately for explicit requests, or after 3+ consecutive questions
          showEscalation: explicitHelp || newConsecutiveCount >= 3 || state.showEscalation,
        });

        // Generate async AI response
        generateResponseAsync(text, context).then((response) => {
          const currentState = get();
          const category = response.category || 'geral';
          const newBehavior = updateBehavior(currentState.behavior, category);
          const newLevel = computeUserLevel(newBehavior);

          // If the AI responded successfully, add escalation suggestion message when threshold reached
          const shouldSuggestEscalation =
            explicitHelp || newConsecutiveCount >= 3;

          const updatedMessages = [...currentState.messages, response];

          if (shouldSuggestEscalation && !currentState.showEscalation) {
            const escalationMsg: MentorMessage = {
              id: `escalation-${Date.now()}`,
              role: 'mentor',
              content:
                '🤝 Quer falar com nosso especialista Pedro II? Ele pode te ajudar de forma mais direta.',
              timestamp: Date.now(),
              category: 'geral',
            };
            updatedMessages.push(escalationMsg);
          }

          set({
            messages: updatedMessages,
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

        // Expression based on margin result
        let alertExpr: PricingMentorState['expression'] = 'thinking';
        if (result.newMargin < 0) {
          alertExpr = 'alert';
        } else if (result.newMargin > 30) {
          alertExpr = 'happy';
        }
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

      clearMessages: () => {
        clearConversationHistory();
        set({ messages: [], hasGreeted: false });
      },

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

      dismissEscalation: () => set({ showEscalation: false, consecutiveQuestionCount: 0 }),
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
