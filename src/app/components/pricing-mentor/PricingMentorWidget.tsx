import { useEffect, useRef, useCallback, useState } from 'react';
import { Avatar3D } from './Avatar3D';
import type { Avatar3DState } from './Avatar3D';
import { AvatarContextMenu } from './AvatarContextMenu';
import { PricingMentorChat } from './PricingMentorChat';
import { PricingMentorNudge } from './PricingMentorNudge';
import { useDraggableAvatar } from '../../hooks/useDraggableAvatar';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { useAuthStore } from '../../store/authStore';

const NUDGE_INTERVAL_MS = 120_000;
const INITIAL_NUDGE_DELAY_MS = 30_000;

/** Key for persisting minimized + animations preferences */
const AVATAR_PREFS_KEY = 'pedroii-avatar-prefs';

interface AvatarPrefs {
  isMinimized: boolean;
  animationsEnabled: boolean;
}

function loadPrefs(): AvatarPrefs {
  try {
    const stored = localStorage.getItem(AVATAR_PREFS_KEY);
    if (stored) return JSON.parse(stored) as AvatarPrefs;
  } catch { /* ignore */ }
  return { isMinimized: false, animationsEnabled: true };
}

function savePrefs(prefs: AvatarPrefs): void {
  try {
    localStorage.setItem(AVATAR_PREFS_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

/**
 * PricingMentorWidget — the global floating widget rendered in App.tsx.
 *
 * Features:
 * - Draggable 3D-like animated avatar (PedroII jr)
 * - Transparent background — avatar looks alive, not like a button
 * - Drag & drop with mouse (desktop) and touch (mobile)
 * - Position persistence in localStorage
 * - Context menu for controls (minimize, reset, animations toggle)
 * - Chat panel opens on click, independently positioned
 * - Smart nudge toasts
 */
export function PricingMentorWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen,
    isTyping,
    expression,
    toggleOpen,
    nudges,
    dismissNudge,
    triggerRandomNudge,
  } = usePricingMentorStore();

  const [isHovered, setIsHovered] = useState(false);
  const [prefs, setPrefs] = useState<AvatarPrefs>(loadPrefs);

  const avatarSize = prefs.isMinimized ? 48 : 120;

  const {
    containerRef,
    position,
    isDragging,
    resetPosition,
    wasDragged,
  } = useDraggableAvatar({
    elementWidth: avatarSize,
    elementHeight: avatarSize,
  });

  // Derive avatar 3D animation state from AI / UI state
  const avatar3DState: Avatar3DState = isDragging
    ? 'dragging'
    : isTyping
      ? (expression === 'thinking' ? 'thinking' : 'speaking')
      : isHovered
        ? 'attention'
        : 'idle';

  // Nudge timer
  const nudgeTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

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

  const handleAvatarClick = () => {
    // Don't open chat if we just finished dragging
    if (wasDragged) return;
    toggleOpen();
  };

  const handleToggleMinimize = () => {
    const updated = { ...prefs, isMinimized: !prefs.isMinimized };
    setPrefs(updated);
    savePrefs(updated);
  };

  const handleToggleAnimations = () => {
    const updated = { ...prefs, animationsEnabled: !prefs.animationsEnabled };
    setPrefs(updated);
    savePrefs(updated);
  };

  return (
    <>
      {/* Global CSS animations */}
      <style>{`
        @keyframes mentorSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mentorPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(120, 190, 32, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(120, 190, 32, 0); }
        }
        @keyframes mentorWalkIn {
          0%   { transform: translateX(80px) translateY(0); opacity: 0; }
          60%  { transform: translateX(-4px) translateY(-3px); opacity: 1; }
          80%  { transform: translateX(2px) translateY(0); opacity: 1; }
          100% { transform: translateX(0) translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Nudge toasts — positioned relative to avatar */}
      {!isOpen && activeNudges.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: position.y + avatarSize + 12,
            left: position.x,
            zIndex: 9997,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'auto',
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

      {/* Chat Panel — positioned based on avatar location */}
      <PricingMentorChat avatarPosition={position} avatarSize={avatarSize} />

      {/* ── Draggable Avatar Container ── */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          left: position.x,
          bottom: position.y,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          animation: 'mentorWalkIn 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Avatar click area */}
        <div
          onClick={handleAvatarClick}
          style={{
            cursor: isDragging ? 'grabbing' : 'pointer',
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            transform: isDragging ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Avatar3D
            size={avatarSize}
            state={avatar3DState}
            expression={expression}
            disableAnimations={!prefs.animationsEnabled}
            isDragging={isDragging}
            isMinimized={prefs.isMinimized}
          />
        </div>

        {/* Name label */}
        {!prefs.isMinimized && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 2,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#78BE20',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 10px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                letterSpacing: '0.3px',
              }}
            >
              PedroII jr
            </span>
          </div>
        )}

        {/* Context menu trigger (visible on hover or when minimized) */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            opacity: isHovered || prefs.isMinimized ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: isHovered || prefs.isMinimized ? 'auto' : 'none',
          }}
        >
          <AvatarContextMenu
            onResetPosition={resetPosition}
            onToggleMinimize={handleToggleMinimize}
            isMinimized={prefs.isMinimized}
            onToggleAnimations={handleToggleAnimations}
            animationsEnabled={prefs.animationsEnabled}
          />
        </div>
      </div>

      {/* CTA — "Pedir ajuda para o Pedro do Instala" — positioned relative to avatar */}
      {!isOpen && !prefs.isMinimized && (
        <a
          href="https://wa.me/5511976019360?text=Ol%C3%A1%20Pedro%20II%2C%20preciso%20de%20ajuda%20no%20Instala."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir ajuda para o Pedro do Instala via WhatsApp"
          title="Fale diretamente com o especialista Pedro II"
          style={{
            position: 'fixed',
            bottom: position.y + (avatarSize - 48) / 2 + 4,
            left: position.x + avatarSize + 16,
            zIndex: 9998,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '24px',
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.3s',
            animation: 'mentorSlideIn 0.3s ease-out',
            whiteSpace: 'nowrap',
            pointerEvents: isDragging ? 'none' : 'auto',
            opacity: isDragging ? 0 : 1,
          }}
        >
          💬 Pedir ajuda para o Pedro do Instala
        </a>
      )}
    </>
  );
}
