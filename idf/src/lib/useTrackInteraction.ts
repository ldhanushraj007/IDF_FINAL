import { useEffect } from 'react';

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

/**
 * Track a product interaction. Currently saves views locally for the
 * RecentlyViewed widget. Interaction analytics (Supabase) have been removed —
 * add a lightweight analytics provider here if you need them later.
 */
export async function trackInteraction(productId: string, eventType: EventType) {
  if (!productId) return;

  // Always save view locally for fast RecentlyViewed widget
  if (eventType === 'view') {
    saveRecentlyViewed(productId);
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
