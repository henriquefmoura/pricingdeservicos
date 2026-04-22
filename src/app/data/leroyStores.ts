// ========================================
// Legacy re-exports — kept for compatibility
// ========================================
// New code should import from './companyStores' instead.

export {
  COMPANY_STORES as LEROY_MERLIN_STORES,
  getStoresByUF as getLeroyStoresByUF,
  getStoresByCity as getLeroyStoresByCity,
  getStoresNearby as getLeroyStoresNearby,
} from './companyStores';
