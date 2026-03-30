// ========================================
// Competitor Parser Service
// ========================================
// Parses scraped content to extract raw price entries.

import type { ScrapedContent, RawPriceEntry } from '../../types/competitor';
import { extractPrices } from '../../utils/priceExtraction';
import { cleanText, extractPriceSentences } from '../../utils/textCleaning';

/**
 * Parses scraped content to extract all raw price entries.
 * Uses regex, heuristics, and contextual extraction.
 */
export function parseScrapedContent(content: ScrapedContent[]): RawPriceEntry[] {
  const rawEntries: RawPriceEntry[] = [];

  for (const item of content) {
    try {
      // Step 1: Clean the raw text
      const cleaned = cleanText(item.textContent);

      // Step 2: Extract sentences with price context
      const priceSentences = extractPriceSentences(cleaned);
      const textToSearch = priceSentences.length > 0
        ? priceSentences.join(' ')
        : cleaned;

      // Step 3: Extract prices using regex patterns
      const extracted = extractPrices(textToSearch);

      // Step 4: Convert to RawPriceEntry format
      for (const price of extracted) {
        rawEntries.push({
          text: price.context,
          value: price.value,
          currency: 'BRL',
          context: price.context,
          url: item.url,
          sourceType: item.sourceType,
        });
      }
    } catch {
      // Individual parse failure is non-blocking
      console.warn(`Failed to parse content from: ${item.url}`);
    }
  }

  return rawEntries;
}

/**
 * Detects the price unit from context text.
 */
export function detectPriceUnit(context: string): 'servico' | 'hora' | 'm2' | 'visita' | undefined {
  const lower = context.toLowerCase();

  if (/por\s+hora|\/\s*h\b|\/hora/i.test(lower)) return 'hora';
  if (/por\s+m[2²]|\/\s*m[2²]\b|metro\s+quadrado/i.test(lower)) return 'm2';
  if (/visita|chamado|deslocamento/i.test(lower)) return 'visita';
  if (/servi[çc]o|completo|instala[çc][aã]o|total/i.test(lower)) return 'servico';

  return undefined;
}
