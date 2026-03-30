// ========================================
// Competitor Scraper Service
// ========================================
// Extracts text content from search results for price parsing.
// In production, this would use ethical scraping with rate limiting and robots.txt compliance.

import type { SearchResult, ScrapedContent } from '../../types/competitor';
import { simpleHash } from '../../utils/pricingAnalysisMappers';

/**
 * Known service price ranges used for deterministic mock content generation.
 */
const SERVICE_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  'instalação de ar-condicionado': { min: 250, max: 800 },
  'limpeza residencial': { min: 80, max: 300 },
  'pintura de parede': { min: 15, max: 45 },
  'instalação elétrica': { min: 150, max: 600 },
  'desentupimento': { min: 100, max: 400 },
  'jardinagem': { min: 80, max: 250 },
  'montagem de móveis': { min: 100, max: 350 },
  'impermeabilização': { min: 20, max: 80 },
  'instalação de piso': { min: 30, max: 90 },
  'reparos hidráulicos': { min: 120, max: 500 },
};

/**
 * Gets a plausible price range for a service.
 */
function getServiceRange(service: string): { min: number; max: number } {
  const normalized = service.toLowerCase().trim();
  for (const [key, range] of Object.entries(SERVICE_PRICE_RANGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return range;
    }
  }
  // Default range for unknown services
  return { min: 100, max: 500 };
}

/**
 * Generates realistic price-containing text for a search result.
 * In production, this would perform actual HTTP requests with proper error handling.
 */
function generateMockContent(result: SearchResult, service: string, city: string): string {
  const hash = simpleHash(`${result.url}-${service}-${city}`);
  const range = getServiceRange(service);
  const spread = range.max - range.min;

  const price1 = range.min + (hash % spread);
  const price2 = range.min + ((hash * 7) % spread);
  const price3 = range.min + ((hash * 13) % spread);
  const avgPrice = Math.round((price1 + price2 + price3) / 3);

  const templates = [
    `${service} em ${city}: preços variam de R$ ${Math.min(price1, price2)} a R$ ${Math.max(price1, price2)}. O valor médio cobrado na região é de R$ ${avgPrice}. Solicite seu orçamento.`,
    `Quanto custa ${service} em ${city}? O preço médio é R$ ${avgPrice}. Encontramos valores a partir de R$ ${Math.min(price1, price2, price3)}, podendo chegar a R$ ${Math.max(price1, price2, price3)} dependendo da complexidade.`,
    `Serviço de ${service} disponível em ${city}. Valor: R$ ${price1},00. Mão de obra qualificada com garantia. Atendemos toda a região metropolitana.`,
    `Tabela de preços para ${service} - ${city}: Serviço básico: R$ ${Math.min(price1, price2)}. Serviço completo: R$ ${Math.max(price1, price2)}. Inclui material e mão de obra.`,
    `Orçamento para ${service} em ${city}. Preço por serviço: R$ ${price1}. Por hora: R$ ${Math.round(price1 / 4)}/h. Consulte condições especiais para ${city}.`,
  ];

  return templates[hash % templates.length];
}

/**
 * Scrapes content from a list of search results.
 * Returns structured content ready for price parsing.
 */
export async function scrapeSearchResults(
  results: SearchResult[],
  service: string,
  city: string
): Promise<ScrapedContent[]> {
  const scraped: ScrapedContent[] = [];

  for (const result of results) {
    try {
      const textContent = generateMockContent(result, service, city);

      scraped.push({
        url: result.url,
        title: result.title,
        textContent,
        sourceType: result.sourceType,
      });
    } catch {
      // Individual scrape failure is non-blocking
      console.warn(`Failed to scrape: ${result.url}`);
    }
  }

  // Simulate async scraping delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  return scraped;
}
