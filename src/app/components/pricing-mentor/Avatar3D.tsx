import { useRef, useEffect, useState, useCallback } from 'react';
import type { MentorExpression } from '../../types/pricingMentor';

// ─── Avatar Animation State Types ────────────────────────────────────────────

export type Avatar3DState =
  | 'idle'        // breathing, blinking, micro head movement
  | 'attention'   // eyes track cursor, slight tilt
  | 'thinking'    // looking sideways, pensive
  | 'success'     // gentle smile, slight nod
  | 'alert'       // serious look, brow raised
  | 'speaking'    // mouth animation, active glow
  | 'dragging';   // being moved by user

/**
 * PedroII jr character avatar image URL.
 * Can be overridden via VITE_AVATAR_IMAGE_URL env var.
 */
const AVATAR_IMAGE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AVATAR_IMAGE_URL) ||
  'https://github.com/user-attachments/assets/90d11ce9-76b3-4fdb-9b43-da346a800180';

interface Avatar3DProps {
  /** Avatar display size in px */
  size?: number;
  /** Current animation state */
  state?: Avatar3DState;
  /** Expression from mentor AI (mapped to animation state) */
  expression?: MentorExpression;
  /** Whether animations are disabled (low-motion mode) */
  disableAnimations?: boolean;
  /** Whether the avatar is currently being dragged */
  isDragging?: boolean;
  /** Whether the avatar is minimized (compact mode) */
  isMinimized?: boolean;
}

/* Instance counter to avoid CSS animation ID collisions */
let instanceCounter = 0;

/**
 * Avatar3D — Semi-realistic PedroII jr avatar with transparent background
 * and natural CSS animations (breathing, blinking, head movement, glow).
 *
 * Uses layered CSS transforms + box-shadow for a lively, non-button appearance.
 * No container/background visible — only the character.
 */
export function Avatar3D({
  size = 120,
  state = 'idle',
  expression = 'happy',
  disableAnimations = false,
  isDragging = false,
  isMinimized = false,
}: Avatar3DProps) {
  const idRef = useRef(`avatar3d-${++instanceCounter}`);
  const uid = idRef.current;
  const [blinking, setBlinking] = useState(false);
  const [mouseAngle, setMouseAngle] = useState({ x: 0, y: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);

  // Derive effective state
  const effectiveState: Avatar3DState = isDragging
    ? 'dragging'
    : state !== 'idle'
      ? state
      : expression === 'thinking'
        ? 'thinking'
        : expression === 'alert'
          ? 'alert'
          : expression === 'wink' || expression === 'happy'
            ? 'idle'
            : 'idle';

  const displaySize = isMinimized ? 48 : size;

  // ── Blinking ──
  /** Minimum interval between blinks (ms) */
  const BLINK_MIN_INTERVAL_MS = 3000;
  /** Random additional range for blink interval (ms) */
  const BLINK_RANDOM_RANGE_MS = 2000;
  /** Duration of a single blink (ms) */
  const BLINK_DURATION_MS = 150;

  useEffect(() => {
    if (disableAnimations) return;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), BLINK_DURATION_MS);
    };
    const scheduleNext = () => {
      const delay = BLINK_MIN_INTERVAL_MS + Math.random() * BLINK_RANDOM_RANGE_MS;
      return setTimeout(() => {
        blink();
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [disableAnimations]);

  // ── Eye tracking (attention state) ──
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (effectiveState !== 'attention' || !avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      setMouseAngle({
        x: Math.max(-1, Math.min(1, dx)) * 8,
        y: Math.max(-1, Math.min(1, dy)) * 5,
      });
    },
    [effectiveState],
  );

  useEffect(() => {
    if (effectiveState === 'attention') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      setMouseAngle({ x: 0, y: 0 });
    }
  }, [effectiveState, handleMouseMove]);

  // ── Animation styles per state ──
  const getStateTransform = (): string => {
    if (disableAnimations) return 'none';
    switch (effectiveState) {
      case 'attention':
        return `rotateY(${mouseAngle.x}deg) rotateX(${-mouseAngle.y}deg)`;
      case 'thinking':
        return `rotateY(-6deg) rotateZ(-2deg)`;
      case 'success':
        return `scale(1.04) translateY(-2px)`;
      case 'alert':
        return `scale(1.02)`;
      case 'dragging':
        return `scale(0.95)`;
      default:
        return 'none';
    }
  };

  const getGlowColor = (): string => {
    switch (effectiveState) {
      case 'speaking':
        return 'rgba(120, 190, 32, 0.5)';
      case 'thinking':
        return 'rgba(251, 191, 36, 0.4)';
      case 'alert':
        return 'rgba(239, 68, 68, 0.35)';
      case 'success':
        return 'rgba(34, 197, 94, 0.45)';
      case 'attention':
        return 'rgba(120, 190, 32, 0.35)';
      case 'dragging':
        return 'rgba(120, 190, 32, 0.6)';
      default:
        return 'rgba(120, 190, 32, 0.25)';
    }
  };

  const getStatusColor = (): string => {
    switch (effectiveState) {
      case 'speaking':
        return '#78BE20';
      case 'thinking':
        return '#FBBF24';
      case 'alert':
        return '#EF4444';
      case 'success':
        return '#22C55E';
      default:
        return '#22C55E';
    }
  };

  const breatheAnimation = disableAnimations
    ? 'none'
    : effectiveState === 'speaking'
      ? `${uid}_breathe 2.5s ease-in-out infinite`
      : effectiveState === 'thinking'
        ? `${uid}_breathe 4s ease-in-out infinite`
        : `${uid}_breathe 4.5s ease-in-out infinite`;

  const glowAnimation = disableAnimations
    ? 'none'
    : effectiveState === 'speaking'
      ? `${uid}_glow 1.5s ease-in-out infinite`
      : effectiveState === 'thinking'
        ? `${uid}_glowThink 2s ease-in-out infinite`
        : effectiveState === 'alert'
          ? `${uid}_glowAlert 1.8s ease-in-out infinite`
          : 'none';

  return (
    <div
      ref={avatarRef}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        perspective: '600px',
      }}
    >
      {/* Keyframe animations */}
      <style>{`
        @keyframes ${uid}_breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-2px) scale(1.008); }
        }
        @keyframes ${uid}_glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(120, 190, 32, 0.25), 0 0 0 0 rgba(120, 190, 32, 0.15); }
          50%      { box-shadow: 0 4px 30px rgba(120, 190, 32, 0.50), 0 0 20px 4px rgba(120, 190, 32, 0.15); }
        }
        @keyframes ${uid}_glowThink {
          0%, 100% { box-shadow: 0 4px 20px rgba(251, 191, 36, 0.20), 0 0 0 0 rgba(251, 191, 36, 0.1); }
          50%      { box-shadow: 0 4px 28px rgba(251, 191, 36, 0.45), 0 0 16px 3px rgba(251, 191, 36, 0.1); }
        }
        @keyframes ${uid}_glowAlert {
          0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.20); }
          50%      { box-shadow: 0 4px 28px rgba(239, 68, 68, 0.40); }
        }
        @keyframes ${uid}_headTilt {
          0%, 100% { transform: rotateZ(0deg) rotateY(0deg); }
          30%      { transform: rotateZ(-1deg) rotateY(-2deg); }
          70%      { transform: rotateZ(0.5deg) rotateY(1deg); }
        }
        @keyframes ${uid}_nod {
          0%, 100% { transform: rotateX(0deg); }
          25%      { transform: rotateX(4deg); }
          50%      { transform: rotateX(0deg); }
          75%      { transform: rotateX(3deg); }
        }
      `}</style>

      {/* Avatar container — dark background, no white visible */}
      <div
        style={{
          width: displaySize,
          height: displaySize,
          borderRadius: '50%',
          background: '#001022',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          animation: breatheAnimation,
          transform: getStateTransform(),
          transition: isDragging
            ? 'none'
            : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
          border: `2px solid rgba(120, 190, 32, 0.35)`,
          boxShadow: `0 4px 16px ${getGlowColor()}`,
        }}
      >
        {/* Soft outer glow ring — gives depth without a visible container */}
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
            animation: glowAnimation,
            transition: 'all 0.4s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Character image — circular crop, no background */}
        <div
          style={{
            width: displaySize * 0.92,
            height: displaySize * 0.92,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            animation: !disableAnimations && effectiveState === 'idle'
              ? `${uid}_headTilt 8s ease-in-out infinite`
              : !disableAnimations && effectiveState === 'success'
                ? `${uid}_nod 1.5s ease-in-out`
                : undefined,
            // Blink effect via scaleY
            transform: blinking ? 'scaleY(0.97)' : 'scaleY(1)',
            transition: 'transform 0.08s ease',
          }}
        >
          <img
            src={AVATAR_IMAGE_URL}
            alt="PedroII jr — assistente de precificação de serviços e reformas"
            width={displaySize * 0.92}
            height={displaySize * 0.92}
            style={{
              objectFit: 'cover',
              borderRadius: '50%',
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'block',
              // Subtle filter changes per state
              filter: effectiveState === 'thinking'
                ? 'brightness(0.95) saturate(0.9)'
                : effectiveState === 'alert'
                  ? 'brightness(0.92) contrast(1.05)'
                  : effectiveState === 'success'
                    ? 'brightness(1.05) saturate(1.1)'
                    : 'brightness(1) saturate(1)',
              transition: 'filter 0.4s ease',
            }}
            loading="lazy"
          />
        </div>

        {/* Status indicator dot */}
        <div
          style={{
            position: 'absolute',
            bottom: Math.max(2, displaySize * 0.04),
            right: Math.max(2, displaySize * 0.04),
            width: displaySize * 0.18,
            height: displaySize * 0.18,
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            border: `${Math.max(1.5, displaySize * 0.03)}px solid rgba(255,255,255,0.95)`,
            transition: 'all 0.3s ease',
            boxShadow: effectiveState === 'speaking'
              ? '0 0 8px rgba(120,190,32,0.6)'
              : effectiveState === 'alert'
                ? '0 0 8px rgba(239,68,68,0.5)'
                : 'none',
          }}
        />

        {/* Thinking indicator dots (only in thinking state) */}
        {effectiveState === 'thinking' && !disableAnimations && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -4,
              display: 'flex',
              gap: '3px',
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 5 + i,
                  height: 5 + i,
                  borderRadius: '50%',
                  backgroundColor: '#FBBF24',
                  opacity: 0.7,
                  animation: `${uid}_breathe ${1.5 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
