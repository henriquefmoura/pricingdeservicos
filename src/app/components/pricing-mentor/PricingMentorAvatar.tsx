import React from 'react';
import type { MentorExpression } from '../../types/pricingMentor';

interface PricingMentorAvatarProps {
  size?: number;
  isAnimating?: boolean;
  expression?: MentorExpression;
  showLabel?: boolean;
}

export function PricingMentorAvatar({
  size = 48,
  isAnimating = false,
  expression = 'happy',
  showLabel = false,
}: PricingMentorAvatarProps) {
  const getMouthPath = () => {
    switch (expression) {
      case 'alert': return 'M14,22 Q18,20 22,22';
      case 'surprised': return 'M16,21 Q18,24 20,21';
      case 'thinking': return 'M15,22 L21,22';
      default: return 'M14,21 Q18,25 22,21';
    }
  };

  const getLeftEyeRy = () => {
    if (expression === 'wink') return 0.5;
    return 2;
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #78BE20 0%, #5A9A10 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px ${Math.max(8, size / 4)}px rgba(120, 190, 32, 0.35)`,
          animation: isAnimating ? 'mentorBounce 0.6s ease-in-out' : undefined,
          position: 'relative',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
        }}
      >
        <svg
          width={size * 0.7}
          height={size * 0.7}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head circle */}
          <circle cx="18" cy="18" r="16" fill="#FFFFFF" opacity="0.15" />

          {/* Hair/hat accent */}
          <path d="M8,12 Q12,4 18,4 Q24,4 28,12" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.2" />

          {/* Glasses */}
          <circle cx="13" cy="15" r="4.5" stroke="#FFFFFF" strokeWidth="0.9" fill="none" opacity="0.35" />
          <circle cx="23" cy="15" r="4.5" stroke="#FFFFFF" strokeWidth="0.9" fill="none" opacity="0.35" />
          <line x1="17.5" y1="15" x2="18.5" y2="15" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.35" />
          <line x1="8.5" y1="15" x2="6" y2="13.5" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.25" />
          <line x1="27.5" y1="15" x2="30" y2="13.5" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.25" />

          {/* Left eye with blinking animation */}
          <ellipse cx="13" cy="15" rx="2" ry={getLeftEyeRy()} fill="#FFFFFF">
            <animate
              attributeName="ry"
              values="2;0.3;2"
              dur="4s"
              begin="0s"
              repeatCount="indefinite"
              keyTimes="0;0.05;0.1"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
              calcMode="spline"
            />
          </ellipse>

          {/* Right eye */}
          <ellipse cx="23" cy="15" rx="2" ry="2" fill="#FFFFFF">
            {expression === 'wink' ? (
              <animate
                attributeName="ry"
                values="2;0.3;2"
                dur="0.4s"
                repeatCount="indefinite"
              />
            ) : (
              <animate
                attributeName="ry"
                values="2;0.3;2"
                dur="4s"
                begin="0s"
                repeatCount="indefinite"
                keyTimes="0;0.05;0.1"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                calcMode="spline"
              />
            )}
          </ellipse>

          {/* Eye sparkle */}
          <circle cx="14" cy="14" r="0.8" fill="#78BE20" opacity="0.7" />
          <circle cx="24" cy="14" r="0.8" fill="#78BE20" opacity="0.7" />

          {/* Eyebrows */}
          {expression === 'surprised' && (
            <>
              <line x1="10" y1="10" x2="16" y2="10.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              <line x1="20" y1="10.5" x2="26" y2="10" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </>
          )}
          {expression === 'alert' && (
            <>
              <line x1="10" y1="11" x2="16" y2="10" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              <line x1="20" y1="10" x2="26" y2="11" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </>
          )}

          {/* Mouth */}
          <path
            d={getMouthPath()}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill={expression === 'surprised' ? 'rgba(255,255,255,0.2)' : 'none'}
          />

          {/* Thinking dots */}
          {expression === 'thinking' && (
            <>
              <circle cx="29" cy="8" r="1.8" fill="#FFFFFF" opacity="0.5">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="32" cy="4" r="1.2" fill="#FFFFFF" opacity="0.3">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="34" cy="1" r="0.8" fill="#FFFFFF" opacity="0.2">
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* Alert / lightbulb */}
          {expression === 'alert' && (
            <g transform="translate(26, 2)">
              <circle cx="2" cy="2" r="3" fill="#FFD700" opacity="0.9">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
              </circle>
              <text x="2" y="3.5" textAnchor="middle" fontSize="4" fill="#001022" fontWeight="bold">!</text>
            </g>
          )}

          {/* Pointing hand indicator */}
          {expression === 'pointing' && (
            <g transform="translate(28, 18)">
              <path d="M0,0 L4,0 L3,-2 L6,1 L3,4 L4,2 L0,2 Z" fill="#FFFFFF" opacity="0.7">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
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
