import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas. ' +
      'Verifique as env vars no ambiente de deploy (Vercel → Settings → Environment Variables → marcar Preview).'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/** Returns true when the Supabase client is properly configured. */
export function isSupabaseConfigured(): boolean {
  return true;
}
