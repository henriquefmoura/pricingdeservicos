// ========================================
// RAIS / CAGED Service — IBGE SIDRA
// ========================================
// Integra com a API SIDRA do IBGE para dados de emprego formal (RAIS)
// e movimentação de emprego (CAGED) por município.
//
// Fontes:
//   RAIS  — Relação Anual de Informações Sociais (MTE/IBGE SIDRA)
//   CAGED — Cadastro Geral de Empregados e Desempregados (MTE/IBGE SIDRA)
//
// APIs abertas utilizadas:
//   IBGE SIDRA: https://servicodados.ibge.gov.br/api/v3/agregados
//   Tabela 6369 — Empregos formais por seção CNAE 2.0 e município (RAIS)
//   Tabela 6388 — Empregos formais por classe CNAE 2.0 e município (RAIS)
//   MTE CAGED: https://api.inteligencia.mte.gov.br (best-effort, sem autenticação)

import { getTerritorialCache, setTerritorialCache, INDICATORS_TTL_MS } from '../../utils/territorialCache';

const SIDRA = 'https://servicodados.ibge.gov.br/api/v3/agregados';

// RAIS aggregate IDs in IBGE SIDRA
// Tabela 6393: Estabelecimentos e vínculos por seção CNAE (município)
const RAIS_TABLE_SECTION = 6393;
// Variable 2107 = número de estabelecimentos; 218 = vínculos empregatícios
const RAIS_VAR_ESTABLISHMENTS = 2107;
const RAIS_VAR_EMPLOYMENT = 218;

export interface RaisEmploymentData {
  ibgeCode: string;
  totalEstablishments: number | null;
  totalEmployment: number | null;
  constructionEstablishments: number | null;
  constructionEmployment: number | null;
  year: string | null;
}

export interface CagedSaldo {
  ibgeCode: string;
  saldo: number | null;
  admissions: number | null;
  dismissals: number | null;
  period: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// RAIS via IBGE SIDRA
// ─────────────────────────────────────────────────────────────────────

/**
 * Busca dados de empregos formais (RAIS) para um município via IBGE SIDRA.
 * Retorna estabelecimentos e vínculos totais e do setor de construção.
 *
 * Nota: A API SIDRA pode ter latência ou indisponibilidade temporária.
 * Em caso de falha, são retornados valores nulos (o serviço de supply
 * faz fallback para dados de referência RAIS embutidos).
 */
export async function fetchRaisEmploymentData(ibgeCode: string): Promise<RaisEmploymentData> {
  const cacheKey = `rais_employment_${ibgeCode}`;
  const cached = getTerritorialCache<RaisEmploymentData>(cacheKey);
  if (cached) return cached;

  const fallback: RaisEmploymentData = {
    ibgeCode,
    totalEstablishments: null,
    totalEmployment: null,
    constructionEstablishments: null,
    constructionEmployment: null,
    year: null,
  };

  try {
    // Classificação 693 = seção CNAE 2.0; allxt = todas as categorias
    // N6 = nível município
    const url = `${SIDRA}/${RAIS_TABLE_SECTION}/periodos/-1/variaveis/${RAIS_VAR_ESTABLISHMENTS}?localidades=N6[${ibgeCode}]&classificacao=693[allxt]`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallback;
    const data = await res.json();

    const result = parseRaisResponse(ibgeCode, data);
    if (result.totalEstablishments != null) {
      setTerritorialCache(cacheKey, result, INDICATORS_TTL_MS);
    }
    return result;
  } catch {
    return fallback;
  }
}

/**
 * Busca saldo de emprego do CAGED para um município via IBGE SIDRA.
 * O CAGED registra admissões e demissões mensais do emprego formal.
 */
export async function fetchCagedSaldo(ibgeCode: string): Promise<CagedSaldo> {
  const cacheKey = `caged_saldo_${ibgeCode}`;
  const cached = getTerritorialCache<CagedSaldo>(cacheKey);
  if (cached) return cached;

  const fallback: CagedSaldo = {
    ibgeCode,
    saldo: null,
    admissions: null,
    dismissals: null,
    period: null,
  };

  try {
    // Tabela 6382 = CAGED — movimentação de empregos por município
    // Variável 34 = saldo de empregos; variável 35 = admitidos; variável 36 = desligados
    const url = `${SIDRA}/6382/periodos/-6/variaveis/34?localidades=N6[${ibgeCode}]`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallback;
    const data = await res.json();

    const saldo = parseSidraLatestValue(data);
    const result: CagedSaldo = {
      ibgeCode,
      saldo,
      admissions: null,
      dismissals: null,
      period: parseSidraLatestPeriod(data),
    };

    if (result.saldo != null) {
      setTerritorialCache(cacheKey, result, INDICATORS_TTL_MS);
    }
    return result;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

// CNAE section codes in SIDRA for construction (F)
const CONSTRUCTION_SECTION_IDS = new Set(['F', '43', '42', '41']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRaisResponse(ibgeCode: string, data: any): RaisEmploymentData {
  let totalEstablishments: number | null = null;
  let constructionEstablishments: number | null = null;
  let year: string | null = null;

  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { ibgeCode, totalEstablishments: null, totalEmployment: null, constructionEstablishments: null, constructionEmployment: null, year: null };
    }

    const variable = data[0];
    const resultados = variable?.resultados;
    if (!Array.isArray(resultados)) {
      return { ibgeCode, totalEstablishments: null, totalEmployment: null, constructionEstablishments: null, constructionEmployment: null, year: null };
    }

    let total = 0;
    let construction = 0;

    for (const resultado of resultados) {
      const classificacoes = resultado?.classificacoes;
      const serie = resultado?.series?.[0]?.serie;
      if (!serie) continue;

      const keys = Object.keys(serie);
      if (keys.length === 0) continue;
      const lastKey = keys[keys.length - 1];
      year = lastKey;
      const val = parseFloat(serie[lastKey]);
      if (isNaN(val)) continue;

      // Check if this resultado is for construction section
      const isConstruction = Array.isArray(classificacoes) && classificacoes.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c?.categoria && Object.keys(c.categoria).some(k =>
          CONSTRUCTION_SECTION_IDS.has(k) || String(c.categoria[k]).toUpperCase() === 'F'
        )
      );

      total += val;
      if (isConstruction) construction += val;
    }

    totalEstablishments = total > 0 ? total : null;
    constructionEstablishments = construction > 0 ? construction : null;
  } catch {
    // Return fallback on parse error
  }

  return {
    ibgeCode,
    totalEstablishments,
    totalEmployment: null,
    constructionEstablishments,
    constructionEmployment: null,
    year,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSidraLatestValue(data: any): number | null {
  try {
    if (Array.isArray(data) && data.length > 0) {
      const variable = data[0];
      if (variable?.resultados?.[0]?.series?.[0]?.serie) {
        const serie = variable.resultados[0].series[0].serie;
        const keys = Object.keys(serie);
        const lastKey = keys[keys.length - 1];
        const val = parseFloat(serie[lastKey]);
        return isNaN(val) ? null : val;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSidraLatestPeriod(data: any): string | null {
  try {
    if (Array.isArray(data) && data.length > 0) {
      const variable = data[0];
      if (variable?.resultados?.[0]?.series?.[0]?.serie) {
        const serie = variable.resultados[0].series[0].serie;
        const keys = Object.keys(serie);
        return keys[keys.length - 1] ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
