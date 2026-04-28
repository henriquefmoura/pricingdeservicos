import { useEffect, useRef } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { useApprovalStore } from '../store/approvalStore';
import { useNotificationStore } from '../store/notificationStore';
import { useGovernanceStore } from '../store/governanceStore';
import { useSupportStore } from '../store/supportStore';
import { useMarketResearchStore } from '../store/marketResearchStore';

/**
 * AppInitializer – runs once on app mount.
 *
 * When Supabase is configured:
 *   1. Restores the user session from the Supabase JWT cookie.
 *   2. Syncs all stores from the backend database.
 *   3. Starts realtime subscriptions for notifications and support messages.
 *
 * When Supabase is NOT configured:
 *   Does nothing – the app continues to work in offline/localStorage mode.
 */
export function AppInitializer() {
  const didInit = useRef(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Restore Supabase session on mount
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (isSupabaseConfigured()) {
      useAuthStore.getState().restoreSession().catch((err) => {
        console.error('[AppInitializer] restoreSession failed:', err);
      });
    }
  }, []);

  // Sync stores when authenticated (and Supabase is configured)
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured()) return;

    // Fire all syncs in parallel
    Promise.all([
      usePricingCodesStore.getState().syncFromBackend(),
      useApprovalStore.getState().syncFromBackend(),
      useNotificationStore.getState().syncFromBackend(),
      useGovernanceStore.getState().syncFromBackend(),
      useSupportStore.getState().syncFromBackend(),
      useMarketResearchStore.getState().syncFromBackend(),
    ]).catch((err) => {
      console.error('[AppInitializer] sync error:', err);
    });

    // Start realtime subscriptions
    const notifSub = useNotificationStore.getState().subscribeRealtime();
    const supportSub = useSupportStore.getState().subscribeRealtime();

    return () => {
      notifSub.unsubscribe();
      supportSub.unsubscribe();
    };
  }, [isAuthenticated]);

  return null;
}
