// ========================================
// Territorial Comparators
// ========================================

import type { TerritorialInsight, TerritorialInsightSummary, TerritorialComparisonResult } from '../types/territorial';

function ratio(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

let cid = 0;
function id(): string { return `tc_${++cid}_${Date.now()}`; }

export function compareMunicipalities(
  cityA: TerritorialInsightSummary,
  cityB: TerritorialInsightSummary
): TerritorialComparisonResult {
  const result: TerritorialComparisonResult = {
    cityA,
    cityB,
    populationRatio: ratio(cityA.population, cityB.population),
    incomeRatio: ratio(cityA.income, cityB.income),
    companyRatio: ratio(cityA.relatedCompanies, cityB.relatedCompanies),
    meiRatio: ratio(cityA.relatedMEIs, cityB.relatedMEIs),
    insights: [],
  };
  result.insights = generateComparisonInsights(result);
  return result;
}

export function generateComparisonInsights(c: TerritorialComparisonResult): TerritorialInsight[] {
  const insights: TerritorialInsight[] = [];

  if (c.incomeRatio != null && c.incomeRatio > 1.2) {
    insights.push({ id: id(), title: 'Renda superior', description: `${c.cityA.city} tem renda ${((c.incomeRatio - 1) * 100).toFixed(0)}% maior que ${c.cityB.city}.`, severity: 'info' });
  } else if (c.incomeRatio != null && c.incomeRatio < 0.8) {
    insights.push({ id: id(), title: 'Renda inferior', description: `${c.cityA.city} tem renda ${((1 - c.incomeRatio) * 100).toFixed(0)}% menor que ${c.cityB.city}.`, severity: 'warning' });
  }

  if (c.companyRatio != null && c.companyRatio > 1.5) {
    insights.push({ id: id(), title: 'Mais empresas', description: `${c.cityA.city} possui mais prestadores que ${c.cityB.city}. Maior competição.`, severity: 'warning' });
  }

  if (c.cityA.pricingProfile !== c.cityB.pricingProfile) {
    insights.push({ id: id(), title: 'Perfis diferentes', description: `Perfis de pricing distintos: ${c.cityA.city} (${c.cityA.pricingProfile}) vs ${c.cityB.city} (${c.cityB.pricingProfile}).`, severity: 'info' });
  }

  return insights;
}

export function rankByPricingAttractiveness(cities: TerritorialInsightSummary[]): TerritorialInsightSummary[] {
  const score = (c: TerritorialInsightSummary): number => {
    let s = 50;
    if (c.incomeLevel === 'alta') s += 20;
    else if (c.incomeLevel === 'baixa') s -= 15;
    if (c.offerPressure === 'baixa') s += 15;
    else if (c.offerPressure === 'alta') s -= 10;
    if (c.pricingProfile === 'premium') s += 10;
    if (c.pricingProfile === 'alto_risco') s -= 20;
    return s;
  };
  return [...cities].sort((a, b) => score(b) - score(a));
}
