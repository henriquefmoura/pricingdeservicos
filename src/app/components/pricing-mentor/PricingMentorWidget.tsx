import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { PricingMentorAvatar } from './PricingMentorAvatar';
import { PricingMentorChat } from './PricingMentorChat';
import { PricingMentorNudge } from './PricingMentorNudge';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { useAuthStore } from '../../store/authStore';

const NUDGE_INTERVAL_MS = 120_000;
const INITIAL_NUDGE_DELAY_MS = 30_000;

/**
 * PricingMentorWidget — the global floating widget rendered in App.tsx.
 * Features a large animated avatar, chat panel, and smart nudge toasts.
 */
export function PricingMentorWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen,
    expression,
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
          50% { box-shadow: 0 0 0 12px rgba(120, 190, 32, 0); }
        }
        @keyframes mentorFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes mentorGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(120, 190, 32, 0.3); }
          50% { box-shadow: 0 4px 30px rgba(120, 190, 32, 0.5); }
        }
      `}</style>

      {/* Nudge toasts — top of FAB */}
      {!isOpen && activeNudges.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 110,
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

      {/* Floating Action Button (FAB) with large avatar */}
      <button
        onClick={toggleOpen}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: isOpen ? '56px' : '68px',
          height: isOpen ? '56px' : '68px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isOpen ? '#001022' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
          transition: 'all 0.3s ease',
          animation: isOpen ? undefined : 'mentorFloat 3s ease-in-out infinite',
          padding: 0,
        }}
        aria-label={isOpen ? 'Fechar Pricing Mentor' : 'Abrir Pricing Mentor'}
      >
        {isOpen ? (
          <X size={24} style={{ color: '#78BE20' }} />
        ) : (
          <PricingMentorAvatar size={68} expression={expression} />
        )}
      </button>

      {/* Name label on FAB */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            right: 10,
            zIndex: 9999,
            pointerEvents: 'none',
            textAlign: 'center',
            width: '96px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#78BE20',
              backgroundColor: 'white',
              padding: '3px 8px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              letterSpacing: '0.3px',
            }}
          >
            Pricing Mentor
          </span>
        </div>
      )}
    </>
  );
}
