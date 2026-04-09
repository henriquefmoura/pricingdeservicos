import { useState } from 'react';
import { Avatar3D } from './Avatar3D';
import type { Avatar3DState } from './Avatar3D';
import { AvatarContextMenu } from './AvatarContextMenu';
import { PricingMentorChat } from './PricingMentorChat';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { useAuthStore } from '../../store/authStore';

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
 * - Fixed bottom-right 3D-like animated avatar (PedroII jr)
 * - Transparent background — avatar looks alive, not like a button
 * - Responsive: adjusts to screen size and zoom level
 * - Context menu for controls (minimize, animations toggle)
 * - Chat panel opens on click
 */
export function PricingMentorWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen,
    isTyping,
    expression,
    toggleOpen,
  } = usePricingMentorStore();

  const [isHovered, setIsHovered] = useState(false);
  const [prefs, setPrefs] = useState<AvatarPrefs>(loadPrefs);

  const avatarSize = prefs.isMinimized ? 40 : 80;

  // Derive avatar 3D animation state from AI / UI state
  const avatar3DState: Avatar3DState = isTyping
    ? (expression === 'thinking' ? 'thinking' : 'speaking')
    : isHovered
      ? 'attention'
      : 'idle';

  // Don't render when not logged in
  if (!isAuthenticated) return null;

  const handleAvatarClick = () => {
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

      {/* Chat Panel — positioned above the avatar at bottom-right */}
      <PricingMentorChat avatarSize={avatarSize} />

      {/* ── Fixed Bottom-Right Avatar Container ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          right: 'clamp(8px, 2vw, 24px)',
          bottom: 'clamp(8px, 2vh, 24px)',
          zIndex: 9999,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          animation: 'mentorWalkIn 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Avatar click area */}
        <div
          onClick={handleAvatarClick}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Avatar3D
            size={avatarSize}
            state={avatar3DState}
            expression={expression}
            disableAnimations={!prefs.animationsEnabled}
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
                fontSize: '10px',
                fontWeight: 700,
                color: '#78BE20',
                backgroundColor: 'rgba(0, 16, 34, 0.85)',
                padding: '2px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
            onToggleMinimize={handleToggleMinimize}
            isMinimized={prefs.isMinimized}
            onToggleAnimations={handleToggleAnimations}
            animationsEnabled={prefs.animationsEnabled}
          />
        </div>
      </div>

      {/* CTA — "Pedir ajuda para o Pedro do Instala" — positioned to the left of the avatar */}
      {!isOpen && !prefs.isMinimized && (
        <a
          href="https://wa.me/5511976019360?text=Ol%C3%A1%20Pedro%20II%2C%20preciso%20de%20ajuda%20no%20Instala."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir ajuda para o Pedro do Instala via WhatsApp"
          title="Fale diretamente com o especialista Pedro II"
          style={{
            position: 'fixed',
            right: `calc(clamp(8px, 2vw, 24px) + ${avatarSize + 16}px)`,
            bottom: `calc(clamp(8px, 2vh, 24px) + ${(avatarSize - 36) / 2}px)`,
            zIndex: 9998,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '24px',
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.3s',
            animation: 'mentorSlideIn 0.3s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          💬 Pedir ajuda para o Pedro do Instala
        </a>
      )}
    </>
  );
}
