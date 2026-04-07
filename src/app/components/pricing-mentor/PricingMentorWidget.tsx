import React, { useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { PricingMentorAvatar } from './PricingMentorAvatar';
import { PricingMentorChat } from './PricingMentorChat';
import { PricingMentorNudge } from './PricingMentorNudge';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { useAuthStore } from '../../store/authStore';

const NUDGE_INTERVAL_MS = 120_000;
const INITIAL_NUDGE_DELAY_MS = 30_000;

/**
 * PricingMentorWidget — the global floating widget rendered in App.tsx.
 * Includes the FAB button, chat panel, and nudge toasts.
 */
export function PricingMentorWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen,
    toggleOpen,
    nudges,
    dismissNudge,
    triggerRandomNudge,
  } = usePricingMentorStore();

  const nudgeTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Periodic nudge every 2 minutes (only when chat is closed)
  const startNudgeTimer = useCallback(() => {
    nudgeTimer.current = setInterval(() => {
      const { isOpen: open } = usePricingMentorStore.getState();
      if (!open) {
        triggerRandomNudge();
      }
    }, NUDGE_INTERVAL_MS);
  }, [triggerRandomNudge]);

  useEffect(() => {
    if (isAuthenticated) {
      // Initial nudge after 30s
      const initialTimer = setTimeout(() => {
        const { isOpen: open } = usePricingMentorStore.getState();
        if (!open) triggerRandomNudge();
      }, INITIAL_NUDGE_DELAY_MS);
      startNudgeTimer();
      return () => {
        clearTimeout(initialTimer);
        if (nudgeTimer.current) clearInterval(nudgeTimer.current);
      };
    }
    return () => {
      if (nudgeTimer.current) clearInterval(nudgeTimer.current);
    };
  }, [isAuthenticated, startNudgeTimer, triggerRandomNudge]);

  // Don't render when not logged in
  if (!isAuthenticated) return null;

  const activeNudges = nudges.filter((n) => !n.dismissed).slice(-2);

  return (
    <>
      {/* Global CSS animations */}
      <style>{`
        @keyframes mentorBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes mentorSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mentorPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(120, 190, 32, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(120, 190, 32, 0); }
        }
      `}</style>

      {/* Nudge toasts — top of FAB */}
      {!isOpen && activeNudges.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            zIndex: 9997,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {activeNudges.map((nudge) => (
            <PricingMentorNudge
              key={nudge.id}
              nudge={nudge}
              onDismiss={dismissNudge}
              onAction={() => {
                dismissNudge(nudge.id);
                toggleOpen();
              }}
            />
          ))}
        </div>
      )}

      {/* Chat Panel */}
      <PricingMentorChat />

      {/* FAB */}
      <button
        onClick={toggleOpen}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isOpen ? '#001022' : '#78BE20',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          animation: isOpen ? undefined : 'mentorPulse 2s ease-in-out infinite',
        }}
        aria-label={isOpen ? 'Fechar Pricing Mentor' : 'Abrir Pricing Mentor'}
      >
        {isOpen ? (
          <MessageCircle size={24} style={{ color: '#78BE20' }} />
        ) : (
          <PricingMentorAvatar size={40} />
        )}
      </button>

      {/* Name label on FAB */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            right: 6,
            zIndex: 9999,
            pointerEvents: 'none',
            textAlign: 'center',
            width: '92px',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#78BE20',
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          >
            Pricing Mentor
          </span>
        </div>
      )}
    </>
  );
}
