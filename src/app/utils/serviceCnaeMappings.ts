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
// Codes follow IBGE CNAE 2.0 classification — Section F (Construção) + related services
export const CNAE_CODE_CATEGORY: Record<string, CnaeServiceCategory> = {
  // ── Elétrica ──────────────────────────────────────────────
  '4321-5/00': 'eletrica',   // Instalação e manutenção elétrica em edificações
  '4321-5/01': 'eletrica',   // Instalação de painéis elétricos e de outros equipamentos elétricos

  // ── Pintura ───────────────────────────────────────────────
  '4330-4/04': 'pintura',    // Serviços de pintura de edifícios em geral
  '4211-1/02': 'pintura',    // Pintura para sinalização em pistas rodoviárias e aeroportos

  // ── Hidráulica ────────────────────────────────────────────
  '4322-3/01': 'hidraulica', // Instalações hidráulicas, sanitárias e de gás em construções
  '4222-7/01': 'hidraulica', // Construção de redes de abastecimento de água, coleta de esgoto
  '4222-7/02': 'hidraulica', // Obras de irrigação
  '4399-1/05': 'hidraulica', // Perfuração e construção de poços de água

  // ── Reforma / Acabamento ──────────────────────────────────
  '4330-4/01': 'reforma',    // Impermeabilização em obras de engenharia civil
  '4330-4/02': 'reforma',    // Instalação de portas, janelas, tetos, divisórias e armários embutidos
  '4330-4/03': 'reforma',    // Obras de acabamento em gesso e estuque
  '4330-4/05': 'reforma',    // Aplicação de revestimentos e de resinas em interiores e exteriores
  '4330-4/06': 'reforma',    // Obras de acabamento em gesso e estuque (subcategoria)
  '4330-4/07': 'reforma',    // Obras de fundações especiais
  '4330-4/08': 'reforma',    // Reparação, manutenção e reforma de edificações
  '4399-1/03': 'reforma',    // Obras de alvenaria
  '4399-1/99': 'reforma',    // Serviços especializados para construção não especificados
  '4391-7/00': 'reforma',    // Obras de fundações

  // ── Construção ────────────────────────────────────────────
  '4110-7/00': 'construcao', // Incorporação de empreendimentos imobiliários
  '4120-4/00': 'construcao', // Construção de edifícios
  '4211-1/01': 'construcao', // Construção de rodovias e ferrovias
  '4212-0/00': 'construcao', // Construção de obras de arte especiais
  '4213-8/00': 'construcao', // Obras de urbanização — ruas, praças e calçadas
  '4221-9/01': 'construcao', // Construção de barragens e represas para geração de energia elétrica
  '4221-9/02': 'construcao', // Construção de estações e redes de distribuição de energia elétrica
  '4223-5/00': 'construcao', // Construção de redes de transportes por dutos
  '4291-0/00': 'construcao', // Obras portuárias, marítimas e fluviais
  '4292-8/00': 'construcao', // Montagem de instalações industriais e de estruturas metálicas
  '4299-5/01': 'construcao', // Construção de instalações esportivas e recreativas
  '4299-5/99': 'construcao', // Outras obras de engenharia civil não especificadas anteriormente
  '4399-1/01': 'construcao', // Administração de obras
  '4399-1/02': 'construcao', // Montagem e desmontagem de andaimes e estruturas temporárias
  '4399-1/04': 'construcao', // Operação e fornecimento de equipamentos para construção
  '4311-8/01': 'construcao', // Demolição de edifícios e outras estruturas
  '4311-8/02': 'construcao', // Preparação de canteiro e limpeza de terreno
  '4312-6/00': 'construcao', // Perfurações e sondagens
  '4313-4/00': 'construcao', // Obras de terraplenagem
  '4319-3/00': 'construcao', // Serviços de preparação do terreno não especificados

  // ── Outros ────────────────────────────────────────────────
  '4322-3/02': 'outros',     // Instalação de sistemas de ar-condicionado, ventilação e refrigeração
  '4329-1/01': 'outros',     // Instalação de painéis publicitários
  '4329-1/02': 'outros',     // Instalação de equipamentos de navegação marítima
  '4329-1/05': 'outros',     // Tratamentos térmicos, acústicos ou de vibração
  '4329-1/99': 'outros',     // Outras obras de instalações em construções (automação, segurança)
  '4330-4/99': 'outros',     // Outros serviços de acabamento em construção civil
  '3104-7/00': 'outros',     // Fabricação e montagem de móveis (marceneiro)
  '3321-0/00': 'outros',     // Manutenção e reparação de tanques, reservatórios e equipamentos
  '8130-3/00': 'outros',     // Atividades paisagísticas (jardinagem)
  '8121-4/00': 'outros',     // Limpeza em prédios e em domicílios
  '8129-0/00': 'outros',     // Atividades de limpeza não especificadas anteriormente
  '4321-5/02': 'outros',     // Manutenção de instalações elétricas
  '4329-1/03': 'outros',     // Instalação de sistemas de ar condicionado central
  '4329-1/04': 'outros',     // Instalação e manutenção de elevadores e escadas rolantes
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
  { serviceId: 'instalacao-eletrica', serviceName: 'Instalação Elétrica', cnaeCodes: ['4321-5/00', '4321-5/01'], keywords: ['elétrica', 'eletricista'] },
  { serviceId: 'energia-solar', serviceName: 'Energia Solar', cnaeCodes: ['4321-5/00', '3321-0/00'], keywords: ['solar', 'fotovoltaico'] },

  // ── Pintura ──────────────────────────────────────────────────────────
  { serviceId: 'pintura', serviceName: 'Pintura', cnaeCodes: ['4330-4/04'], keywords: ['pintura', 'pintor'] },
  { serviceId: 'papel-de-parede', serviceName: 'Papel de Parede / Revestimento Decorativo', cnaeCodes: ['4330-4/04', '4330-4/05'], keywords: ['papel de parede'] },

  // ── Hidráulica ───────────────────────────────────────────────────────
  { serviceId: 'hidraulica-geral', serviceName: 'Hidráulica', cnaeCodes: ['4322-3/01', '4399-1/05'], keywords: ['hidráulica', 'encanador'] },

  // ── Acabamento / Reforma ─────────────────────────────────────────────
  { serviceId: 'impermeabilizacao', serviceName: 'Impermeabilização', cnaeCodes: ['4330-4/01'], keywords: ['impermeabilização'] },
  { serviceId: 'instalador-portas', serviceName: 'Instalador de Portas e Janelas', cnaeCodes: ['4330-4/02'], keywords: ['porta', 'janela', 'divisória', 'armário embutido', 'instalador de portas'] },
  { serviceId: 'gesso-estuque', serviceName: 'Gesso e Estuque / Drywall', cnaeCodes: ['4330-4/03', '4330-4/06'], keywords: ['gesso', 'estuque', 'drywall', 'forro'] },
  { serviceId: 'revestimentos', serviceName: 'Revestimentos (pisos, azulejos)', cnaeCodes: ['4330-4/05'], keywords: ['revestimento', 'piso', 'azulejo', 'cerâmica', 'porcelanato'] },
  { serviceId: 'telhado-reparo', serviceName: 'Alvenaria / Telhados', cnaeCodes: ['4399-1/03', '4330-4/08'], keywords: ['telhado', 'cobertura', 'alvenaria', 'tijolo'] },
  { serviceId: 'reforma-geral', serviceName: 'Reforma Geral', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99', '4330-4/08'], keywords: ['reforma', 'reformas', 'reformar'] },
  { serviceId: 'fechadura-automacao', serviceName: 'Segurança e Automação', cnaeCodes: ['4329-1/99', '4330-4/99', '4329-1/05'], keywords: ['fechadura', 'serralheiro', 'automação', 'segurança', 'câmera'] },
  { serviceId: 'fundacoes', serviceName: 'Fundações e Estruturas', cnaeCodes: ['4391-7/00', '4330-4/07', '4312-6/00', '4313-4/00'], keywords: ['fundação', 'estrutura', 'sondagem', 'terraplanagem'] },
  { serviceId: 'andaimes', serviceName: 'Andaimes e Equipamentos de Obras', cnaeCodes: ['4399-1/02', '4399-1/04'], keywords: ['andaime', 'equipamentos de obras'] },
  { serviceId: 'demolicao', serviceName: 'Demolição e Preparação de Canteiro', cnaeCodes: ['4311-8/01', '4311-8/02', '4319-3/00'], keywords: ['demolição', 'canteiro', 'preparação de terreno'] },

  // ── Marceneiro ───────────────────────────────────────────────────────
  { serviceId: 'marceneiro', serviceName: 'Marceneiro / Móveis Planejados', cnaeCodes: ['3104-7/00', '4330-4/02'], keywords: ['marceneiro', 'móveis planejados', 'carpinteiro', 'madeira', 'montagem'] },
  { serviceId: 'ar-condicionado-instalacao', serviceName: 'Ar-Condicionado', cnaeCodes: ['4322-3/02', '4329-1/03'], keywords: ['ar-condicionado', 'split', 'climatização'] },
  { serviceId: 'elevadores', serviceName: 'Elevadores e Escadas Rolantes', cnaeCodes: ['4329-1/04'], keywords: ['elevador', 'escada rolante'] },

  // ── Construção Civil ─────────────────────────────────────────────────
  { serviceId: 'obras-construcoes', serviceName: 'Construção de Edifícios', cnaeCodes: ['4120-4/00', '4399-1/01', '4399-1/99', '4110-7/00'], keywords: ['obras', 'construção', 'construcao', 'edificação', 'prédio'] },
  { serviceId: 'obras-urbanizacao', serviceName: 'Obras de Urbanização', cnaeCodes: ['4213-8/00', '4212-0/00', '4299-5/01'], keywords: ['urbanização', 'calçada', 'praça', 'obra de arte'] },
  { serviceId: 'obras-infraestrutura', serviceName: 'Infraestrutura (Rodovias / Barragens)', cnaeCodes: ['4211-1/01', '4211-1/02', '4221-9/01', '4221-9/02', '4299-5/99', '4223-5/00'], keywords: ['rodovia', 'ferrovia', 'barragem', 'infraestrutura', 'engenharia civil'] },
  { serviceId: 'obras-portuarias', serviceName: 'Obras Portuárias e Industriais', cnaeCodes: ['4291-0/00', '4292-8/00', '4222-7/01', '4222-7/02'], keywords: ['porto', 'industrial', 'abastecimento de água', 'irrigação'] },
  { serviceId: 'saneamento', serviceName: 'Saneamento e Redes de Água', cnaeCodes: ['4222-7/01', '4222-7/02', '4399-1/05'], keywords: ['saneamento', 'água', 'esgoto', 'poço'] },

  // ── Outros Serviços ──────────────────────────────────────────────────
  { serviceId: 'jardinagem', serviceName: 'Jardinagem', cnaeCodes: ['8130-3/00'], keywords: ['jardinagem', 'paisagismo', 'grama'] },
  { serviceId: 'limpeza', serviceName: 'Limpeza', cnaeCodes: ['8121-4/00', '8129-0/00'], keywords: ['limpeza', 'faxina'] },
  { serviceId: 'manutencao-equipamentos', serviceName: 'Manutenção de Equipamentos', cnaeCodes: ['3321-0/00'], keywords: ['manutenção', 'reparo', 'equipamentos'] },
  { serviceId: 'paineis-publicitarios', serviceName: 'Painéis Publicitários e Comunicação Visual', cnaeCodes: ['4329-1/01'], keywords: ['painel', 'publicidade', 'comunicação visual', 'outdoor'] },
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
