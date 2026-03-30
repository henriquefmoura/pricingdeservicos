// ========================================
// Text Cleaning Utility
// ========================================
// Cleans and sanitizes raw text for price extraction and analysis.

/**
 * Removes HTML tags from text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Removes excessive whitespace and normalizes line breaks.
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/[\r\n]+/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

/**
 * Removes common non-printable and control characters.
 */
export function removeControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Removes special characters but preserves currency symbols and punctuation.
 */
export function sanitizeForPricing(text: string): string {
  return text
    .replace(/[^\w\s.,;:!?()R$€£¥+\-/áéíóúãõâêôçÁÉÍÓÚÃÕÂÊÔÇ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Full text cleaning pipeline.
 */
export function cleanText(raw: string): string {
  let text = stripHtml(raw);
  text = removeControlChars(text);
  text = normalizeWhitespace(text);
  return text;
}

/**
 * Extracts sentences containing price-related terms.
 */
export function extractPriceSentences(text: string): string[] {
  const priceKeywords = [
    'R\\$', 'reais', 'preço', 'valor', 'custo', 'cobrar', 'cobra',
    'orçamento', 'a partir de', 'por hora', 'por m2', 'por metro',
    'instalação', 'serviço completo', 'mão de obra', 'mao de obra',
  ];

  const pattern = new RegExp(
    `[^.!?]*(?:${priceKeywords.join('|')})[^.!?]*[.!?]?`,
    'gi'
  );

  const matches = text.match(pattern);
  if (!matches) return [];

  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 500);
}
