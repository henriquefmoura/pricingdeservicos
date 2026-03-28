// ========================================
// Offer Pressure Service
// ========================================
// Analisa pressão de oferta local para apoio à decisão de preço.

import type { TerritorialInsightSummary } from '../types/territorial';
import type { AnalysisAlert } from '../types/pricingAnalysis';

export interface OfferPressureAnalysis {
  level: 'baixa' | 'media' | 'alta';
  relatedCompanies: number | null;
  relatedMEIs: number | null;
  companyDensity: number | null;
  signals: string[];
  alerts: AnalysisAlert[];
}

/**
 * Analisa a pressão de oferta local com base em dados territoriais.
 */
export function analyzeOfferPressure(
  territorial: TerritorialInsightSummary | null
): OfferPressureAnalysis {
  if (!territorial) {
    return {
      level: 'media',
      relatedCompanies: null,
      relatedMEIs: null,
      companyDensity: null,
      signals: [],
      alerts: [],
    };
  }

  const population = territorial.population ?? 0;
  const companies = territorial.relatedCompanies ?? 0;
  const meis = territorial.relatedMEIs ?? 0;
  const total = companies + meis;
  const density = population > 0 ? (total / population) * 1000 : null;

  const level = territorial.offerPressure ?? 'media';
  const signals: string[] = [];
  const alerts: AnalysisAlert[] = [];

  // Generate signals based on analysis
  if (level === 'alta') {
    signals.push(`Volume estimado de ${companies.toLocaleString('pt-BR')} empresas e ${meis.toLocaleString('pt-BR')} MEIs na região.`);
    signals.push('A pressão de oferta local parece elevada para este serviço.');

    alerts.push({
      id: 'offer-pressure-high',
      title: 'Pressão competitiva elevada',
      description: 'O volume de prestadores na região sugere competição acima da média. Considere o impacto na elasticidade de preço.',
      severity: 'warning',
    });
  } else if (level === 'baixa') {
    signals.push('Baixa concentração de prestadores na região.');
    signals.push('Possível espaço para posicionamento de preço mais firme.');

    alerts.push({
      id: 'offer-pressure-low',
      title: 'Baixa concorrência local',
      description: 'A baixa oferta local pode sustentar preços mais elevados nesta praça.',
      severity: 'info',
    });
  } else {
    signals.push('Concentração de oferta moderada na região.');
  }

  if (meis > 200 && level === 'alta') {
    alerts.push({
      id: 'mei-pressure',
      title: 'Alta presença de MEIs',
      description: 'Volume significativo de microempreendedores pode pressionar preços para baixo.',
      severity: 'warning',
    });
  }

  return {
    level,
    relatedCompanies: companies,
    relatedMEIs: meis,
    companyDensity: density,
    signals,
    alerts,
  };
}
