// Badges
import type { OfferPressureLevel, TerritorialPricingProfile } from '../../types/territorial';

const PRESSURE_CFG: Record<OfferPressureLevel, { label: string; cls: string }> = {
  baixa: { label: 'Pressão Baixa', cls: 'bg-green-100 text-green-700' },
  media: { label: 'Pressão Média', cls: 'bg-yellow-100 text-yellow-700' },
  alta: { label: 'Pressão Alta', cls: 'bg-red-100 text-red-700' },
};

export function OfferPressureBadge({ level }: { level?: OfferPressureLevel }) {
  if (!level) return null;
  const c = PRESSURE_CFG[level];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

const PROFILE_CFG: Record<TerritorialPricingProfile, { label: string; cls: string }> = {
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-700' },
  equilibrado: { label: 'Equilibrado', cls: 'bg-blue-100 text-blue-700' },
  sensivel_preco: { label: 'Sensível a Preço', cls: 'bg-orange-100 text-orange-700' },
  competitivo: { label: 'Competitivo', cls: 'bg-yellow-100 text-yellow-700' },
  expansao: { label: 'Expansão', cls: 'bg-green-100 text-green-700' },
  alto_risco: { label: 'Alto Risco', cls: 'bg-red-100 text-red-700' },
};

export function PricingProfileBadge({ profile }: { profile?: TerritorialPricingProfile }) {
  if (!profile) return null;
  const c = PROFILE_CFG[profile];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
}
