// ========================================
// Competitor Search Service
// ========================================
// Orchestrates multi-source search for competitor pricing data.
// Adapter-based architecture allows adding new sources without modifying existing code.

import type { CompetitorSearchInput, SearchResult, SourceType } from '../../types/competitor';
import { simpleHash } from '../../utils/pricingAnalysisMappers';

/**
 * Simulated search results for different source types.
 * In production, each adapter would connect to its respective API/source.
 */

// ----------------------------------------
// Source Adapters (modular, extensible)
// ----------------------------------------

function searchMarketplaces(input: CompetitorSearchInput): SearchResult[] {
  const hash = simpleHash(`${input.city}-${input.service}-marketplace`);
  const count = 2 + (hash % 3);
  const results: SearchResult[] = [];

  const marketplaces = ['GetNinjas', 'Habitissimo', 'ServiceNet'];
  for (let i = 0; i < count; i++) {
    const mp = marketplaces[i % marketplaces.length];
    results.push({
      title: `${input.service} em ${input.city} - ${mp}`,
      url: `https://${mp.toLowerCase()}.com.br/${input.service.replace(/\s+/g, '-').toLowerCase()}/${input.city.replace(/\s+/g, '-').toLowerCase()}`,
      snippet: `Encontre profissionais de ${input.service} em ${input.city}. Preços a partir de R$ ${150 + (hash % 200)}. Orçamentos grátis.`,
      sourceType: 'marketplace' as SourceType,
    });
  }
  return results;
}

function searchInstitutional(input: CompetitorSearchInput): SearchResult[] {
  const hash = simpleHash(`${input.city}-${input.service}-institucional`);
  const results: SearchResult[] = [];

  results.push({
    title: `${input.service} - Porto Seguro Serviços`,
    url: `https://portoseguro.com.br/servicos/${input.service.replace(/\s+/g, '-').toLowerCase()}`,
    snippet: `Serviço de ${input.service} com garantia. Atendimento em ${input.city} e região. Valores a partir de R$ ${200 + (hash % 300)}.`,
    sourceType: 'institucional' as SourceType,
  });

  if (hash % 2 === 0) {
    results.push({
      title: `${input.service} - Prestador Local ${input.city}`,
      url: `https://prestador-local-${input.city.replace(/\s+/g, '-').toLowerCase()}.com.br`,
      snippet: `Realizamos ${input.service} em ${input.city}. Mão de obra qualificada. R$ ${180 + (hash % 250)} por serviço.`,
      sourceType: 'institucional' as SourceType,
    });
  }

  return results;
}

function searchClassifieds(input: CompetitorSearchInput): SearchResult[] {
  const hash = simpleHash(`${input.city}-${input.service}-classificado`);
  const results: SearchResult[] = [];

  results.push({
    title: `${input.service} em ${input.city} - OLX`,
    url: `https://olx.com.br/${input.city.replace(/\s+/g, '-').toLowerCase()}/${input.service.replace(/\s+/g, '-').toLowerCase()}`,
    snippet: `Serviço de ${input.service} disponível. Valor: R$ ${120 + (hash % 180)}. ${input.city}.`,
    sourceType: 'classificado' as SourceType,
  });

  return results;
}

function searchPublicContent(input: CompetitorSearchInput): SearchResult[] {
  const hash = simpleHash(`${input.city}-${input.service}-conteudo`);
  const count = 2 + (hash % 2);
  const results: SearchResult[] = [];

  const sources = ['Blog Construção', 'Portal Reformas', 'Guia de Preços'];
  for (let i = 0; i < count; i++) {
    const src = sources[i % sources.length];
    results.push({
      title: `Quanto custa ${input.service} em ${input.city}? - ${src}`,
      url: `https://${src.replace(/\s+/g, '-').toLowerCase()}.com.br/quanto-custa-${input.service.replace(/\s+/g, '-').toLowerCase()}-${input.city.replace(/\s+/g, '-').toLowerCase()}`,
      snippet: `O preço médio de ${input.service} em ${input.city} varia entre R$ ${100 + (hash % 150)} e R$ ${400 + (hash % 400)}. Confira nossa pesquisa completa.`,
      sourceType: 'conteudo' as SourceType,
    });
  }

  return results;
}

function searchGoogle(input: CompetitorSearchInput): SearchResult[] {
  const hash = simpleHash(`${input.city}-${input.service}-busca`);
  const results: SearchResult[] = [];

  const keywords = input.keywords ?? [];
  const allTerms = [input.service, ...keywords].join(' ');

  results.push({
    title: `${allTerms} preço ${input.city} - Resultado de Busca`,
    url: `https://busca-servicos.com.br/resultado?q=${encodeURIComponent(allTerms)}&city=${encodeURIComponent(input.city)}`,
    snippet: `Resultados para "${allTerms}" em ${input.city}. Preços de R$ ${130 + (hash % 170)} a R$ ${350 + (hash % 350)}.`,
    sourceType: 'busca' as SourceType,
  });

  return results;
}

// ----------------------------------------
// Main Search Orchestrator
// ----------------------------------------

/**
 * Performs a multi-source search for competitor pricing data.
 * Each source adapter operates independently — failure in one source does not affect others.
 */
export async function searchCompetitorPrices(
  input: CompetitorSearchInput
): Promise<SearchResult[]> {
  const adapters = [
    searchMarketplaces,
    searchInstitutional,
    searchClassifieds,
    searchPublicContent,
    searchGoogle,
  ];

  const allResults: SearchResult[] = [];

  for (const adapter of adapters) {
    try {
      const results = adapter(input);
      allResults.push(...results);
    } catch {
      // Source failure is non-blocking — continue with other sources
      console.warn('Adapter failure, continuing with other sources');
    }
  }

  // Simulate async behavior (in production, these would be real API calls)
  await new Promise((resolve) => setTimeout(resolve, 100));

  return allResults;
}
