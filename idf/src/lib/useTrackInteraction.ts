import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

const SESSION_KEY = 'idf_session_id';
const RECENTLY_VIEWED_KEY = 'idf_recently_viewed';

export type EventType = 'view' | 'add_to_cart' | 'wishlist' | 'purchase';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function saveRecentlyViewed(productId: string) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recently viewed', e);
  }
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function trackInteraction(productId: string, eventType: EventType) {
  if (!productId) return;

  // Always save view locally for fast RecentlyViewed widget
  if (eventType === 'view') {
    saveRecentlyViewed(productId);
  }

  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    const sessionId = getSessionId();

    await supabase.from('product_interactions').insert({
      session_id: sessionId,
      user_id: userId,
      product_id: productId,
      event_type: eventType,
    });
  } catch (err) {
    // Non-blocking log failure
    console.warn('Interaction logging failed:', err);
  }
}

export async function backfillSessionUser() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const sessionId = getSessionId();
    await supabase.rpc('backfill_session_interactions', { target_session_id: sessionId });
  } catch (err) {
    console.warn('Session backfill failed:', err);
  }
}

/** Hook for automatic debounced view tracking on product pages. */
export function useTrackProductView(productId: string | undefined) {
  useEffect(() => {
    if (!productId) return;
    const key = `idf_viewed_${productId}_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return; // Deduped per session per product per day

    sessionStorage.setItem(key, '1');
    trackInteraction(productId, 'view');
  }, [productId]);
}
