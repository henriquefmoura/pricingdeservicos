// ========================================
// Service Sensitivity Service
// ========================================
// Configuração centralizada de sensibilidade climática por serviço.
// Estrutura editável sem hardcode espalhado no sistema.

import type { ServiceClimateSensitivity, ClimateSensitivityLevel, ClimateDriver } from '../types/pricingClimate';

// ----------------------------------------
// Mock Data — Sensibilidade Climática
// ----------------------------------------

const DEFAULT_SENSITIVITY_CONFIG: ServiceClimateSensitivity[] = [
  {
    serviceId: 'ar-condicionado-instalacao',
    serviceName: 'Instalação de Ar-Condicionado',
    sensitivityLevel: 'alta',
    drivers: ['calor'],
    notes: 'Demanda diretamente proporcional a ondas de calor e verão.',
    recommendationWeight: 1.0,
  },
  {
    serviceId: 'ar-condicionado-manutencao',
    serviceName: 'Manutenção de Ar-Condicionado',
    sensitivityLevel: 'alta',
    drivers: ['calor'],
    notes: 'Pico de manutenção no início do verão e ondas de calor.',
    recommendationWeight: 0.9,
  },
  {
    serviceId: 'impermeabilizacao',
    serviceName: 'Impermeabilização',
    sensitivityLevel: 'alta',
    drivers: ['chuva', 'umidade'],
    notes: 'Demanda cresce antes e durante períodos chuvosos.',
    recommendationWeight: 1.0,
  },
  {
    serviceId: 'ventilador-teto',
    serviceName: 'Instalação de Ventilador de Teto',
    sensitivityLevel: 'media',
    drivers: ['calor'],
    notes: 'Demanda moderada a alta em períodos de calor.',
    recommendationWeight: 0.7,
  },
  {
    serviceId: 'aquecedor-instalacao',
    serviceName: 'Instalação de Aquecedor',
    sensitivityLevel: 'alta',
    drivers: ['frio'],
    notes: 'Demanda diretamente proporcional a ondas de frio e inverno.',
    recommendationWeight: 1.0,
  },
  {
    serviceId: 'pintura-externa',
    serviceName: 'Pintura Externa',
    sensitivityLevel: 'alta',
    drivers: ['chuva', 'vento', 'umidade'],
    notes: 'Serviço depende de clima seco e sem vento. Chuva inviabiliza.',
    recommendationWeight: 0.9,
  },
  {
    serviceId: 'pintura-interna',
    serviceName: 'Pintura Interna',
    sensitivityLevel: 'baixa',
    drivers: ['umidade'],
    notes: 'Pouca influência climática, exceto por umidade excessiva.',
    recommendationWeight: 0.3,
  },
  {
    serviceId: 'montagem-moveis',
    serviceName: 'Montagem de Móveis',
    sensitivityLevel: 'nenhuma',
    drivers: [],
    notes: 'Serviço interno, sem correlação climática significativa.',
    recommendationWeight: 0,
  },
  {
    serviceId: 'fechadura-digital',
    serviceName: 'Instalação de Fechadura Digital',
    sensitivityLevel: 'nenhuma',
    drivers: [],
    notes: 'Serviço interno, sem correlação climática significativa.',
    recommendationWeight: 0,
  },
  {
    serviceId: 'telhado-reparo',
    serviceName: 'Reparo de Telhado',
    sensitivityLevel: 'alta',
    drivers: ['chuva', 'vento'],
    notes: 'Demanda aumenta após chuvas fortes e temporais.',
    recommendationWeight: 1.0,
  },
  {
    serviceId: 'calha-instalacao',
    serviceName: 'Instalação de Calha',
    sensitivityLevel: 'media',
    drivers: ['chuva'],
    notes: 'Demanda preventiva antes de períodos chuvosos.',
    recommendationWeight: 0.7,
  },
  {
    serviceId: 'piso-externo',
    serviceName: 'Instalação de Piso Externo',
    sensitivityLevel: 'media',
    drivers: ['chuva', 'umidade'],
    notes: 'Período seco é ideal para instalação e cura.',
    recommendationWeight: 0.6,
  },
  {
    serviceId: 'jardinagem',
    serviceName: 'Serviço de Jardinagem',
    sensitivityLevel: 'media',
    drivers: ['chuva', 'calor'],
    notes: 'Períodos de chuva e calor favorecem manutenção.',
    recommendationWeight: 0.6,
  },
  {
    serviceId: 'eletrica-geral',
    serviceName: 'Serviço Elétrico Geral',
    sensitivityLevel: 'baixa',
    drivers: ['amplitude_termica'],
    notes: 'Amplitude térmica pode causar sobrecargas e aumentar demanda.',
    recommendationWeight: 0.3,
  },
  {
    serviceId: 'hidraulica-geral',
    serviceName: 'Serviço Hidráulico Geral',
    sensitivityLevel: 'baixa',
    drivers: ['frio'],
    notes: 'Frio intenso pode causar problemas em tubulações.',
    recommendationWeight: 0.3,
  },
  {
    serviceId: 'visita-tecnica',
    serviceName: 'Visita Técnica',
    sensitivityLevel: 'baixa',
    drivers: ['chuva'],
    notes: 'Chuva pode dificultar deslocamento, mas não afeta fortemente a demanda.',
    recommendationWeight: 0.2,
  },
];

// Cache de configuração em memória
let sensitivityConfig: ServiceClimateSensitivity[] = [...DEFAULT_SENSITIVITY_CONFIG];

// ----------------------------------------
// API Pública
// ----------------------------------------

/**
 * Retorna a lista completa de configurações de sensibilidade.
 */
export function getAllSensitivities(): ServiceClimateSensitivity[] {
  return [...sensitivityConfig];
}

/**
 * Busca sensibilidade de um serviço pelo ID.
 * Se não encontrar, retorna configuração padrão de sensibilidade nenhuma.
 */
export function getSensitivityByServiceId(serviceId: string): ServiceClimateSensitivity {
  const found = sensitivityConfig.find((s) => s.serviceId === serviceId);
  if (found) return found;

  return {
    serviceId,
    serviceName: serviceId,
    sensitivityLevel: 'nenhuma',
    drivers: [],
    notes: 'Serviço sem configuração de sensibilidade climática.',
    recommendationWeight: 0,
  };
}

/**
 * Busca sensibilidade por nome do serviço (busca parcial, case insensitive).
 */
export function findSensitivityByName(serviceName: string): ServiceClimateSensitivity | null {
  const normalized = serviceName.toLowerCase().trim();
  return (
    sensitivityConfig.find((s) =>
      s.serviceName.toLowerCase().includes(normalized) ||
      normalized.includes(s.serviceName.toLowerCase())
    ) ?? null
  );
}

/**
 * Filtra serviços por nível de sensibilidade.
 */
export function filterByLevel(level: ClimateSensitivityLevel): ServiceClimateSensitivity[] {
  return sensitivityConfig.filter((s) => s.sensitivityLevel === level);
}

/**
 * Filtra serviços por driver climático.
 */
export function filterByDriver(driver: ClimateDriver): ServiceClimateSensitivity[] {
  return sensitivityConfig.filter((s) => s.drivers.includes(driver));
}

/**
 * Adiciona ou atualiza a configuração de sensibilidade de um serviço.
 */
export function upsertSensitivity(config: ServiceClimateSensitivity): void {
  const index = sensitivityConfig.findIndex((s) => s.serviceId === config.serviceId);
  if (index >= 0) {
    sensitivityConfig[index] = { ...config };
  } else {
    sensitivityConfig.push({ ...config });
  }
}

/**
 * Remove a configuração de sensibilidade de um serviço.
 */
export function removeSensitivity(serviceId: string): boolean {
  const index = sensitivityConfig.findIndex((s) => s.serviceId === serviceId);
  if (index >= 0) {
    sensitivityConfig.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Substitui toda a configuração de sensibilidade (ex.: carga via API ou arquivo).
 */
export function loadSensitivityConfig(configs: ServiceClimateSensitivity[]): void {
  sensitivityConfig = [...configs];
}

/**
 * Restaura a configuração padrão.
 */
export function resetToDefaults(): void {
  sensitivityConfig = [...DEFAULT_SENSITIVITY_CONFIG];
}
