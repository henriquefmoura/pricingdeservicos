import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { MentorExpression } from '../../types/pricingMentor';

/** Visual state driving avatar animations */
export type AvatarState = 'idle' | 'hover' | 'speaking' | 'thinking';

interface PricingMentorAvatarProps {
  size?: number;
  isAnimating?: boolean;
  expression?: MentorExpression;
  showLabel?: boolean;
  /** Controls animation behaviour – syncs with AI state */
  avatarState?: AvatarState;
}

/* Unique-id counter so multiple avatar instances don't collide gradient ids */
let _idCounter = 0;

/**
 * Semi-realistic human digital avatar (bust style).
 * Professional consultant/professor appearance with soft skin,
 * natural lighting and subtle lifelike animations.
 *
 * Supports expressions: happy, thinking, alert, wink, surprised, pointing.
 * Supports avatar states: idle, hover, speaking, thinking.
 */
export function PricingMentorAvatar({
  size = 48,
  isAnimating = false,
  expression = 'happy',
  showLabel = false,
  avatarState = 'idle',
}: PricingMentorAvatarProps) {
  /* ── unique SVG gradient ids ── */
  const idRef = useRef(`ma${++_idCounter}`);
  const uid = idRef.current;

  /* ── natural blink with variable intervals ── */
  const [blinkPhase, setBlinkPhase] = useState(false);

  const scheduleBlink = useCallback(() => {
    const delay = 2500 + Math.random() * 3500; // 2.5-6s
    const timer = setTimeout(() => {
      setBlinkPhase(true);
      setTimeout(() => setBlinkPhase(false), 150);
    }, delay);
    return timer;
  }, []);

  useEffect(() => {
    let timer = scheduleBlink();
    const interval = setInterval(() => {
      clearTimeout(timer);
      timer = scheduleBlink();
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [scheduleBlink]);

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

  /* ── eye position shifts by state ── */
  const eyeOffsetX = isThinking ? -1.5 : isSpeaking ? 0 : 0;
  const eyeOffsetY = isThinking ? -0.8 : 0;

  /* ── mouth by expression/state ── */
  const getMouthPath = (): string => {
    if (isSpeaking) return 'M40,73 Q50,80 60,73 Q50,76 40,73'; // open
    switch (expression) {
      case 'happy':
      case 'wink':
      case 'pointing':
        return 'M40,73 Q50,79 60,73';
      case 'thinking':
        return 'M43,74 Q50,73 57,74';
      case 'alert':
        return 'M42,74 Q50,72 58,74';
      case 'surprised':
        return 'M45,73 Q50,78 55,73';
      default:
        return 'M40,73 Q50,79 60,73';
    }
  };

  /* ── eyebrow shapes ── */
  const getLeftBrow = (): string => {
    if (isThinking) return 'M35,44 Q40,41 45,44';
    switch (expression) {
      case 'alert':
        return 'M35,43 Q40,39 45,42';
      case 'surprised':
        return 'M35,41 Q40,37 45,41';
      default:
        return 'M35,44 Q40,41 45,44';
    }
  };
  const getRightBrow = (): string => {
    if (isThinking) return 'M55,45 Q60,43 65,44';
    switch (expression) {
      case 'alert':
        return 'M55,42 Q60,39 65,43';
      case 'surprised':
        return 'M55,41 Q60,37 65,41';
      default:
        return 'M55,44 Q60,41 65,44';
    }
  };

  /* ── blink height ── */
  const eyeRY = blinkPhase ? 0.5 : (expression === 'wink' ? 0.5 : 5);
  const rightEyeRY = blinkPhase ? 0.5 : (expression === 'wink' ? 0.5 : 5);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes ${uid}_breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-1px) scale(1.006); }
        }
        @keyframes ${uid}_headSway {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          30%      { transform: rotate(0.5deg) translateX(0.3px); }
          70%      { transform: rotate(-0.5deg) translateX(-0.3px); }
        }
        @keyframes ${uid}_speakJaw {
          0%, 100% { transform: translateY(0); }
          25%      { transform: translateY(1.2px); }
          50%      { transform: translateY(0.4px); }
          75%      { transform: translateY(1px); }
        }
        @keyframes ${uid}_grow {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes ${uid}_thinkDots {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.9; }
        }
        @keyframes ${uid}_speakGlow {
          0%, 100% { box-shadow: 0 4px 16px rgba(120, 190, 32, 0.30); }
          50%      { box-shadow: 0 4px 24px rgba(120, 190, 32, 0.55); }
        }
      `}</style>

      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #0F1B2D 0%, #1A2B45 50%, #0D1520 100%)',
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
              : `${uid}_breathe 5s ease-in-out infinite`,
          position: 'relative',
          flexShrink: 0,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isHover ? 'scale(1.03)' : 'scale(1)',
          overflow: 'hidden',
        }}
      >
        <svg
          width={size * 0.92}
          height={size * 0.92}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Pricing Mentor - consultor digital"
          style={{
            animation: isSpeaking
              ? `${uid}_headSway 1.5s ease-in-out infinite`
              : `${uid}_headSway 6s ease-in-out infinite`,
          }}
        >
          <defs>
            {/* Realistic skin gradients */}
            <radialGradient id={`${uid}_skin`} cx="50%" cy="38%" r="52%">
              <stop offset="0%" stopColor="#F5D6B8" />
              <stop offset="60%" stopColor="#E8C4A0" />
              <stop offset="100%" stopColor="#D4A882" />
            </radialGradient>
            <radialGradient id={`${uid}_skinShadow`} cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor="rgba(180,130,100,0.15)" />
              <stop offset="100%" stopColor="rgba(180,130,100,0)" />
            </radialGradient>
            {/* Hair gradient */}
            <linearGradient id={`${uid}_hair`} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#3D2B1F" />
              <stop offset="50%" stopColor="#2C1E14" />
              <stop offset="100%" stopColor="#1A110A" />
            </linearGradient>
            {/* Shirt / blazer */}
            <linearGradient id={`${uid}_blazer`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="100%" stopColor="#152C4A" />
            </linearGradient>
            {/* Shirt inner */}
            <linearGradient id={`${uid}_shirt`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E8ECF0" />
            </linearGradient>
            {/* Ambient light */}
            <radialGradient id={`${uid}_ambient`} cx="40%" cy="25%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Eye white gradient */}
            <radialGradient id={`${uid}_eyeWhite`} cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F0EDE8" />
            </radialGradient>
            {/* Iris gradient */}
            <radialGradient id={`${uid}_iris`} cx="45%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#5B7B3A" />
              <stop offset="70%" stopColor="#3D5A22" />
              <stop offset="100%" stopColor="#2A3F18" />
            </radialGradient>
          </defs>

          {/* ═══════ SHOULDERS / BLAZER ═══════ */}
          <path
            d="M10,98 Q10,78 25,75 L38,72 Q50,70 62,72 L75,75 Q90,78 90,98 L10,98 Z"
            fill={`url(#${uid}_blazer)`}
          />
          {/* Blazer lapel highlights */}
          <path
            d="M38,72 L44,82 L50,72"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M62,72 L56,82 L50,72"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* Blazer 3D highlight */}
          <path
            d="M10,98 Q10,78 25,75 L38,72 L38,98 Z"
            fill="rgba(255,255,255,0.04)"
          />

          {/* ═══════ SHIRT / COLLAR ═══════ */}
          <path
            d="M40,72 L50,82 L60,72 L56,70 Q50,68 44,70 Z"
            fill={`url(#${uid}_shirt)`}
          />
          {/* Tie */}
          <path
            d="M49,78 L50,98 L51,78 L52,74 L50,76 L48,74 Z"
            fill="#78BE20"
            opacity="0.85"
          />
          <path
            d="M49.2,78 L50,98 L50,78 L50,76 L48.5,74 Z"
            fill="rgba(255,255,255,0.12)"
          />

          {/* ═══════ NECK ═══════ */}
          <rect x="44" y="66" width="12" height="8" rx="4" fill={`url(#${uid}_skin)`} />
          {/* Neck shadow */}
          <ellipse cx="50" cy="72" rx="7" ry="2" fill="rgba(180,130,100,0.12)" />

          {/* ═══════ HEAD ═══════ */}
          <ellipse cx="50" cy="42" rx="22" ry="27" fill={`url(#${uid}_skin)`} />
          {/* Subtle jaw definition */}
          <path
            d="M30,50 Q35,68 50,70 Q65,68 70,50"
            fill={`url(#${uid}_skinShadow)`}
          />
          {/* Natural ambient highlight */}
          <ellipse cx="44" cy="34" rx="14" ry="16" fill={`url(#${uid}_ambient)`} />
          {/* Cheek subtle contour */}
          <ellipse cx="34" cy="55" rx="5" ry="4" fill="rgba(210,160,130,0.12)" />
          <ellipse cx="66" cy="55" rx="5" ry="4" fill="rgba(210,160,130,0.12)" />

          {/* ═══════ EARS ═══════ */}
          <ellipse cx="28" cy="46" rx="3.5" ry="5.5" fill="#E2BA96" />
          <ellipse cx="28" cy="46" rx="2" ry="3.5" fill="#D4A882" />
          <ellipse cx="72" cy="46" rx="3.5" ry="5.5" fill="#E2BA96" />
          <ellipse cx="72" cy="46" rx="2" ry="3.5" fill="#D4A882" />

          {/* ═══════ HAIR ═══════ */}
          <path
            d="M28,38 Q28,14 50,12 Q72,14 72,38 L72,30 Q72,16 50,14 Q28,16 28,30 Z"
            fill={`url(#${uid}_hair)`}
          />
          {/* Side hair */}
          <path d="M28,38 Q28,28 33,24 L33,36 Q30,38 28,38 Z" fill={`url(#${uid}_hair)`} />
          <path d="M72,38 Q72,28 67,24 L67,36 Q70,38 72,38 Z" fill={`url(#${uid}_hair)`} />
          {/* Hair highlight for volume */}
          <path
            d="M36,18 Q44,13 54,14 Q58,15 62,18"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Subtle side part */}
          <path
            d="M38,16 Q38,20 36,24"
            stroke="rgba(100,70,40,0.3)"
            strokeWidth="0.6"
            fill="none"
          />

          {/* ═══════ EYEBROWS ═══════ */}
          <path d={getLeftBrow()} stroke="#3D2B1F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d={getRightBrow()} stroke="#3D2B1F" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* ═══════ EYES ═══════ */}
          <g style={{ transition: 'transform 0.4s ease' }} transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`}>
            {/* Eye whites with natural shading */}
            <ellipse cx="40" cy="49" rx="6" ry="5" fill={`url(#${uid}_eyeWhite)`} />
            <ellipse cx="60" cy="49" rx="6" ry="5" fill={`url(#${uid}_eyeWhite)`} />
            {/* Upper eyelid shadow */}
            <path d="M34,47 Q40,44 46,47" fill="rgba(120,85,60,0.08)" />
            <path d="M54,47 Q60,44 66,47" fill="rgba(120,85,60,0.08)" />

            {/* Iris */}
            <ellipse cx="40" cy="49" rx="3.5" ry={eyeRY} fill={`url(#${uid}_iris)`}
              style={{ transition: 'ry 0.12s ease' }} />
            <ellipse cx="60" cy="49" rx="3.5" ry={rightEyeRY} fill={`url(#${uid}_iris)`}
              style={{ transition: 'ry 0.12s ease' }} />

            {/* Pupil */}
            <circle cx="40" cy="49" r="1.8" fill="#0F0F0F" opacity={blinkPhase ? 0 : 1}
              style={{ transition: 'opacity 0.1s' }} />
            <circle cx="60" cy="49" r="1.8" fill="#0F0F0F" opacity={blinkPhase ? 0 : 1}
              style={{ transition: 'opacity 0.1s' }} />

            {/* Eye sparkle / catchlight */}
            <circle cx="41.8" cy="47.5" r="1.1" fill="#FFFFFF" opacity={blinkPhase ? 0 : 0.9} />
            <circle cx="61.8" cy="47.5" r="1.1" fill="#FFFFFF" opacity={blinkPhase ? 0 : 0.9} />
            <circle cx="38.5" cy="50.5" r="0.5" fill="#FFFFFF" opacity={blinkPhase ? 0 : 0.5} />
            <circle cx="58.5" cy="50.5" r="0.5" fill="#FFFFFF" opacity={blinkPhase ? 0 : 0.5} />

            {/* Lower eyelid line */}
            <path d="M34.5,52 Q40,54.5 45.5,52" stroke="rgba(150,110,80,0.15)" strokeWidth="0.5" fill="none" />
            <path d="M54.5,52 Q60,54.5 65.5,52" stroke="rgba(150,110,80,0.15)" strokeWidth="0.5" fill="none" />
          </g>

          {/* ═══════ NOSE ═══════ */}
          <path d="M48,54 Q50,61 52,54" stroke="#CDA07A" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M47,60 Q50,62 53,60" stroke="rgba(180,130,100,0.2)" strokeWidth="0.6" fill="none" />
          {/* Nose highlight */}
          <ellipse cx="50" cy="57" rx="1.5" ry="2" fill="rgba(255,255,255,0.08)" />

          {/* ═══════ MOUTH ═══════ */}
          <g style={{
            animation: isSpeaking ? `${uid}_speakJaw 0.4s ease-in-out infinite` : undefined,
          }}>
            <path
              d={getMouthPath()}
              stroke="#B8706A"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill={
                isSpeaking
                  ? 'rgba(60,20,20,0.35)'
                  : expression === 'surprised'
                    ? 'rgba(180,100,90,0.25)'
                    : expression === 'happy' || expression === 'wink' || expression === 'pointing'
                      ? 'rgba(200,120,110,0.08)'
                      : 'none'
              }
              style={{ transition: 'd 0.3s ease' }}
            />
            {/* Upper lip definition */}
            <path d="M43,73 Q50,71 57,73" stroke="rgba(180,100,90,0.25)" strokeWidth="0.5" fill="none" />
          </g>

          {/* ═══════ NATURAL BLUSH ═══════ */}
          {(expression === 'happy' || expression === 'wink') && (
            <>
              <ellipse cx="34" cy="58" rx="4" ry="2.2" fill="#ECADA5" opacity="0.18" />
              <ellipse cx="66" cy="58" rx="4" ry="2.2" fill="#ECADA5" opacity="0.18" />
            </>
          )}

          {/* ═══════ THINKING INDICATOR ═══════ */}
          {isThinking && (
            <g>
              <circle cx="80" cy="22" r="3" fill="rgba(120,190,32,0.7)">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="86" cy="14" r="2.2" fill="rgba(120,190,32,0.5)">
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="90" cy="7" r="1.5" fill="rgba(120,190,32,0.3)">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* ═══════ ALERT INDICATOR ═══════ */}
          {expression === 'alert' && (
            <g transform="translate(78, 10)">
              <circle cx="0" cy="0" r="5" fill="#78BE20" opacity="0.9">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />
              </circle>
              <text x="0" y="2" textAnchor="middle" fontSize="7" fill="#FFFFFF" fontWeight="bold" aria-hidden="true">!</text>
            </g>
          )}
        </svg>

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
          Pricing Mentor
        </span>
      )}
    </div>
  );
}
