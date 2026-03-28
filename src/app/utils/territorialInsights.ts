// ========================================
// Territorial Insights — Rule Engine
// ========================================

import type { TerritorialInsight, TerritorialInsightSummary } from '../types/territorial';

let counter = 0;
function id(): string { return `ti_${++counter}_${Date.now()}`; }

export function generateTerritorialInsights(s: TerritorialInsightSummary): TerritorialInsight[] {
  const insights: TerritorialInsight[] = [];

  // 1. Income above state avg
  if (s.comparisonVsState?.incomeDeltaPercent != null && s.comparisonVsState.incomeDeltaPercent > 10) {
    insights.push({ id: id(), title: 'Renda acima da média', description: 'Praça com renda relativa acima da média estadual. Pode sustentar preço mais alto.', severity: 'info' });
  }

  // 2. Income below state avg
  if (s.comparisonVsState?.incomeDeltaPercent != null && s.comparisonVsState.incomeDeltaPercent < -15) {
    insights.push({ id: id(), title: 'Renda abaixo da média', description: 'Renda abaixo da média estadual. Maior sensibilidade a preço.', severity: 'warning' });
  }

  // 3. High MEI presence
  if (s.relatedMEIs != null && s.relatedMEIs > 200 && s.offerPressure === 'alta') {
    insights.push({ id: id(), title: 'Alta presença de MEIs', description: 'Alta presença de MEIs pode indicar maior sensibilidade competitiva.', severity: 'warning' });
  }

  // 4. Low offer density
  if (s.offerPressure === 'baixa') {
    insights.push({ id: id(), title: 'Baixa oferta local', description: 'Baixa densidade de oferta local pode abrir espaço para maior preço.', severity: 'info' });
  }

  // 5. Large population + medium income
  if ((s.municipalitySize === 'grande' || s.municipalitySize === 'metropole') && s.incomeLevel === 'media') {
    insights.push({ id: id(), title: 'Município populoso', description: 'Município populoso com renda intermediária e estrutura empresarial pulverizada.', severity: 'info' });
  }

  // 6. Premium profile
  if (s.pricingProfile === 'premium') {
    insights.push({ id: id(), title: 'Perfil premium', description: 'Praça com perfil favorável para expansão de serviços e preço sustentado.', severity: 'info' });
  }

  // 7. High competition
  if (s.offerPressure === 'alta' && s.incomeLevel !== 'alta') {
    insights.push({ id: id(), title: 'Competição elevada', description: 'Concentração alta de prestadores pode exigir maior atenção à elasticidade.', severity: 'critical' });
  }

  // 8. Small city + low offer
  if (s.municipalitySize === 'pequeno' && s.offerPressure === 'baixa') {
    insights.push({ id: id(), title: 'Oportunidade de margem', description: 'Município pequeno com baixa oferta local. Espaço para margem melhor.', severity: 'info' });
  }

  // 9. Alto risco profile
  if (s.pricingProfile === 'alto_risco') {
    insights.push({ id: id(), title: 'Alto risco', description: 'Praça sensível a preço: o contexto territorial não sustenta aumento agressivo.', severity: 'critical' });
  }

  // 10. Expansion opportunity
  if (s.pricingProfile === 'expansao') {
    insights.push({ id: id(), title: 'Oportunidade de expansão', description: 'Praça com perfil favorável para expansão de serviços simples.', severity: 'info' });
  }

  // 11. High company density above state avg
  if (s.comparisonVsState?.companiesDeltaPercent != null && s.comparisonVsState.companiesDeltaPercent > 30) {
    insights.push({ id: id(), title: 'Concentração de empresas', description: 'Volume de empresas acima da média estadual. Atenção à concorrência.', severity: 'warning' });
  }

  // 12. Scale opportunity
  if ((s.municipalitySize === 'grande' || s.municipalitySize === 'metropole') && s.offerPressure !== 'alta') {
    insights.push({ id: id(), title: 'Ganho em escala', description: 'Cidade grande com oferta moderada sugere oportunidade de ganho em escala.', severity: 'info' });
  }

  return insights;
}
