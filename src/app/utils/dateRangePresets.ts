// ========================================
// Date Range Presets for Historical Data
// ========================================

import type { DateRangePreset } from '../types/weather';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Retorna o intervalo de datas para um preset.
 * Para o preset "custom", usa as datas fornecidas.
 */
export function getDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRange {
  const today = new Date();
  // API de histórico geralmente não tem dados do dia atual, usar dia anterior como end
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (preset) {
    case '7d': {
      const start = new Date(yesterday);
      start.setDate(start.getDate() - 6);
      return {
        startDate: toISODate(start),
        endDate: toISODate(yesterday),
        label: 'Últimos 7 dias',
      };
    }

    case '30d': {
      const start = new Date(yesterday);
      start.setDate(start.getDate() - 29);
      return {
        startDate: toISODate(start),
        endDate: toISODate(yesterday),
        label: 'Últimos 30 dias',
      };
    }

    case 'lastYear': {
      const start = new Date(yesterday);
      start.setFullYear(start.getFullYear() - 1);
      const end = new Date(yesterday);
      end.setFullYear(end.getFullYear() - 1);
      end.setDate(end.getDate() + 29); // 30-day window from last year
      return {
        startDate: toISODate(start),
        endDate: toISODate(end),
        label: 'Mesmo período do ano anterior',
      };
    }

    case 'custom': {
      return {
        startDate: customStart ?? toISODate(yesterday),
        endDate: customEnd ?? toISODate(yesterday),
        label: 'Período personalizado',
      };
    }
  }
}

export const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'lastYear', label: 'Mesmo período (ano anterior)' },
  { value: 'custom', label: 'Personalizado' },
];
