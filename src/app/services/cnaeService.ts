// ========================================
// CNAE Service — Backward Compatibility
// ========================================
// Re-exports from the new ibge/cnaeService.ts for backward compatibility.

export { fetchCnaeByCode, searchCnae, getCnaeClasses, getCnaeSubclasses, mapServiceToCnae } from './ibge/cnaeService';
export type { CnaeClass, CnaeSubclass, ServiceCnaeResult } from './ibge/cnaeService';
