import React, { useRef } from 'react';
import type { MentorExpression } from '../../types/pricingMentor';

/** Visual state driving avatar animations */
export type AvatarState = 'idle' | 'hover' | 'speaking' | 'thinking';

/** PedroII jr character avatar image URL */
const LEO_INSTALA_IMAGE_URL =
  'https://github.com/user-attachments/assets/90d11ce9-76b3-4fdb-9b43-da346a800180';

interface PricingMentorAvatarProps {
  size?: number;
  isAnimating?: boolean;
  expression?: MentorExpression;
  showLabel?: boolean;
  /** Controls animation behaviour – syncs with AI state */
  avatarState?: AvatarState;
}

/* Counter so multiple avatar instances don't collide animation ids */
let avatarInstanceCounter = 0;

/**
 * PedroII jr — assistente de precificação Leroy Merlin.
 *
 * Uses a character image with animated container effects that respond
 * to expressions and avatar states (idle, hover, speaking, thinking).
 */
export function PricingMentorAvatar({
  size = 48,
  isAnimating = false,
  expression = 'happy',
  showLabel = false,
  avatarState = 'idle',
}: PricingMentorAvatarProps) {
  const idRef = useRef(`leo-avatar-${++avatarInstanceCounter}`);
  const uid = idRef.current;

  /* ── derived state ── */
  const effectiveState: AvatarState =
    avatarState !== 'idle'
      ? avatarState
      : expression === 'thinking'
        ? 'thinking'
        : 'idle';

  const isThinking = effectiveState === 'thinking' || expression === 'thinking';
  const isSpeaking = effectiveState === 'speaking';
  const isHover = effectiveState === 'hover';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes ${uid}_breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-1px) scale(1.006); }
        }
        @keyframes ${uid}_grow {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes ${uid}_speakGlow {
          0%, 100% { box-shadow: 0 4px 16px rgba(120, 190, 32, 0.30); }
          50%      { box-shadow: 0 4px 24px rgba(120, 190, 32, 0.55); }
        }
        @keyframes ${uid}_thinkPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(251, 191, 36, 0.25); }
          50%      { box-shadow: 0 4px 24px rgba(251, 191, 36, 0.50); }
        }
      `}</style>

      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#F5F0EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHover
            ? `0 6px ${Math.max(12, size / 3)}px rgba(120, 190, 32, 0.50)`
            : `0 4px ${Math.max(8, size / 4)}px rgba(120, 190, 32, 0.35)`,
          animation: isAnimating
            ? `${uid}_grow 0.8s ease-in-out`
            : isSpeaking
              ? `${uid}_breathe 3s ease-in-out infinite, ${uid}_speakGlow 2s ease-in-out infinite`
              : isThinking
                ? `${uid}_breathe 4s ease-in-out infinite, ${uid}_thinkPulse 1.5s ease-in-out infinite`
                : `${uid}_breathe 5s ease-in-out infinite`,
          position: 'relative',
          flexShrink: 0,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isHover ? 'scale(1.03)' : 'scale(1)',
          overflow: 'hidden',
        }}
      >
        <img
          src={LEO_INSTALA_IMAGE_URL}
          alt="PedroII jr — assistente de precificação Leroy Merlin"
          width={size * 0.88}
          height={size * 0.88}
          style={{
            objectFit: 'contain',
            borderRadius: '50%',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Status indicator dot */}
        <div
          style={{
            position: 'absolute',
            bottom: Math.max(1, size * 0.02),
            right: Math.max(1, size * 0.02),
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: '50%',
            backgroundColor: isSpeaking ? '#78BE20' : isThinking ? '#FBBF24' : '#22C55E',
            border: `${Math.max(1.5, size * 0.035)}px solid rgba(255,255,255,0.9)`,
            transition: 'all 0.3s ease',
            boxShadow: isSpeaking ? '0 0 6px rgba(120,190,32,0.6)' : 'none',
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: Math.max(9, size * 0.18),
            fontWeight: 700,
            color: '#78BE20',
            whiteSpace: 'nowrap',
          }}
        >
          PedroII jr
        </span>
      )}
    </div>
  );
}
