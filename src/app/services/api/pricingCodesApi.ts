/**
 * Pricing Codes API – Supabase CRUD for pricing codes and per-plaza prices.
 *
 * Falls back gracefully when Supabase is not configured (returns null).
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbPricingCode, DbPricingPrice } from '../../lib/database.types';

// ─── Pricing Codes ──────────────────────────────────────────────────────────

export async function fetchPricingCodes(): Promise<DbPricingCode[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('pricing_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[PricingCodesAPI] fetch error:', error.message); return null; }
  return data as unknown as DbPricingCode[];
}

export async function insertPricingCode(
  code: Omit<DbPricingCode, 'id' | 'created_at' | 'status'>
): Promise<DbPricingCode | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('pricing_codes')
    .insert(code as never)
    .select()
    .single();
  if (error) { console.error('[PricingCodesAPI] insert error:', error.message); return null; }
  return data as unknown as DbPricingCode;
}

export async function insertPricingCodes(
  codes: Omit<DbPricingCode, 'id' | 'created_at' | 'status'>[]
): Promise<DbPricingCode[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('pricing_codes')
    .insert(codes as never[])
    .select();
  if (error) { console.error('[PricingCodesAPI] batch insert error:', error.message); return null; }
  return data as unknown as DbPricingCode[];
}

export async function deletePricingCode(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('pricing_codes').delete().eq('id', id);
  if (error) { console.error('[PricingCodesAPI] delete error:', error.message); return false; }
  return true;
}

export async function updatePricingCodeStatus(id: string, status: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('pricing_codes').update({ status } as never).eq('id', id);
  if (error) { console.error('[PricingCodesAPI] status update error:', error.message); return false; }
  return true;
}

// ─── Pricing Prices ─────────────────────────────────────────────────────────

export async function fetchPricesForCode(codeId: string): Promise<DbPricingPrice[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('pricing_prices')
    .select('*')
    .eq('code_id', codeId);
  if (error) { console.error('[PricingCodesAPI] fetch prices error:', error.message); return null; }
  return data as unknown as DbPricingPrice[];
}

export async function fetchAllPrices(): Promise<DbPricingPrice[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase.from('pricing_prices').select('*');
  if (error) { console.error('[PricingCodesAPI] fetch all prices error:', error.message); return null; }
  return data as unknown as DbPricingPrice[];
}

export async function upsertPrice(
  codeId: string,
  plaza: string,
  repasse: number,
  venda: number,
  margem: number,
  preenchidoPor: string,
): Promise<DbPricingPrice | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('pricing_prices')
    .upsert(
      {
        code_id: codeId,
        plaza,
        repasse,
        venda,
        margem,
        preenchido_por: preenchidoPor,
        preenchido_em: new Date().toISOString(),
      } as never,
      { onConflict: 'code_id,plaza' },
    )
    .select()
    .single();
  if (error) { console.error('[PricingCodesAPI] upsert price error:', error.message); return null; }
  return data as unknown as DbPricingPrice;
}
