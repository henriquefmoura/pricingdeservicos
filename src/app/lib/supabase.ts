import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Supabase client instance shared across the app.
 *
 * When the required env vars are not set (local dev without Supabase) we fall
 * back to a *null* client. Every API service must check `isSupabaseConfigured()`
 * before calling supabase – if it returns false the store continues working in
 * localStorage-only (offline) mode, exactly as before.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/** Returns true when the Supabase client is properly configured. */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
