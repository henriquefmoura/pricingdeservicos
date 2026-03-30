// ========================================
// Service ↔ CNAE Mappings
// ========================================

import type { ServiceCnaeMapping } from '../types/territorial';

export const SERVICE_CNAE_MAPPINGS: ServiceCnaeMapping[] = [
  { serviceId: 'instalacao-eletrica', serviceName: 'Instalação Elétrica', cnaeCodes: ['4321-5/00'], keywords: ['elétrica', 'eletricista'] },
  { serviceId: 'pintura', serviceName: 'Pintura', cnaeCodes: ['4330-4/04'], keywords: ['pintura', 'pintor'] },
  { serviceId: 'ar-condicionado-instalacao', serviceName: 'Ar-Condicionado', cnaeCodes: ['4322-3/02'], keywords: ['ar-condicionado', 'split'] },
  { serviceId: 'hidraulica-geral', serviceName: 'Hidráulica', cnaeCodes: ['4322-3/01'], keywords: ['hidráulica', 'encanador'] },
  { serviceId: 'montagem-moveis', serviceName: 'Montagem de Móveis', cnaeCodes: ['3104-7/00'], keywords: ['montagem', 'móveis'] },
  { serviceId: 'impermeabilizacao', serviceName: 'Impermeabilização', cnaeCodes: ['4330-4/02'], keywords: ['impermeabilização'] },
  { serviceId: 'fechadura-digital', serviceName: 'Fechadura Digital', cnaeCodes: ['4330-4/99'], keywords: ['fechadura', 'serralheiro'] },
  { serviceId: 'papel-de-parede', serviceName: 'Papel de Parede', cnaeCodes: ['4330-4/04'], keywords: ['papel de parede'] },
  { serviceId: 'energia-solar', serviceName: 'Energia Solar', cnaeCodes: ['4321-5/00', '3321-0/00'], keywords: ['solar', 'fotovoltaico'] },
  { serviceId: 'telhado-reparo', serviceName: 'Telhado / Coberturas', cnaeCodes: ['4399-1/03'], keywords: ['telhado', 'cobertura'] },
  { serviceId: 'jardinagem', serviceName: 'Jardinagem', cnaeCodes: ['8130-3/00'], keywords: ['jardinagem', 'paisagismo'] },
  { serviceId: 'limpeza', serviceName: 'Limpeza', cnaeCodes: ['8121-4/00'], keywords: ['limpeza', 'faxina'] },
  { serviceId: 'obras-construcoes', serviceName: 'Obras e Construções', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/03', '4399-1/99'], keywords: ['obras', 'construção', 'construcao', 'reforma', 'alvenaria', 'edificação'] },
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
