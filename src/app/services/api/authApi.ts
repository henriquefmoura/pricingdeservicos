/**
 * Auth API – wraps Supabase Auth for signup / login / logout / session.
 *
 * When Supabase is not configured the module does nothing and the authStore
 * continues to work in offline / mock mode.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { UserRole } from '../../lib/database.types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plaza: string | null;
}

/**
 * Sign up a new user via Supabase Auth and store role metadata.
 * Only call this from the master admin panel.
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  plaza: string | null,
): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        user_role: role,
        user_plaza: plaza,
      },
    },
  });

  if (error || !data.user) {
    console.error('[AuthAPI] signUp error:', error?.message);
    return null;
  }

  // Upsert into public.users so the profile is immediately available
  await supabase.from('users').upsert({
    id: data.user.id,
    email,
    name,
    role,
    plaza,
  } as never);

  return { id: data.user.id, email, name, role, plaza };
}

/**
 * Sign in with email + password. Returns the user profile on success.
 */
export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    console.error('[AuthAPI] signIn error:', error?.message);
    return null;
  }

  const meta = data.user.user_metadata ?? {};

  return {
    id: data.user.id,
    email: data.user.email ?? email,
    name: (meta.name as string) ?? email,
    role: (meta.user_role as UserRole) ?? 'user',
    plaza: (meta.user_plaza as string) ?? null,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  await supabase.auth.signOut();
}

/**
 * Get the currently authenticated user (from session / cookie).
 * Returns null when there is no session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? '',
    name: (meta.name as string) ?? user.email ?? '',
    role: (meta.user_role as UserRole) ?? 'user',
    plaza: (meta.user_plaza as string) ?? null,
  };
}

/**
 * Listen for auth state changes (login / logout / token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  if (!isSupabaseConfigured() || !supabase) {
    return { unsubscribe: () => {} };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    const meta = session.user.user_metadata ?? {};
    callback({
      id: session.user.id,
      email: session.user.email ?? '',
      name: (meta.name as string) ?? session.user.email ?? '',
      role: (meta.user_role as UserRole) ?? 'user',
      plaza: (meta.user_plaza as string) ?? null,
    });
  });

  return { unsubscribe: () => data.subscription.unsubscribe() };
}
