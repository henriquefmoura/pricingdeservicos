// ========================================
// Leroy Merlin Store Data
// ========================================
// Dados das lojas Leroy Merlin no Brasil para exibição no mapa territorial.

import type { LeroyStore } from '../types/territorial';

export const LEROY_MERLIN_STORES: LeroyStore[] = [
  { id: 'lm-01', name: 'Leroy Merlin Interlagos', city: 'São Paulo', uf: 'SP', lat: -23.6785, lon: -46.6797 },
  { id: 'lm-02', name: 'Leroy Merlin Marginal Tietê', city: 'São Paulo', uf: 'SP', lat: -23.5137, lon: -46.6582 },
  { id: 'lm-03', name: 'Leroy Merlin Morumbi', city: 'São Paulo', uf: 'SP', lat: -23.6239, lon: -46.7003 },
  { id: 'lm-04', name: 'Leroy Merlin Aricanduva', city: 'São Paulo', uf: 'SP', lat: -23.5613, lon: -46.5087 },
  { id: 'lm-05', name: 'Leroy Merlin Raposo Tavares', city: 'São Paulo', uf: 'SP', lat: -23.5887, lon: -46.7809 },
  { id: 'lm-06', name: 'Leroy Merlin Niterói', city: 'Niterói', uf: 'RJ', lat: -22.8833, lon: -43.1040 },
  { id: 'lm-07', name: 'Leroy Merlin Barra da Tijuca', city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9992, lon: -43.3654 },
  { id: 'lm-08', name: 'Leroy Merlin Jacarepaguá', city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9468, lon: -43.3514 },
  { id: 'lm-09', name: 'Leroy Merlin Contagem', city: 'Contagem', uf: 'MG', lat: -19.9321, lon: -44.0538 },
  { id: 'lm-10', name: 'Leroy Merlin BH Pampulha', city: 'Belo Horizonte', uf: 'MG', lat: -19.8526, lon: -43.9681 },
  { id: 'lm-11', name: 'Leroy Merlin Curitiba', city: 'Curitiba', uf: 'PR', lat: -25.4510, lon: -49.2498 },
  { id: 'lm-12', name: 'Leroy Merlin Porto Alegre', city: 'Porto Alegre', uf: 'RS', lat: -30.0045, lon: -51.1520 },
  { id: 'lm-13', name: 'Leroy Merlin Campinas', city: 'Campinas', uf: 'SP', lat: -22.9086, lon: -47.0587 },
  { id: 'lm-14', name: 'Leroy Merlin Salvador', city: 'Salvador', uf: 'BA', lat: -12.9777, lon: -38.4609 },
  { id: 'lm-15', name: 'Leroy Merlin Recife', city: 'Recife', uf: 'PE', lat: -8.1145, lon: -34.9056 },
  { id: 'lm-16', name: 'Leroy Merlin Guarulhos', city: 'Guarulhos', uf: 'SP', lat: -23.4637, lon: -46.5330 },
  { id: 'lm-17', name: 'Leroy Merlin São Bernardo', city: 'São Bernardo do Campo', uf: 'SP', lat: -23.6938, lon: -46.5650 },
  { id: 'lm-18', name: 'Leroy Merlin Goiânia', city: 'Goiânia', uf: 'GO', lat: -16.7160, lon: -49.2648 },
  { id: 'lm-19', name: 'Leroy Merlin Brasília', city: 'Brasília', uf: 'DF', lat: -15.8339, lon: -47.9218 },
  { id: 'lm-20', name: 'Leroy Merlin Fortaleza', city: 'Fortaleza', uf: 'CE', lat: -3.7406, lon: -38.5300 },
  { id: 'lm-21', name: 'Leroy Merlin Ribeirão Preto', city: 'Ribeirão Preto', uf: 'SP', lat: -21.1783, lon: -47.8210 },
  { id: 'lm-22', name: 'Leroy Merlin Florianópolis', city: 'Florianópolis', uf: 'SC', lat: -27.5953, lon: -48.5482 },
  { id: 'lm-23', name: 'Leroy Merlin Sorocaba', city: 'Sorocaba', uf: 'SP', lat: -23.5015, lon: -47.4526 },
  { id: 'lm-24', name: 'Leroy Merlin São José dos Campos', city: 'São José dos Campos', uf: 'SP', lat: -23.1896, lon: -45.8841 },
  { id: 'lm-25', name: 'Leroy Merlin Osasco', city: 'Osasco', uf: 'SP', lat: -23.5325, lon: -46.7917 },
];

/**
 * Filtra lojas Leroy Merlin por UF.
 */
export function getLeroyStoresByUF(uf: string): LeroyStore[] {
  return LEROY_MERLIN_STORES.filter((s) => s.uf === uf);
}

/**
 * Filtra lojas Leroy Merlin por cidade (busca parcial, case-insensitive).
 */
export function getLeroyStoresByCity(city: string): LeroyStore[] {
  const lower = city.toLowerCase();
  return LEROY_MERLIN_STORES.filter((s) => s.city.toLowerCase().includes(lower));
}

/**
 * Retorna lojas Leroy Merlin próximas a um ponto (raio em km).
 */
export function getLeroyStoresNearby(lat: number, lon: number, radiusKm = 100): LeroyStore[] {
  return LEROY_MERLIN_STORES.filter((store) => {
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
