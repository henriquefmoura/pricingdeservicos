/**
 * Notifications API – Supabase CRUD + realtime for notifications.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbNotification } from '../../lib/database.types';

export async function fetchNotifications(): Promise<DbNotification[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[NotificationsAPI] fetch error:', error.message); return null; }
  return data as unknown as DbNotification[];
}

export async function insertNotification(
  notification: Omit<DbNotification, 'id' | 'created_at'>
): Promise<DbNotification | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification as never)
    .select()
    .single();
  if (error) { console.error('[NotificationsAPI] insert error:', error.message); return null; }
  return data as unknown as DbNotification;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true } as never)
    .eq('id', id);
  if (error) { console.error('[NotificationsAPI] mark read error:', error.message); return false; }
  return true;
}

export async function markAllNotificationsRead(
  role: string,
  plaza?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  let query = supabase
    .from('notifications')
    .update({ read: true } as never)
    .eq('to_role', role)
    .eq('read', false);
  if (plaza) query = query.eq('to_plaza', plaza);
  const { error } = await query;
  if (error) { console.error('[NotificationsAPI] mark all read error:', error.message); return false; }
  return true;
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) { console.error('[NotificationsAPI] delete error:', error.message); return false; }
  return true;
}

/**
 * Subscribe to realtime notifications inserts.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  callback: (notification: DbNotification) => void,
) {
  if (!isSupabaseConfigured() || !supabase) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        callback(payload.new as DbNotification);
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
