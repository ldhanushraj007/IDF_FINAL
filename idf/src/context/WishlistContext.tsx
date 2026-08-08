import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchWishlistIds, toggleWishlist } from '../lib/customerApi';
import { trackInteraction } from '../lib/useTrackInteraction';

interface WishlistValue {
  ids: Set<string>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  loading: boolean;
}

const Ctx = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    fetchWishlistIds()
      .then(setIds)
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user) return; // caller is responsible for prompting sign-in first
      setIds((prev) => {
        const next = new Set(prev);
        const willBeOn = !next.has(productId);
        if (willBeOn) {
          next.add(productId);
          trackInteraction(productId, 'wishlist');
        } else {
          next.delete(productId);
        }
        toggleWishlist(productId, willBeOn);
        return next;
      });
    },
    [user],
  );

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  return <Ctx.Provider value={{ ids, has, toggle, loading }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
