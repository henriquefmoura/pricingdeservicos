/**
 * Governance / Activity Logs API – Supabase CRUD.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbActivityLog } from '../../lib/database.types';

export async function fetchActivityLogs(): Promise<DbActivityLog[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[GovernanceAPI] fetch error:', error.message); return null; }
  return data as unknown as DbActivityLog[];
}

export async function insertActivityLog(
  log: Omit<DbActivityLog, 'id' | 'created_at'>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('activity_logs')
    .insert(log as never);
  if (error) { console.error('[GovernanceAPI] insert error:', error.message); return false; }
  return true;
}
