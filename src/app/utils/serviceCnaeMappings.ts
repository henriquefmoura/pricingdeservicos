// ========================================
// Service ↔ CNAE Mappings
// ========================================

import type { ServiceCnaeMapping } from '../types/territorial';
import type { CnaeServiceCategory } from '../types/territorial';

// Activity color palette — one consistent color per category
export const CNAE_CATEGORY_COLORS: Record<CnaeServiceCategory, string> = {
  eletrica:   '#f59e0b', // amber
  pintura:    '#f97316', // orange
  hidraulica: '#3b82f6', // blue
  reforma:    '#22c55e', // green
  construcao: '#8b5cf6', // violet
  outros:     '#6b7280', // gray
};

// Per-CNAE-code activity category and display color
// Codes follow IBGE CNAE 2.0 classification
export const CNAE_CODE_CATEGORY: Record<string, CnaeServiceCategory> = {
  // ── Elétrica ──────────────────────────────────────────────
  '4321-5/00': 'eletrica',   // Instalação e manutenção elétrica

  // ── Pintura ───────────────────────────────────────────────
  '4330-4/04': 'pintura',    // Serviços de pintura de edifícios em geral

  // ── Hidráulica ────────────────────────────────────────────
  '4322-3/01': 'hidraulica', // Instalações hidráulicas, sanitárias e de gás

  // ── Reforma / Acabamento ──────────────────────────────────
  '4330-4/01': 'reforma',    // Impermeabilização em obras de engenharia civil
  '4330-4/02': 'reforma',    // Instalação de portas, janelas, tetos, divisórias e armários embutidos
  '4330-4/03': 'reforma',    // Obras de acabamento em gesso e estuque
  '4330-4/05': 'reforma',    // Aplicação de revestimentos e de resinas em interiores e exteriores
  '4399-1/03': 'reforma',    // Obras de alvenaria
  '4399-1/99': 'reforma',    // Serviços especializados para construção não especificados

  // ── Construção ────────────────────────────────────────────
  '4120-4/00': 'construcao', // Construção de edifícios
  '4211-1/01': 'construcao', // Construção de rodovias e ferrovias
  '4221-9/01': 'construcao', // Construção de barragens e represas para geração de energia elétrica
  '4299-5/99': 'construcao', // Outras obras de engenharia civil não especificadas anteriormente
  '4399-1/01': 'construcao', // Administração de obras

  // ── Outros ────────────────────────────────────────────────
  '4322-3/02': 'outros',     // Instalação de sistemas de ar-condicionado, ventilação e refrigeração
  '4329-1/99': 'outros',     // Outras obras de instalações em construções (automação, segurança, etc.)
  '3104-7/00': 'outros',     // Fabricação e montagem de móveis (marceneiro)
  '4330-4/99': 'outros',     // Serviços especializados para construção não especificados (fechaduras)
  '3321-0/00': 'outros',     // Manutenção e reparação de tanques, reservatórios e equipamentos
  '8130-3/00': 'outros',     // Atividades paisagísticas (jardinagem)
  '8121-4/00': 'outros',     // Limpeza em prédios e em domicílios
};

export function getCnaeCategory(code: string): CnaeServiceCategory {
  return CNAE_CODE_CATEGORY[code] ?? 'outros';
}

export function getCnaeColor(code: string): string {
  return CNAE_CATEGORY_COLORS[getCnaeCategory(code)];
}

// Human-readable category labels and icons used in the sidebar
export const CNAE_CATEGORY_META: Record<CnaeServiceCategory, { label: string; icon: string }> = {
  eletrica:   { label: 'Elétrica',    icon: '⚡' },
  pintura:    { label: 'Pintura',     icon: '🖌️' },
  hidraulica: { label: 'Hidráulica',  icon: '💧' },
  reforma:    { label: 'Acabamento',  icon: '🏠' },
  construcao: { label: 'Construção',  icon: '🏗️' },
  outros:     { label: 'Outros',      icon: '🔧' },
};

export const SERVICE_CNAE_MAPPINGS: ServiceCnaeMapping[] = [
  // ── Elétrica ─────────────────────────────────────────────────────────
  { serviceId: 'instalacao-eletrica', serviceName: 'Instalação Elétrica', cnaeCodes: ['4321-5/00'], keywords: ['elétrica', 'eletricista'] },
  { serviceId: 'energia-solar', serviceName: 'Energia Solar', cnaeCodes: ['4321-5/00', '3321-0/00'], keywords: ['solar', 'fotovoltaico'] },

  // ── Pintura ──────────────────────────────────────────────────────────
  { serviceId: 'pintura', serviceName: 'Pintura', cnaeCodes: ['4330-4/04'], keywords: ['pintura', 'pintor'] },
  { serviceId: 'papel-de-parede', serviceName: 'Papel de Parede / Revestimento Decorativo', cnaeCodes: ['4330-4/04', '4330-4/05'], keywords: ['papel de parede'] },

  // ── Hidráulica ───────────────────────────────────────────────────────
  { serviceId: 'hidraulica-geral', serviceName: 'Hidráulica', cnaeCodes: ['4322-3/01'], keywords: ['hidráulica', 'encanador'] },

  // ── Acabamento / Reforma ─────────────────────────────────────────────
  { serviceId: 'impermeabilizacao', serviceName: 'Impermeabilização', cnaeCodes: ['4330-4/01'], keywords: ['impermeabilização'] },
  { serviceId: 'instalador-portas', serviceName: 'Instalador de Portas e Janelas', cnaeCodes: ['4330-4/02'], keywords: ['porta', 'janela', 'divisória', 'armário embutido', 'instalador de portas'] },
  { serviceId: 'gesso-estuque', serviceName: 'Gesso e Estuque', cnaeCodes: ['4330-4/03'], keywords: ['gesso', 'estuque', 'drywall', 'forro'] },
  { serviceId: 'revestimentos', serviceName: 'Revestimentos (pisos, azulejos)', cnaeCodes: ['4330-4/05'], keywords: ['revestimento', 'piso', 'azulejo', 'cerâmica', 'porcelanato'] },
  { serviceId: 'telhado-reparo', serviceName: 'Alvenaria / Telhados', cnaeCodes: ['4399-1/03'], keywords: ['telhado', 'cobertura', 'alvenaria', 'tijolo'] },
  { serviceId: 'reforma-geral', serviceName: 'Reforma Geral', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99'], keywords: ['reforma', 'reformas', 'reformar'] },
  { serviceId: 'fechadura-automacao', serviceName: 'Segurança e Automação', cnaeCodes: ['4329-1/99', '4330-4/99'], keywords: ['fechadura', 'serralheiro', 'automação', 'segurança', 'câmera'] },

  // ── Marceneiro ───────────────────────────────────────────────────────
  { serviceId: 'marceneiro', serviceName: 'Marceneiro / Móveis Planejados', cnaeCodes: ['3104-7/00', '4330-4/02'], keywords: ['marceneiro', 'móveis planejados', 'carpinteiro', 'madeira', 'montagem'] },
  { serviceId: 'ar-condicionado-instalacao', serviceName: 'Ar-Condicionado', cnaeCodes: ['4322-3/02'], keywords: ['ar-condicionado', 'split', 'climatização'] },

  // ── Construção Civil ─────────────────────────────────────────────────
  { serviceId: 'obras-construcoes', serviceName: 'Construção de Edifícios', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99'], keywords: ['obras', 'construção', 'construcao', 'edificação', 'prédio'] },
  { serviceId: 'obras-infraestrutura', serviceName: 'Infraestrutura (Rodovias / Barragens)', cnaeCodes: ['4211-1/01', '4221-9/01', '4299-5/99'], keywords: ['rodovia', 'ferrovia', 'barragem', 'infraestrutura', 'engenharia civil'] },

  // ── Outros Serviços ──────────────────────────────────────────────────
  { serviceId: 'jardinagem', serviceName: 'Jardinagem', cnaeCodes: ['8130-3/00'], keywords: ['jardinagem', 'paisagismo', 'grama'] },
  { serviceId: 'limpeza', serviceName: 'Limpeza', cnaeCodes: ['8121-4/00'], keywords: ['limpeza', 'faxina'] },
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
