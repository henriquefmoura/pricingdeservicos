/**
 * Approvals API – Supabase CRUD for price approval workflow.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbApproval, DbPriceAdjustment } from '../../lib/database.types';

export async function fetchApprovals(plaza?: string): Promise<DbApproval[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  let query = supabase.from('approvals').select('*').order('requested_at', { ascending: false });
  if (plaza) query = query.eq('plaza', plaza);
  const { data, error } = await query;
  if (error) { console.error('[ApprovalsAPI] fetch error:', error.message); return null; }
  return data as unknown as DbApproval[];
}

export async function insertApproval(
  approval: Omit<DbApproval, 'id' | 'status' | 'requested_at'>
): Promise<DbApproval | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('approvals')
    .insert(approval as never)
    .select()
    .single();
  if (error) { console.error('[ApprovalsAPI] insert error:', error.message); return null; }
  return data as unknown as DbApproval;
}

export async function updateApprovalStatus(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  comments?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('approvals')
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      comments: comments ?? null,
    } as never)
    .eq('id', id);
  if (error) { console.error('[ApprovalsAPI] update error:', error.message); return false; }
  return true;
}

export async function updateApprovalAfterAdjustment(
  id: string,
  proposedRepasse: number,
  proposedVenda: number,
  proposedMargem: number,
  variation: number,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('approvals')
    .update({
      status: 'approved',
      proposed_repasse: proposedRepasse,
      proposed_venda: proposedVenda,
      proposed_margem: proposedMargem,
      variation,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq('id', id);
  if (error) { console.error('[ApprovalsAPI] adjustment update error:', error.message); return false; }
  return true;
}

export async function insertAdjustmentLog(
  entry: Omit<DbPriceAdjustment, 'id'>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('price_adjustment_log')
    .insert(entry as never);
  if (error) { console.error('[ApprovalsAPI] adjustment log error:', error.message); return false; }
  return true;
}

export async function fetchAdjustmentLog(): Promise<DbPriceAdjustment[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('price_adjustment_log')
    .select('*')
    .order('adjusted_at', { ascending: false });
  if (error) { console.error('[ApprovalsAPI] fetch log error:', error.message); return null; }
  return data as unknown as DbPriceAdjustment[];
}
