// ========================================
// Shared Analysis Constants
// ========================================
// Constantes compartilhadas para funcionalidades de análise de mercado
// usadas em AnalysisPage, AdminPricingPage e UserDashboardPage.

export const ANALYSIS_SERVICES: { id: string; name: string }[] = [
  { id: 'srv-001', name: 'Instalação de Piso' },
  { id: 'srv-002', name: 'Pintura Residencial' },
  { id: 'srv-003', name: 'Impermeabilização' },
  { id: 'srv-004', name: 'Instalação Elétrica' },
  { id: 'srv-005', name: 'Instalação Hidráulica' },
];

export const ANALYSIS_PLAZAS: string[] = [
  'Praça São Paulo', 'Praça RJ', 'Praça BH', 'Praça Curitiba',
  'Praça Porto Alegre', 'Praça Salvador', 'Praça Fortaleza', 'Praça Brasília',
  'Praça Goiânia', 'Praça Campinas', 'Praça ABC', 'Praça Santos',
  'Praça Ribeirão Preto', 'Praça São José do Rio Preto', 'Praça São José dos Campos/Taubaté',
  'Praça Sorocaba', 'Praça Jundiaí', 'Praça Joinville', 'Praça Londrina',
  'Praça São José', 'Praça Vitória', 'Praça Campo Grande', 'Praça Uberlândia',
  'Praça São Leopoldo', 'Praça Maceió', 'Praça Natal',
];

/**
 * Finds the best matching plaza from the analysis list for a user's plaza.
 * Uses exact match first, then falls back to the first plaza in the list.
 */
export function getDefaultAnalysisPlaza(userPlaza?: string): string {
  if (!userPlaza) return ANALYSIS_PLAZAS[0];
  const exactMatch = ANALYSIS_PLAZAS.find(
    (p) => p.toLowerCase() === userPlaza.toLowerCase()
  );
  return exactMatch || ANALYSIS_PLAZAS[0];
}
