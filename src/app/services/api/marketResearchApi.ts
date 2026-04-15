/**
 * Market Research API – Supabase CRUD for competitor prices and history.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbMarketResearch, DbCompetitorPrice, DbPriceHistory } from '../../lib/database.types';

// ─── Research ───────────────────────────────────────────────────────────────

export async function fetchResearches(): Promise<(DbMarketResearch & { competitor_prices: DbCompetitorPrice[] })[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('market_research')
    .select('*, competitor_prices(*)');
  if (error) { console.error('[MarketResearchAPI] fetch error:', error.message); return null; }
  return data as unknown as (DbMarketResearch & { competitor_prices: DbCompetitorPrice[] })[];
}

export async function upsertResearch(
  codigoAvulso: string,
  descricao: string,
): Promise<DbMarketResearch | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('market_research')
    .upsert({ codigo_avulso: codigoAvulso, descricao } as never, { onConflict: 'codigo_avulso' })
    .select()
    .single();
  if (error) { console.error('[MarketResearchAPI] upsert error:', error.message); return null; }
  return data as unknown as DbMarketResearch;
}

// ─── Competitor Prices ──────────────────────────────────────────────────────

export async function insertCompetitorPrice(
  researchId: string,
  concorrente: string,
  preco: number,
  adicionadoPor: string,
): Promise<DbCompetitorPrice | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('competitor_prices')
    .insert({
      research_id: researchId,
      concorrente,
      preco,
      adicionado_por: adicionadoPor,
      adicionado_em: new Date().toISOString(),
    } as never)
    .select()
    .single();
  if (error) { console.error('[MarketResearchAPI] insert competitor price error:', error.message); return null; }
  return data as unknown as DbCompetitorPrice;
}

export async function updateCompetitorPrice(
  id: string,
  preco: number,
  adicionadoPor: string,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('competitor_prices')
    .update({
      preco,
      adicionado_por: adicionadoPor,
      adicionado_em: new Date().toISOString(),
    } as never)
    .eq('id', id);
  if (error) { console.error('[MarketResearchAPI] update competitor price error:', error.message); return false; }
  return true;
}

export async function deleteCompetitorPrice(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('competitor_prices').delete().eq('id', id);
  if (error) { console.error('[MarketResearchAPI] delete competitor price error:', error.message); return false; }
  return true;
}

// ─── Price History ──────────────────────────────────────────────────────────

export async function fetchPriceHistory(): Promise<DbPriceHistory[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) { console.error('[MarketResearchAPI] fetch history error:', error.message); return null; }
  return data as unknown as DbPriceHistory[];
}

export async function insertPriceHistory(
  entry: Omit<DbPriceHistory, 'id'>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('price_history')
    .insert(entry as never);
  if (error) { console.error('[MarketResearchAPI] insert history error:', error.message); return false; }
  return true;
}
