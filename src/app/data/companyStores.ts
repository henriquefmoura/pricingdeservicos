// ========================================
// Company Store Data
// ========================================
// Dados das lojas da empresa no Brasil para exibição no mapa territorial.

import type { CompanyStore } from '../types/territorial';

export const COMPANY_STORES: CompanyStore[] = [
  { id: 'store-01', name: 'Loja Interlagos', city: 'São Paulo', uf: 'SP', lat: -23.6785, lon: -46.6797 },
  { id: 'store-02', name: 'Loja Marginal Tietê', city: 'São Paulo', uf: 'SP', lat: -23.5137, lon: -46.6582 },
  { id: 'store-03', name: 'Loja Morumbi', city: 'São Paulo', uf: 'SP', lat: -23.6239, lon: -46.7003 },
  { id: 'store-04', name: 'Loja Aricanduva', city: 'São Paulo', uf: 'SP', lat: -23.5613, lon: -46.5087 },
  { id: 'store-05', name: 'Loja Raposo Tavares', city: 'São Paulo', uf: 'SP', lat: -23.5887, lon: -46.7809 },
  { id: 'store-06', name: 'Loja Niterói', city: 'Niterói', uf: 'RJ', lat: -22.8833, lon: -43.1040 },
  { id: 'store-07', name: 'Loja Barra da Tijuca', city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9992, lon: -43.3654 },
  { id: 'store-08', name: 'Loja Jacarepaguá', city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9468, lon: -43.3514 },
  { id: 'store-09', name: 'Loja Contagem', city: 'Contagem', uf: 'MG', lat: -19.9321, lon: -44.0538 },
  { id: 'store-10', name: 'Loja BH Pampulha', city: 'Belo Horizonte', uf: 'MG', lat: -19.8526, lon: -43.9681 },
  { id: 'store-11', name: 'Loja Curitiba', city: 'Curitiba', uf: 'PR', lat: -25.4510, lon: -49.2498 },
  { id: 'store-12', name: 'Loja Porto Alegre', city: 'Porto Alegre', uf: 'RS', lat: -30.0045, lon: -51.1520 },
  { id: 'store-13', name: 'Loja Campinas', city: 'Campinas', uf: 'SP', lat: -22.9086, lon: -47.0587 },
  { id: 'store-14', name: 'Loja Salvador', city: 'Salvador', uf: 'BA', lat: -12.9777, lon: -38.4609 },
  { id: 'store-15', name: 'Loja Recife', city: 'Recife', uf: 'PE', lat: -8.1145, lon: -34.9056 },
  { id: 'store-16', name: 'Loja Guarulhos', city: 'Guarulhos', uf: 'SP', lat: -23.4637, lon: -46.5330 },
  { id: 'store-17', name: 'Loja São Bernardo', city: 'São Bernardo do Campo', uf: 'SP', lat: -23.6938, lon: -46.5650 },
  { id: 'store-18', name: 'Loja Goiânia', city: 'Goiânia', uf: 'GO', lat: -16.7160, lon: -49.2648 },
  { id: 'store-19', name: 'Loja Brasília', city: 'Brasília', uf: 'DF', lat: -15.8339, lon: -47.9218 },
  { id: 'store-20', name: 'Loja Fortaleza', city: 'Fortaleza', uf: 'CE', lat: -3.7406, lon: -38.5300 },
  { id: 'store-21', name: 'Loja Ribeirão Preto', city: 'Ribeirão Preto', uf: 'SP', lat: -21.1783, lon: -47.8210 },
  { id: 'store-22', name: 'Loja Florianópolis', city: 'Florianópolis', uf: 'SC', lat: -27.5953, lon: -48.5482 },
  { id: 'store-23', name: 'Loja Sorocaba', city: 'Sorocaba', uf: 'SP', lat: -23.5015, lon: -47.4526 },
  { id: 'store-24', name: 'Loja São José dos Campos', city: 'São José dos Campos', uf: 'SP', lat: -23.1896, lon: -45.8841 },
  { id: 'store-25', name: 'Loja Osasco', city: 'Osasco', uf: 'SP', lat: -23.5325, lon: -46.7917 },
];

/**
 * Filtra lojas da empresa por UF.
 */
export function getStoresByUF(uf: string): CompanyStore[] {
  return COMPANY_STORES.filter((s) => s.uf === uf);
}

/**
 * Filtra lojas da empresa por cidade (busca parcial, case-insensitive).
 */
export function getStoresByCity(city: string): CompanyStore[] {
  const lower = city.toLowerCase();
  return COMPANY_STORES.filter((s) => s.city.toLowerCase().includes(lower));
}

/**
 * Retorna lojas da empresa próximas a um ponto (raio em km).
 */
export function getStoresNearby(lat: number, lon: number, radiusKm = 100): CompanyStore[] {
  return COMPANY_STORES.filter((store) => {
    const dist = haversineDistance(lat, lon, store.lat, store.lon);
    return dist <= radiusKm;
  });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
