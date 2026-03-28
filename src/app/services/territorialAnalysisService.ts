// ========================================
// Territorial Analysis Service
// ========================================
// Adapter para dados territoriais no contexto de pricing analysis.

import type { TerritorialInsightSummary } from '../types/territorial';
import { runTerritorialAnalysis } from './territorialPricingEngine';
import { simpleHash } from '../utils/pricingAnalysisMappers';

// Mock IBGE codes for common plazas
const PLAZA_IBGE_MAP: Record<string, string> = {
  SP: '3550308',
  'São Paulo': '3550308',
  RJ: '3304557',
  'Rio de Janeiro': '3304557',
  BH: '3106200',
  'Belo Horizonte': '3106200',
  Curitiba: '4106902',
  'Porto Alegre': '4314902',
  Salvador: '2927408',
  Recife: '2611606',
  Fortaleza: '2304400',
  Manaus: '1302603',
  Belém: '1501402',
  Goiânia: '5208707',
  Brasília: '5300108',
  DF: '5300108',
  Campinas: '3509502',
  Santos: '3548500',
  'Ribeirão Preto': '3543402',
  Sorocaba: '3552205',
  'São José dos Campos': '3549904',
  Florianópolis: '4205407',
  Niterói: '3303302',
  Contagem: '3118601',
  Uberlândia: '3170206',
  'Juiz de Fora': '3136702',
  Natal: '2408102',
  'Campo Grande': '5002704',
  Vitória: '3205309',
  'São Luís': '2111300',
};

/**
 * Resolve IBGE code a partir do nome/id da praça.
 */
export function resolveIbgeCode(pracaIdOrName: string): string | null {
  // Direct match
  if (PLAZA_IBGE_MAP[pracaIdOrName]) {
    return PLAZA_IBGE_MAP[pracaIdOrName];
  }

  // Partial match
  const normalized = pracaIdOrName.toLowerCase().trim();
  for (const [key, code] of Object.entries(PLAZA_IBGE_MAP)) {
    if (key.toLowerCase() === normalized) return code;
  }

  return null;
}

/**
 * Busca dados territoriais para uma praça.
 * Retorna null em caso de erro (fallback gracioso).
 */
export async function fetchTerritorialForPraca(
  pracaIdOrName: string,
  serviceId?: string
): Promise<TerritorialInsightSummary | null> {
  const ibgeCode = resolveIbgeCode(pracaIdOrName);
  if (!ibgeCode) return null;

  try {
    return await runTerritorialAnalysis(ibgeCode, serviceId);
  } catch {
    return null;
  }
}

/**
 * Gera mock de dados territoriais para uso quando API não está disponível.
 */
export function getMockTerritorialData(pracaName: string): TerritorialInsightSummary {
  // Use deterministic mock based on plaza name hash
  const hash = simpleHash(pracaName);
  const populations = [85000, 250000, 650000, 1200000, 2500000];
  const incomes = [750, 1100, 1400, 1800, 2200];
  const companies = [120, 450, 1200, 3500, 8000];
  const meis = [50, 180, 500, 1500, 3000];

  const idx = hash % populations.length;

  const population = populations[idx];
  const income = incomes[idx];
  const totalCompanies = companies[idx];
  const totalMEIs = meis[idx];

  const incomeLevel = income < 900 ? 'baixa' as const : income > 1500 ? 'alta' as const : 'media' as const;
  const size = population < 50000 ? 'pequeno' as const :
    population < 200000 ? 'medio' as const :
    population < 1000000 ? 'grande' as const : 'metropole' as const;
  const pressure = totalCompanies / population * 1000 > 6 ? 'alta' as const :
    totalCompanies / population * 1000 < 2 ? 'baixa' as const : 'media' as const;

  let profile: TerritorialInsightSummary['pricingProfile'] = 'equilibrado';
  if (incomeLevel === 'alta' && pressure === 'baixa') profile = 'premium';
  else if (incomeLevel === 'alta' && pressure === 'alta') profile = 'competitivo';
  else if (incomeLevel === 'baixa' && pressure === 'alta') profile = 'sensivel_preco';

  return {
    city: pracaName,
    ibgeCode: resolveIbgeCode(pracaName) ?? '0000000',
    uf: pracaName.length > 2 ? 'SP' : pracaName,
    region: 'Sudeste',
    population,
    income,
    incomeLevel,
    municipalitySize: size,
    relatedCompanies: totalCompanies,
    relatedMEIs: totalMEIs,
    offerPressure: pressure,
    pricingProfile: profile,
    insights: [],
  };
}
