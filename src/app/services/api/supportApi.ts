/**
 * Support API – Supabase CRUD for support threads and messages.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbSupportThread, DbSupportMessage } from '../../lib/database.types';

// ─── Threads ────────────────────────────────────────────────────────────────

export async function fetchSupportThreads(): Promise<(DbSupportThread & { messages: DbSupportMessage[] })[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('support_threads')
    .select('*, support_messages(*)')
    .order('updated_at', { ascending: false });
  if (error) { console.error('[SupportAPI] fetch threads error:', error.message); return null; }
  return (data as unknown as (DbSupportThread & { support_messages: DbSupportMessage[] })[]).map(
    (t) => ({ ...t, messages: t.support_messages ?? [], support_messages: undefined }),
  ) as (DbSupportThread & { messages: DbSupportMessage[] })[];
}

export async function insertSupportThread(
  thread: Omit<DbSupportThread, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<DbSupportThread | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('support_threads')
    .insert(thread as never)
    .select()
    .single();
  if (error) { console.error('[SupportAPI] insert thread error:', error.message); return null; }
  return data as unknown as DbSupportThread;
}

export async function updateThreadStatus(id: string, status: 'open' | 'closed'): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('support_threads')
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) { console.error('[SupportAPI] update thread error:', error.message); return false; }
  return true;
}

export async function deleteSupportThread(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('support_threads').delete().eq('id', id);
  if (error) { console.error('[SupportAPI] delete thread error:', error.message); return false; }
  return true;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function insertSupportMessage(
  message: Omit<DbSupportMessage, 'id' | 'created_at'>
): Promise<DbSupportMessage | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase
    .from('support_messages')
    .insert(message as never)
    .select()
    .single();

  if (error) { console.error('[SupportAPI] insert message error:', error.message); return null; }

  // Touch the thread's updated_at
  await supabase
    .from('support_threads')
    .update({ updated_at: new Date().toISOString() } as never)
    .eq('id', message.thread_id);

  return data as unknown as DbSupportMessage;
}

export async function markMessagesRead(threadId: string, readerRole: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('support_messages')
    .update({ read: true } as never)
    .eq('thread_id', threadId)
    .neq('from_user_role', readerRole);
  if (error) { console.error('[SupportAPI] mark read error:', error.message); return false; }
  return true;
}

/**
 * Subscribe to realtime support message inserts.
 */
export function subscribeToSupportMessages(
  callback: (message: DbSupportMessage) => void,
) {
  if (!isSupabaseConfigured() || !supabase) {
    return { unsubscribe: () => {} };
  }

  const client = supabase;
  const channel = client
    .channel('support-messages-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'support_messages' },
      (payload) => {
        callback(payload.new as DbSupportMessage);
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
