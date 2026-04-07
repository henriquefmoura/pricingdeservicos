import React from 'react';

interface PricingMentorAvatarProps {
  size?: number;
  isAnimating?: boolean;
  expression?: 'happy' | 'thinking' | 'alert' | 'wink';
}

export function PricingMentorAvatar({
  size = 48,
  isAnimating = false,
  expression = 'happy',
}: PricingMentorAvatarProps) {
  const eyeOpenY = expression === 'wink' ? 0 : 1;
  const mouthCurve = expression === 'alert' ? 'M14,22 Q18,20 22,22' : 'M14,21 Q18,25 22,21';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #78BE20 0%, #5A9A10 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(120, 190, 32, 0.3)',
        animation: isAnimating ? 'mentorBounce 0.6s ease-in-out' : undefined,
        position: 'relative',
        flexShrink: 0,
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

        {/* Eyes */}
        <ellipse cx="13" cy="15" rx="2" ry={2 * eyeOpenY || 0.5} fill="#FFFFFF">
          {isAnimating && (
            <animate
              attributeName="ry"
              values="2;0.5;2"
              dur="0.3s"
              repeatCount="1"
            />
          )}
        </ellipse>
        <ellipse cx="23" cy="15" rx="2" ry="2" fill="#FFFFFF">
          {expression === 'wink' && (
            <animate
              attributeName="ry"
              values="2;0.3;2"
              dur="0.4s"
              repeatCount="indefinite"
            />
          )}
        </ellipse>

        {/* Eye sparkle */}
        <circle cx="14" cy="14" r="0.8" fill="#78BE20" opacity="0.6" />
        <circle cx="24" cy="14" r="0.8" fill="#78BE20" opacity="0.6" />

        {/* Mouth */}
        <path
          d={mouthCurve}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Thinking dots */}
        {expression === 'thinking' && (
          <>
            <circle cx="28" cy="8" r="1.5" fill="#FFFFFF" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="31" cy="5" r="1" fill="#FFFFFF" opacity="0.3">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Light bulb (for alert/tip) */}
        {expression === 'alert' && (
          <g transform="translate(26, 3)">
            <path d="M2,6 L2,0 M0,3 L4,3 M0.5,1 L3.5,5 M3.5,1 L0.5,5" stroke="#FFD700" strokeWidth="0.8" />
          </g>
        )}

        {/* Glasses (subtle mentor look) */}
        <circle cx="13" cy="15" r="4" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.4" />
        <circle cx="23" cy="15" r="4" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.4" />
        <line x1="17" y1="15" x2="19" y2="15" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.4" />
      </svg>

      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: '50%',
          backgroundColor: '#22C55E',
          border: '2px solid white',
        }}
      />
    </div>
  );
}
