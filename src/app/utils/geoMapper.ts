// ========================================
// Geo Mapper Utility
// ========================================
// Maps text content to geographic locations (cities/regions).

/**
 * Common Brazilian city name patterns and their normalized forms.
 */
const CITY_ALIASES: Record<string, string[]> = {
  'São Paulo': ['sao paulo', 'sp', 'sampa'],
  'Rio de Janeiro': ['rio de janeiro', 'rj', 'rio'],
  'Belo Horizonte': ['belo horizonte', 'bh', 'beagá'],
  'Curitiba': ['curitiba', 'ctba', 'cwb'],
  'Porto Alegre': ['porto alegre', 'poa'],
  'Salvador': ['salvador', 'ssa'],
  'Brasília': ['brasilia', 'bsb', 'df'],
  'Fortaleza': ['fortaleza', 'for'],
  'Recife': ['recife', 'rec'],
  'Manaus': ['manaus', 'mao'],
  'Goiânia': ['goiania', 'gyn'],
  'Campinas': ['campinas', 'cps'],
  'Florianópolis': ['florianopolis', 'floripa'],
};

/**
 * Removes diacritics from a string for comparison.
 */
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if text content mentions a specific city.
 */
export function textMentionsCity(text: string, city: string): boolean {
  const normalizedText = removeDiacritics(text.toLowerCase());
  const normalizedCity = removeDiacritics(city.toLowerCase());

  // Direct match
  if (normalizedText.includes(normalizedCity)) return true;

  // Check aliases
  const aliases = CITY_ALIASES[city];
  if (aliases) {
    return aliases.some((alias) => normalizedText.includes(removeDiacritics(alias)));
  }

  return false;
}

/**
 * Detects which city is most likely referenced in a text.
 */
export function detectCityInText(text: string, candidateCities: string[]): string | null {
  const normalizedText = removeDiacritics(text.toLowerCase());

  for (const city of candidateCities) {
    const normalizedCity = removeDiacritics(city.toLowerCase());
    if (normalizedText.includes(normalizedCity)) {
      return city;
    }
  }

  // Check known aliases
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (normalizedText.includes(removeDiacritics(alias))) {
        return canonical;
      }
    }
  }

  return null;
}

/**
 * Extracts city name from a URL domain or path.
 */
export function extractCityFromURL(url: string): string | null {
  try {
    const lower = url.toLowerCase();

    for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
      for (const alias of aliases) {
        const normalizedAlias = removeDiacritics(alias).replace(/\s+/g, '-');
        if (lower.includes(normalizedAlias)) {
          return canonical;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Determines the geographic region for a city (simplified).
 */
export function getCityRegion(city: string): string {
  const regionMap: Record<string, string> = {
    'São Paulo': 'Sudeste',
    'Rio de Janeiro': 'Sudeste',
    'Belo Horizonte': 'Sudeste',
    'Campinas': 'Sudeste',
    'Curitiba': 'Sul',
    'Porto Alegre': 'Sul',
    'Florianópolis': 'Sul',
    'Salvador': 'Nordeste',
    'Fortaleza': 'Nordeste',
    'Recife': 'Nordeste',
    'Brasília': 'Centro-Oeste',
    'Goiânia': 'Centro-Oeste',
    'Manaus': 'Norte',
  };

  return regionMap[city] ?? 'Desconhecida';
}
