// ========================================
// Currency Parser Utility
// ========================================
// Parses and formats BRL currency values.

/**
 * Parses a Brazilian Real (BRL) formatted string to number.
 * Handles formats like: "1.234,56", "1234,56", "1234.56", "1234"
 */
export function parseBRL(value: string): number | null {
  if (!value || typeof value !== 'string') return null;

  // Remove R$ symbol and whitespace
  let cleaned = value.replace(/R\$\s*/g, '').trim();

  // Remove any non-numeric characters except dots, commas
  cleaned = cleaned.replace(/[^\d.,]/g, '');

  if (!cleaned) return null;

  // Determine format: if comma exists and is after last dot, it's decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Brazilian format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma >= 0) {
    // US format used by some systems: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma >= 0) {
    // Only comma: 1234,56
    cleaned = cleaned.replace(',', '.');
  }
  // else: only dot or no decimal separator

  const result = parseFloat(cleaned);
  return isNaN(result) ? null : result;
}

/**
 * Formats a number as BRL currency string.
 */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number as a compact BRL string (no cents when integer).
 */
export function formatBRLCompact(value: number): string {
  if (Number.isInteger(value)) {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  }
  return formatBRL(value);
}

/**
 * Detects if a string contains a price-like pattern.
 */
export function containsPrice(text: string): boolean {
  return /R\$\s*[\d.,]+/i.test(text) || /\d{2,}[.,]\d{2}/.test(text);
}
