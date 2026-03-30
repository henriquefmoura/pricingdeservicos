// ========================================
// Competitor Confidence Badge
// ========================================

import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ConfidenceLevel } from '../../types/competitor';

interface Props {
  score: number;
  level: ConfidenceLevel;
}

const CONFIG: Record<ConfidenceLevel, { icon: typeof Shield; color: string; bg: string; label: string }> = {
  baixa: { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', label: 'Baixa confiança' },
  media: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Média confiança' },
  alta: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', label: 'Alta confiança' },
};

export function CompetitorConfidenceBadge({ score, level }: Props) {
  const cfg = CONFIG[level];
  const Icon = cfg.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      <span className={`text-xs font-medium ${cfg.color}`}>
        {cfg.label} ({score}%)
      </span>
    </div>
  );
}
