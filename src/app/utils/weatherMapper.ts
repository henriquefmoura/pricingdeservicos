// ========================================
// Weather Code → Label / Category / Icon
// ========================================
// WMO Weather interpretation codes
// https://open-meteo.com/en/docs

export interface WeatherCodeInfo {
  label: string;
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  icon: string; // emoji fallback
}

const WEATHER_CODE_MAP: Record<number, WeatherCodeInfo> = {
  0: { label: 'Céu limpo', category: 'clear', icon: '☀️' },
  1: { label: 'Predominantemente limpo', category: 'clear', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', category: 'cloudy', icon: '⛅' },
  3: { label: 'Nublado', category: 'cloudy', icon: '☁️' },
  45: { label: 'Neblina', category: 'fog', icon: '🌫️' },
  48: { label: 'Neblina com geada', category: 'fog', icon: '🌫️' },
  51: { label: 'Garoa leve', category: 'drizzle', icon: '🌦️' },
  53: { label: 'Garoa moderada', category: 'drizzle', icon: '🌦️' },
  55: { label: 'Garoa intensa', category: 'drizzle', icon: '🌧️' },
  56: { label: 'Garoa congelante leve', category: 'drizzle', icon: '🌧️' },
  57: { label: 'Garoa congelante intensa', category: 'drizzle', icon: '🌧️' },
  61: { label: 'Chuva leve', category: 'rain', icon: '🌧️' },
  63: { label: 'Chuva moderada', category: 'rain', icon: '🌧️' },
  65: { label: 'Chuva forte', category: 'rain', icon: '🌧️' },
  66: { label: 'Chuva congelante leve', category: 'rain', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', category: 'rain', icon: '🌧️' },
  71: { label: 'Neve leve', category: 'snow', icon: '🌨️' },
  73: { label: 'Neve moderada', category: 'snow', icon: '🌨️' },
  75: { label: 'Neve forte', category: 'snow', icon: '❄️' },
  77: { label: 'Granizo', category: 'snow', icon: '🧊' },
  80: { label: 'Pancadas de chuva leves', category: 'rain', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', category: 'rain', icon: '🌧️' },
  82: { label: 'Pancadas de chuva violentas', category: 'rain', icon: '⛈️' },
  85: { label: 'Pancadas de neve leves', category: 'snow', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', category: 'snow', icon: '❄️' },
  95: { label: 'Tempestade', category: 'thunderstorm', icon: '⛈️' },
  96: { label: 'Tempestade com granizo leve', category: 'thunderstorm', icon: '⛈️' },
  99: { label: 'Tempestade com granizo forte', category: 'thunderstorm', icon: '⛈️' },
};

const UNKNOWN_WEATHER: WeatherCodeInfo = {
  label: 'Indisponível',
  category: 'clear',
  icon: '❓',
};

/**
 * Converte um weather_code WMO para informações amigáveis em pt-BR.
 */
export function getWeatherInfo(code: number | null | undefined): WeatherCodeInfo {
  if (code == null) return UNKNOWN_WEATHER;
  return WEATHER_CODE_MAP[code] ?? UNKNOWN_WEATHER;
}

/**
 * Formata temperatura com uma casa decimal e unidade.
 */
export function formatTemperature(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value.toFixed(1)}°C`;
}

/**
 * Formata precipitação em mm.
 */
export function formatPrecipitation(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value.toFixed(1)} mm`;
}

/**
 * Formata velocidade do vento em km/h.
 */
export function formatWindSpeed(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value.toFixed(1)} km/h`;
}

/**
 * Formata data ISO para exibição pt-BR curta (ex: "27 mar").
 * Aceita formatos YYYY-MM-DD ou ISO timestamps completos.
 */
export function formatDateShort(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

/**
 * Formata data ISO para exibição pt-BR (ex: "27 de março de 2024").
 * Aceita formatos YYYY-MM-DD ou ISO timestamps completos.
 */
export function formatDateFull(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const date = new Date(datePart + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formata horário ISO para exibição (ex: "14:30").
 */
export function formatTime(isoStr: string | undefined): string {
  if (!isoStr) return '--';
  const date = new Date(isoStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retorna cor de fundo para a categoria da condição climática.
 */
export function getCategoryColor(category: WeatherCodeInfo['category']): string {
  const colors: Record<string, string> = {
    clear: '#FEF3C7',
    cloudy: '#F3F4F6',
    fog: '#E5E7EB',
    drizzle: '#DBEAFE',
    rain: '#BFDBFE',
    snow: '#E0E7FF',
    thunderstorm: '#FEE2E2',
  };
  return colors[category] ?? '#F3F4F6';
}
