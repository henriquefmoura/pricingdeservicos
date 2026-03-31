// ========================================
// Reverse Geocoding Service — Nominatim (OSM)
// ========================================
// Uses OpenStreetMap's Nominatim API for geocoding.
// Free, no API key required. Respects usage policy (max 1 req/sec).

import { getTerritorialCache, setTerritorialCache, LOCALITIES_TTL_MS } from '../utils/territorialCache';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface GeocodingAddressResult {
  displayName: string;
  lat: number;
  lon: number;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Reverse geocode coordinates to get an address using Nominatim.
 * Results are cached to minimize API calls.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingAddressResult | null> {
  const cacheKey = `reverse_geo_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached = getTerritorialCache<GeocodingAddressResult>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=pt-BR`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PricingDeServicos/1.0' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.error) return null;

    const address = data.address ?? {};
    const result: GeocodingAddressResult = {
      displayName: data.display_name ?? '',
      lat: parseFloat(data.lat) || lat,
      lon: parseFloat(data.lon) || lon,
      road: address.road ?? address.pedestrian ?? address.highway ?? undefined,
      neighbourhood: address.neighbourhood ?? address.quarter ?? undefined,
      suburb: address.suburb ?? undefined,
      city: address.city ?? address.town ?? address.village ?? address.municipality ?? undefined,
      state: address.state ?? undefined,
      postcode: address.postcode ?? undefined,
      country: address.country ?? undefined,
    };

    setTerritorialCache(cacheKey, result, LOCALITIES_TTL_MS);
    return result;
  } catch {
    return null;
  }
}

/**
 * Search for a city by name + state and return its address information.
 * Uses Nominatim search endpoint.
 */
export async function searchCityAddress(cityName: string, uf: string): Promise<GeocodingAddressResult | null> {
  const cacheKey = `city_addr_${cityName}_${uf}`;
  const cached = getTerritorialCache<GeocodingAddressResult>(cacheKey);
  if (cached) return cached;

  try {
    const query = encodeURIComponent(`${cityName}, ${uf}, Brasil`);
    const url = `${NOMINATIM_BASE}/search?q=${query}&format=json&addressdetails=1&limit=1&accept-language=pt-BR`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PricingDeServicos/1.0' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const item = data[0];
    const address = item.address ?? {};
    const result: GeocodingAddressResult = {
      displayName: item.display_name ?? '',
      lat: parseFloat(item.lat) || 0,
      lon: parseFloat(item.lon) || 0,
      road: address.road ?? address.pedestrian ?? address.highway ?? undefined,
      neighbourhood: address.neighbourhood ?? address.quarter ?? undefined,
      suburb: address.suburb ?? undefined,
      city: address.city ?? address.town ?? address.village ?? address.municipality ?? undefined,
      state: address.state ?? undefined,
      postcode: address.postcode ?? undefined,
      country: address.country ?? undefined,
    };

    setTerritorialCache(cacheKey, result, LOCALITIES_TTL_MS);
    return result;
  } catch {
    return null;
  }
}

/**
 * Format address result into a readable string.
 */
export function formatAddress(result: GeocodingAddressResult): string {
  const parts: string[] = [];
  if (result.road) parts.push(result.road);
  if (result.neighbourhood) parts.push(result.neighbourhood);
  if (result.suburb && result.suburb !== result.neighbourhood) parts.push(result.suburb);
  if (result.city) parts.push(result.city);
  if (result.state) parts.push(result.state);
  if (result.postcode) parts.push(`CEP: ${result.postcode}`);
  return parts.join(', ');
}
