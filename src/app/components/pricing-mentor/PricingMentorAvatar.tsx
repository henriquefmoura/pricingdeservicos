import React from 'react';
import type { MentorExpression } from '../../types/pricingMentor';

interface PricingMentorAvatarProps {
  size?: number;
  isAnimating?: boolean;
  expression?: MentorExpression;
  showLabel?: boolean;
}

/**
 * 3D-style full-body installer/handyman character avatar.
 * Supports expressions: happy, thinking, alert, wink, surprised, pointing.
 * Includes idle breathing, grow-pulse, walk sway, and pointing animations.
 */
export function PricingMentorAvatar({
  size = 48,
  isAnimating = false,
  expression = 'happy',
  showLabel = false,
}: PricingMentorAvatarProps) {

  /* ── mouth shape by expression ── */
  const getMouthPath = (): string => {
    switch (expression) {
      case 'happy': return 'M42,56 Q50,64 58,56';
      case 'thinking': return 'M44,58 L56,58';
      case 'alert': return 'M42,58 Q50,55 58,58';
      case 'surprised': return 'M46,56 Q50,62 54,56';
      case 'wink': return 'M42,56 Q50,63 58,56';
      case 'pointing': return 'M42,56 Q50,64 58,56';
      default: return 'M42,56 Q50,64 58,56';
    }
  };

  /* ── eyebrow shape by expression ── */
  const getLeftBrow = (): string => {
    switch (expression) {
      case 'alert': return 'M38,38 Q42,34 46,37';
      case 'surprised': return 'M38,35 Q42,31 46,35';
      case 'thinking': return 'M38,38 Q42,36 46,39';
      default: return 'M38,38 Q42,35 46,38';
    }
  };
  const getRightBrow = (): string => {
    switch (expression) {
      case 'alert': return 'M54,37 Q58,34 62,38';
      case 'surprised': return 'M54,35 Q58,31 62,35';
      case 'thinking': return 'M54,39 Q58,37 62,38';
      default: return 'M54,38 Q58,35 62,38';
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>

      {/* Avatar keyframe animations */}
      <style>{`
        @keyframes installerBreath {
          0%, 100% { transform: scaleY(1); }
          50%      { transform: scaleY(1.012); }
        }
        @keyframes installerGrow {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes installerWalk {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%      { transform: translateX(-2px) rotate(-2deg); }
          75%      { transform: translateX(2px) rotate(2deg); }
        }
        @keyframes installerPointArm {
          0%, 100% { transform: rotate(0deg); }
          30%      { transform: rotate(-35deg); }
          60%      { transform: rotate(-35deg); }
        }
        @keyframes installerAlertPulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #78BE20 0%, #4E8A0F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px ${Math.max(8, size / 4)}px rgba(120, 190, 32, 0.40),
                      inset 0 2px 6px rgba(255,255,255,0.25)`,
          animation: isAnimating
            ? 'installerGrow 0.8s ease-in-out'
            : 'installerBreath 4s ease-in-out infinite',
          position: 'relative',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <svg
          width={size * 0.88}
          height={size * 0.88}
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            animation: expression === 'pointing'
              ? 'installerWalk 1.2s ease-in-out infinite'
              : undefined,
          }}
        >
          <defs>
            {/* 3D skin gradient */}
            <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#FDDCB5" />
              <stop offset="100%" stopColor="#E8B88A" />
            </radialGradient>
            {/* Hard-hat gradient for 3D look */}
            <linearGradient id="hatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE033" />
              <stop offset="50%" stopColor="#FFD000" />
              <stop offset="100%" stopColor="#E6B800" />
            </linearGradient>
            {/* Shirt / uniform gradient */}
            <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            {/* Pants gradient */}
            <linearGradient id="pantsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            {/* Boots gradient */}
            <linearGradient id="bootGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            {/* Belt gradient */}
            <linearGradient id="beltGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>

          {/* ═══════ BOOTS ═══════ */}
          <ellipse cx="39" cy="116" rx="8" ry="4" fill="url(#bootGrad)" />
          <ellipse cx="61" cy="116" rx="8" ry="4" fill="url(#bootGrad)" />

          {/* ═══════ LEGS / PANTS ═══════ */}
          <rect x="35" y="95" width="10" height="22" rx="4" fill="url(#pantsGrad)" />
          <rect x="55" y="95" width="10" height="22" rx="4" fill="url(#pantsGrad)" />

          {/* ═══════ BODY / SHIRT ═══════ */}
          <path
            d="M34,68 Q34,62 40,62 L60,62 Q66,62 66,68 L66,96 Q66,100 60,100 L40,100 Q34,100 34,96 Z"
            fill="url(#shirtGrad)"
          />
          {/* Shirt 3D highlight */}
          <path
            d="M40,62 L50,62 L50,100 L40,100 Q34,100 34,96 L34,68 Q34,62 40,62 Z"
            fill="rgba(255,255,255,0.08)"
          />
          {/* Collar */}
          <path d="M44,62 L50,67 L56,62" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.5" />
          {/* Pocket */}
          <rect x="54" y="72" width="8" height="7" rx="1.5" stroke="#FFFFFF" strokeWidth="0.7" fill="none" opacity="0.35" />
          {/* Pocket flap */}
          <line x1="54" y1="72" x2="62" y2="72" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.4" />

          {/* ═══════ TOOL BELT ═══════ */}
          <rect x="33" y="93" width="34" height="5" rx="2" fill="url(#beltGrad)" />
          {/* Belt buckle */}
          <rect x="46" y="93.5" width="8" height="4" rx="1" fill="#D4A017" />
          <rect x="48" y="94.2" width="4" height="2.6" rx="0.5" fill="#B8860B" />
          {/* Tools hanging from belt */}
          <rect x="36" y="97" width="3" height="6" rx="1" fill="#94A3B8" opacity="0.8" />
          <rect x="61" y="97" width="3" height="6" rx="1" fill="#94A3B8" opacity="0.8" />
          <circle cx="63.5" cy="97.5" r="1.5" fill="#FFD700" opacity="0.7" />

          {/* ═══════ LEFT ARM (static or waving) ═══════ */}
          <g
            style={{
              transformOrigin: '34px 68px',
              animation: expression === 'pointing' || expression === 'alert'
                ? 'installerPointArm 1.5s ease-in-out infinite'
                : undefined,
            }}
          >
            <path
              d="M34,68 Q28,68 26,74 L22,86 Q20,90 24,90 L28,90 Q30,90 30,86 L34,76"
              fill="url(#shirtGrad)"
              stroke="url(#shirtGrad)"
              strokeWidth="0.5"
            />
            {/* Hand */}
            <ellipse cx="23" cy="89" rx="4.5" ry="3.5" fill="url(#skinGrad)" />
            {/* Pointing finger (visible when pointing) */}
            {(expression === 'pointing' || expression === 'alert') && (
              <g>
                <line x1="19" y1="88" x2="12" y2="84" stroke="url(#skinGrad)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="11" cy="83" r="1.5" fill="url(#skinGrad)" />
              </g>
            )}
          </g>

          {/* ═══════ RIGHT ARM ═══════ */}
          <path
            d="M66,68 Q72,68 74,74 L78,86 Q80,90 76,90 L72,90 Q70,90 70,86 L66,76"
            fill="url(#shirtGrad)"
            stroke="url(#shirtGrad)"
            strokeWidth="0.5"
          />
          {/* Hand */}
          <ellipse cx="77" cy="89" rx="4.5" ry="3.5" fill="url(#skinGrad)" />

          {/* ═══════ NECK ═══════ */}
          <rect x="45" y="57" width="10" height="7" rx="3" fill="url(#skinGrad)" />

          {/* ═══════ HEAD ═══════ */}
          <ellipse cx="50" cy="40" rx="18" ry="20" fill="url(#skinGrad)" />
          {/* 3D head highlight */}
          <ellipse cx="46" cy="34" rx="10" ry="12" fill="rgba(255,255,255,0.12)" />

          {/* ═══════ EARS ═══════ */}
          <ellipse cx="32" cy="42" rx="3" ry="4.5" fill="#E8B88A" />
          <ellipse cx="32" cy="42" rx="1.5" ry="2.5" fill="#D4A07A" />
          <ellipse cx="68" cy="42" rx="3" ry="4.5" fill="#E8B88A" />
          <ellipse cx="68" cy="42" rx="1.5" ry="2.5" fill="#D4A07A" />

          {/* ═══════ HAIR (short brown, sides) ═══════ */}
          <path d="M33,34 Q33,22 50,20 Q67,22 67,34" fill="#5B3A1A" />
          <path d="M35,36 Q35,24 50,22 Q65,24 65,36" fill="#6B4423" />

          {/* ═══════ HARD HAT (safety helmet) ═══════ */}
          <path
            d="M28,30 Q28,16 50,14 Q72,16 72,30 L28,30 Z"
            fill="url(#hatGrad)"
          />
          {/* Hat brim */}
          <ellipse cx="50" cy="30" rx="26" ry="4" fill="#E6B800" />
          <ellipse cx="50" cy="30" rx="26" ry="4" fill="rgba(255,255,255,0.15)" />
          {/* Hat 3D highlight */}
          <path
            d="M34,24 Q40,16 50,15 Q55,15 58,17"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Hat front emblem */}
          <circle cx="50" cy="23" r="3.5" fill="#E6B800" stroke="#D4A017" strokeWidth="0.5" />
          <text x="50" y="25" textAnchor="middle" fontSize="4.5" fill="#78350F" fontWeight="bold">⚡</text>

          {/* ═══════ EYEBROWS ═══════ */}
          <path d={getLeftBrow()} stroke="#5B3A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d={getRightBrow()} stroke="#5B3A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />

          {/* ═══════ EYES ═══════ */}
          {/* Eye whites */}
          <ellipse cx="43" cy="43" rx="5" ry="4.5" fill="#FFFFFF" />
          <ellipse cx="57" cy="43" rx="5" ry="4.5" fill="#FFFFFF" />

          {/* Iris */}
          <ellipse cx="43" cy="43" rx="2.8" ry="3" fill="#4A3728">
            {/* Blink */}
            <animate
              attributeName="ry"
              values="3;0.3;3"
              dur="4s"
              repeatCount="indefinite"
              keyTimes="0;0.04;0.08"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
              calcMode="spline"
            />
          </ellipse>
          <ellipse cx="57" cy="43" rx="2.8" ry={expression === 'wink' ? 0.4 : 3} fill="#4A3728">
            {expression === 'wink' ? (
              <animate attributeName="ry" values="3;0.3;3" dur="0.4s" repeatCount="indefinite" />
            ) : (
              <animate
                attributeName="ry"
                values="3;0.3;3"
                dur="4s"
                repeatCount="indefinite"
                keyTimes="0;0.04;0.08"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                calcMode="spline"
              />
            )}
          </ellipse>

          {/* Pupil */}
          <circle cx="43" cy="42.5" r="1.3" fill="#1A1207" />
          <circle cx="57" cy="42.5" r="1.3" fill="#1A1207" />
          {/* Eye sparkle */}
          <circle cx="44.5" cy="41.5" r="0.9" fill="#FFFFFF" opacity="0.9" />
          <circle cx="58.5" cy="41.5" r="0.9" fill="#FFFFFF" opacity="0.9" />

          {/* ═══════ NOSE ═══════ */}
          <path d="M48,48 Q50,52 52,48" stroke="#D4A07A" strokeWidth="1" fill="none" strokeLinecap="round" />

          {/* ═══════ MOUTH ═══════ */}
          <path
            d={getMouthPath()}
            stroke="#C0705A"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill={expression === 'surprised' ? 'rgba(192,112,90,0.3)' : expression === 'happy' || expression === 'wink' || expression === 'pointing' ? 'rgba(255,255,255,0.2)' : 'none'}
          />

          {/* ═══════ THINKING DOTS ═══════ */}
          {expression === 'thinking' && (
            <g>
              <circle cx="78" cy="28" r="3" fill="#FFFFFF" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="84" cy="20" r="2.2" fill="#FFFFFF" opacity="0.4">
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="88" cy="13" r="1.5" fill="#FFFFFF" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* ═══════ ALERT LIGHTBULB ═══════ */}
          {expression === 'alert' && (
            <g transform="translate(72, 8)" style={{ animation: 'installerAlertPulse 1s ease-in-out infinite' }}>
              <circle cx="0" cy="0" r="6" fill="#FFD700" opacity="0.9" />
              <text x="0" y="2.5" textAnchor="middle" fontSize="8" fill="#78350F" fontWeight="bold">!</text>
            </g>
          )}

          {/* ═══════ CHEEKS (blush) ═══════ */}
          {(expression === 'happy' || expression === 'wink') && (
            <>
              <ellipse cx="36" cy="50" rx="3.5" ry="2" fill="#F4A8A0" opacity="0.35" />
              <ellipse cx="64" cy="50" rx="3.5" ry="2" fill="#F4A8A0" opacity="0.35" />
            </>
          )}
        </svg>

        {/* Status indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: Math.max(1, size * 0.02),
            right: Math.max(1, size * 0.02),
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            border: `${Math.max(1.5, size * 0.04)}px solid white`,
            transition: 'all 0.3s ease',
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
