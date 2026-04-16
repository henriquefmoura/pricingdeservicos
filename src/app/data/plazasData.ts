// ========================================
// Dados das Praças — Tabela de ISS por Praça
// ========================================
// 26 praças com seus nomes exatos, siglas e taxas de ISS.
// Além do ISS variável por praça, há um imposto fixo de 9,25% (PIS/COFINS + outros).

export const FIXED_TAX = 0.0925; // 9,25% — imposto fixo (PIS/COFINS)

export interface PlazaData {
  nome: string;   // Nome exato da praça (coluna B da tabela)
  sigla: string;  // Sigla da praça (coluna C)
  loja: number;   // Número da loja (coluna A)
  iss: number;    // Taxa de ISS (coluna D), ex: 0.03 = 3%
}

export const PLAZAS_DATA: PlazaData[] = [
  { loja: 20, nome: 'Praça BH',                          sigla: 'BH',      iss: 0.03 },
  { loja: 29, nome: 'Praça Uberlândia',                  sigla: 'UBER',    iss: 0.03 },
  { loja: 38, nome: 'Praça Fortaleza',                   sigla: 'FOR',     iss: 0.05 },
  { loja: 50, nome: 'Praça Maceió',                      sigla: 'MAC',     iss: 0.05 },
  { loja: 49, nome: 'Praça Natal',                       sigla: 'NAT',     iss: 0.05 },
  { loja: 19, nome: 'Praça Porto Alegre',                sigla: 'RGS',     iss: 0.05 },
  { loja: 32, nome: 'Praça São Leopoldo',                sigla: 'SãoLeo',  iss: 0.05 },
  { loja: 11, nome: 'Praça RJ',                          sigla: 'RJ',      iss: 0.05 },
  { loja: 57, nome: 'Praça Vitória',                     sigla: 'VIT',     iss: 0.05 },
  { loja: 62, nome: 'Praça Santos',                      sigla: 'Santos',  iss: 0.03 },
  { loja: 10, nome: 'Praça ABC',                         sigla: 'ABC',     iss: 0.05 },
  { loja: 58, nome: 'Praça São Paulo',                   sigla: 'SP',      iss: 0.05 },
  { loja: 13, nome: 'Praça Brasília',                    sigla: 'DF',      iss: 0.05 },
  { loja: 18, nome: 'Praça Goiânia',                     sigla: 'GYN',     iss: 0.05 },
  { loja:  2, nome: 'Praça Ribeirão Preto',              sigla: 'RIB',     iss: 0.02 },
  { loja: 34, nome: 'Praça São José do Rio Preto',       sigla: 'SJP',     iss: 0.05 },
  { loja: 15, nome: 'Praça São José dos Campos/Taubaté', sigla: 'SJC/TAU', iss: 0.05 },
  { loja:  3, nome: 'Praça Campinas',                    sigla: 'CAMP',    iss: 0.05 },
  { loja: 27, nome: 'Praça Sorocaba',                    sigla: 'SOR',     iss: 0.03 },
  { loja: 44, nome: 'Praça Campo Grande',                sigla: 'CGD',     iss: 0.05 },
  { loja:  9, nome: 'Praça Curitiba',                    sigla: 'CUR',     iss: 0.05 },
  { loja: 33, nome: 'Praça Londrina',                    sigla: 'LON',     iss: 0.03 },
  { loja: 39, nome: 'Praça São José',                    sigla: 'SC',      iss: 0.03 },
  { loja: 59, nome: 'Praça Salvador',                    sigla: 'SSA',     iss: 0.05 },
  { loja: 56, nome: 'Praça Jundiaí',                     sigla: 'JD',      iss: 0.05 },
  { loja: 76, nome: 'Praça Joinville',                   sigla: 'JV',      iss: 0.03 },
];

/** Lista com os nomes de todas as praças */
export const ALL_PLAZAS: string[] = PLAZAS_DATA.map((p) => p.nome);

/** Retorna a taxa de ISS de uma praça (0 se não encontrada) */
export function getPlazaIss(plaza: string): number {
  const found = PLAZAS_DATA.find(
    (p) => p.nome === plaza || p.sigla === plaza
  );
  if (!found) {
    if (plaza) {
      console.warn(`[plazasData] Praça não encontrada: "${plaza}". Usando fallback ISS de 5%.`);
    }
    return 0.05; // fallback para 5% se praça desconhecida
  }
  return found.iss;
}

/**
 * Calcula a margem real de um serviço, descontando ISS (variável por praça) e
 * o imposto fixo de 9,25% (FIXED_TAX) sobre o preço de venda.
 *
 * Fórmula: Margem = (Venda × (1 - ISS - FIXED_TAX) - Repasse) / Venda × 100
 */
export function calculateMargemComImpostos(
  venda: number,
  repasse: number,
  plaza: string
): number {
  if (venda === 0) return 0;
  const iss = getPlazaIss(plaza);
  const totalTax = iss + FIXED_TAX;
  return ((venda * (1 - totalTax) - repasse) / venda) * 100;
}

/** Retorna o total de impostos (ISS + fixo) para uma praça, em % */
export function getTotalTaxPercent(plaza: string): number {
  return (getPlazaIss(plaza) + FIXED_TAX) * 100;
}
