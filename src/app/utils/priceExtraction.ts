// ========================================
// Price Extraction Utility
// ========================================
// Extracts price values from unstructured text using regex and heuristics.

export interface ExtractedPrice {
  value: number;
  context: string;
  matchType: 'exact' | 'range_low' | 'range_high' | 'approximate';
}

/**
 * Regex patterns for Brazilian Real price formats.
 */
const PRICE_PATTERNS: RegExp[] = [
  // R$ 1.234,56
  /R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
  // R$1234,56 (no space)
  /R\$([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
  // "a partir de R$ 150"
  /a\s+partir\s+de\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
  // "por R$ 200"
  /por\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
  // "de R$ 100 a R$ 200" — captures both
  /de\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)\s+a\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
  // "entre R$ 100 e R$ 200"
  /entre\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)\s+e\s+R\$\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi,
];

/**
 * Parses a BRL string value to number.
 */
function parseBRLValue(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

/**
 * Extracts surrounding context for a match position.
 */
function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const contextRadius = 60;
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(text.length, matchIndex + matchLength + contextRadius);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts all prices from a text block.
 */
export function extractPrices(text: string): ExtractedPrice[] {
  const results: ExtractedPrice[] = [];
  const seen = new Set<string>();

  for (const pattern of PRICE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const context = extractContext(text, match.index, match[0].length);

      if (match[2]) {
        // Range match (de...a... or entre...e...)
        const low = parseBRLValue(match[1]);
        const high = parseBRLValue(match[2]);
        const keyLow = `${low}-range_low`;
        const keyHigh = `${high}-range_high`;

        if (!seen.has(keyLow) && isReasonablePrice(low)) {
          seen.add(keyLow);
          results.push({ value: low, context, matchType: 'range_low' });
        }
        if (!seen.has(keyHigh) && isReasonablePrice(high)) {
          seen.add(keyHigh);
          results.push({ value: high, context, matchType: 'range_high' });
        }
      } else {
        const value = parseBRLValue(match[1]);
        const key = `${value}-exact`;

        if (!seen.has(key) && isReasonablePrice(value)) {
          seen.add(key);
          const isApprox = /a\s+partir|aproximad|cerca\s+de/i.test(context);
          results.push({
            value,
            context,
            matchType: isApprox ? 'approximate' : 'exact',
          });
        }
      }
    }
  }

  return results;
}

/**
 * Checks if a price is within a reasonable range for services.
 */
function isReasonablePrice(value: number): boolean {
  return value >= 10 && value <= 50000;
}
