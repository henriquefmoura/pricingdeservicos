import { useCallback } from 'react';
import { usePricingMentorStore } from '../store/pricingMentorStore';
import type { PricingAnalysisContext, MentorExpression } from '../types/pricingMentor';

/**
 * Hook for integrating Pricing Mentor into any page.
 *
 * Usage:
 *   const { notifyPriceChange, openChat, sendQuestion } = usePricingMentor();
 *   notifyPriceChange({ serviceCode: '001', currentPrice: 120, costPrice: 100 });
 */
export function usePricingMentor() {
  const {
    isOpen,
    isTyping,
    expression,
    userLevel,
    toggleOpen,
    sendMessage,
    analyzeContext,
    requestSimulation,
    addNudge,
    setExpression,
    nudges,
  } = usePricingMentorStore();

  /** Analyze a pricing context and generate nudges if issues are found */
  const notifyPriceChange = useCallback(
    (context: PricingAnalysisContext) => {
      analyzeContext(context);
    },
    [analyzeContext],
  );

  /** Open the chat panel */
  const openChat = useCallback(() => {
    if (!isOpen) toggleOpen();
  }, [isOpen, toggleOpen]);

  /** Send a question programmatically */
  const sendQuestion = useCallback(
    (question: string, context?: PricingAnalysisContext) => {
      if (!isOpen) toggleOpen();
      sendMessage(question, context);
    },
    [isOpen, toggleOpen, sendMessage],
  );

  /** Trigger a simulation from outside the chat */
  const simulate = useCallback(
    (currentPrice: number, costPrice: number, newPrice: number, quantity?: number) => {
      if (!isOpen) toggleOpen();
      requestSimulation(currentPrice, costPrice, newPrice, quantity);
    },
    [isOpen, toggleOpen, requestSimulation],
  );

  /** Change the mentor's expression */
  const setMentorExpression = useCallback(
    (expr: MentorExpression) => {
      setExpression(expr);
    },
    [setExpression],
  );

  return {
    isOpen,
    isTyping,
    expression,
    userLevel,
    openChat,
    sendQuestion,
    notifyPriceChange,
    simulate,
    addNudge,
    setMentorExpression,
    activeNudges: nudges.filter((n) => !n.dismissed),
  };
}
