// ========================================
// Service ↔ CNAE Mappings
// ========================================

import type { ServiceCnaeMapping } from '../types/territorial';
import type { CnaeServiceCategory } from '../types/territorial';

// Activity color palette — one consistent color per category
export const CNAE_CATEGORY_COLORS: Record<CnaeServiceCategory, string> = {
  eletrica:  '#f59e0b', // amber
  pintura:   '#f97316', // orange
  hidraulica:'#3b82f6', // blue
  reforma:   '#22c55e', // green
  outros:    '#6b7280', // gray
};

// Per-CNAE-code activity category and display color
export const CNAE_CODE_CATEGORY: Record<string, CnaeServiceCategory> = {
  '4321-5/00': 'eletrica',
  '4330-4/04': 'pintura',
  '4322-3/01': 'hidraulica',
  '4322-3/02': 'outros',   // Ar-condicionado
  '3104-7/00': 'outros',   // Montagem de Móveis
  '4330-4/02': 'outros',   // Impermeabilização
  '4330-4/99': 'outros',   // Fechadura Digital
  '3321-0/00': 'outros',   // Manutenção de Equipamentos
  '4399-1/03': 'reforma',  // Telhado / Coberturas
  '8130-3/00': 'outros',   // Jardinagem
  '8121-4/00': 'outros',   // Limpeza
  '4120-4/00': 'reforma',  // Construção de Edifícios
  '4399-1/01': 'reforma',  // Administração de Obras
  '4399-1/99': 'reforma',  // Serviços Especializados para Construção
};

export function getCnaeCategory(code: string): CnaeServiceCategory {
  return CNAE_CODE_CATEGORY[code] ?? 'outros';
}

export function getCnaeColor(code: string): string {
  return CNAE_CATEGORY_COLORS[getCnaeCategory(code)];
}

// Human-readable category labels and icons used in the sidebar
export const CNAE_CATEGORY_META: Record<CnaeServiceCategory, { label: string; icon: string }> = {
  eletrica:  { label: 'Elétrica',   icon: '⚡' },
  pintura:   { label: 'Pintura',    icon: '🖌️' },
  hidraulica:{ label: 'Hidráulica', icon: '💧' },
  reforma:   { label: 'Reforma',    icon: '🏗️' },
  outros:    { label: 'Outros',     icon: '🔧' },
};

export const SERVICE_CNAE_MAPPINGS: ServiceCnaeMapping[] = [
  { serviceId: 'instalacao-eletrica', serviceName: 'Instalação Elétrica', cnaeCodes: ['4321-5/00'], keywords: ['elétrica', 'eletricista'] },
  { serviceId: 'pintura', serviceName: 'Pintura', cnaeCodes: ['4330-4/04'], keywords: ['pintura', 'pintor'] },
  { serviceId: 'hidraulica-geral', serviceName: 'Hidráulica', cnaeCodes: ['4322-3/01'], keywords: ['hidráulica', 'encanador'] },
  { serviceId: 'reforma-geral', serviceName: 'Reforma Geral', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99'], keywords: ['reforma', 'reformas', 'reformar', 'alvenaria'] },
  { serviceId: 'ar-condicionado-instalacao', serviceName: 'Ar-Condicionado', cnaeCodes: ['4322-3/02'], keywords: ['ar-condicionado', 'split'] },
  { serviceId: 'montagem-moveis', serviceName: 'Montagem de Móveis', cnaeCodes: ['3104-7/00'], keywords: ['montagem', 'móveis'] },
  { serviceId: 'impermeabilizacao', serviceName: 'Impermeabilização', cnaeCodes: ['4330-4/02'], keywords: ['impermeabilização'] },
  { serviceId: 'fechadura-digital', serviceName: 'Fechadura Digital', cnaeCodes: ['4330-4/99'], keywords: ['fechadura', 'serralheiro'] },
  { serviceId: 'papel-de-parede', serviceName: 'Papel de Parede', cnaeCodes: ['4330-4/04'], keywords: ['papel de parede'] },
  { serviceId: 'energia-solar', serviceName: 'Energia Solar', cnaeCodes: ['4321-5/00', '3321-0/00'], keywords: ['solar', 'fotovoltaico'] },
  { serviceId: 'telhado-reparo', serviceName: 'Telhado / Coberturas', cnaeCodes: ['4399-1/03'], keywords: ['telhado', 'cobertura'] },
  { serviceId: 'jardinagem', serviceName: 'Jardinagem', cnaeCodes: ['8130-3/00'], keywords: ['jardinagem', 'paisagismo'] },
  { serviceId: 'limpeza', serviceName: 'Limpeza', cnaeCodes: ['8121-4/00'], keywords: ['limpeza', 'faxina'] },
  { serviceId: 'obras-construcoes', serviceName: 'Obras e Construções', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99'], keywords: ['obras', 'construção', 'construcao', 'edificação'] },
];

export function getMappingByServiceId(serviceId: string): ServiceCnaeMapping | null {
  return SERVICE_CNAE_MAPPINGS.find((s) => s.serviceId === serviceId) ?? null;
}

export function getMappingsByKeyword(keyword: string): ServiceCnaeMapping[] {
  const lower = keyword.toLowerCase();
  return SERVICE_CNAE_MAPPINGS.filter((s) =>
    s.keywords?.some((k) => k.includes(lower)) || s.serviceName.toLowerCase().includes(lower)
  );
}

export function getAllCnaeCodes(): string[] {
  const set = new Set<string>();
  SERVICE_CNAE_MAPPINGS.forEach((s) => s.cnaeCodes.forEach((c) => set.add(c)));
  return Array.from(set);
}

export function getCnaeCodesForService(serviceId: string): string[] {
  return getMappingByServiceId(serviceId)?.cnaeCodes ?? [];
}
