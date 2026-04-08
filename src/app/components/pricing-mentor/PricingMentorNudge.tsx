import React from 'react';
import { X, AlertTriangle, Lightbulb, HelpCircle, AlertCircle, Zap } from 'lucide-react';
import type { MentorNudge } from '../../types/pricingMentor';

interface PricingMentorNudgeProps {
  nudge: MentorNudge;
  onDismiss: (id: string) => void;
  onAction?: (nudge: MentorNudge) => void;
}

const nudgeStyles: Record<MentorNudge['type'], { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  warning: { bg: '#FFF7ED', border: '#FB923C', icon: AlertTriangle, iconColor: '#F97316' },
  tip: { bg: '#F0FDF4', border: '#4ADE80', icon: Lightbulb, iconColor: '#22C55E' },
  question: { bg: '#EFF6FF', border: '#60A5FA', icon: HelpCircle, iconColor: '#3B82F6' },
  alert: { bg: '#FEF2F2', border: '#F87171', icon: AlertCircle, iconColor: '#EF4444' },
  provocation: { bg: '#FDF4FF', border: '#C084FC', icon: Zap, iconColor: '#A855F7' },
};

export function PricingMentorNudge({ nudge, onDismiss, onAction }: PricingMentorNudgeProps) {
  const style = nudgeStyles[nudge.type];
  const Icon = style.icon;

  return (
    <div
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        maxWidth: 'min(340px, calc(100vw - 80px))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        animation: 'mentorSlideIn 0.3s ease-out',
      }}
    >
      <Icon size={20} style={{ color: style.iconColor, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#1F2937' }}>
          {nudge.message}
        </p>
        {nudge.actionLabel && onAction && (
          <button
            onClick={() => onAction(nudge)}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: `1px solid ${style.border}`,
              backgroundColor: 'white',
              color: style.iconColor,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {nudge.actionLabel}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(nudge.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: '#9CA3AF',
          flexShrink: 0,
        }}
        aria-label="Fechar"
      >
        <X size={14} />
      </button>
    </div>
  );
}
