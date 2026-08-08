import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CATALOG, type Item } from '../data/catalog';
import {
  EMPTY_OFFER,
  loadCatalog,
  type CatalogOrigin,
  type Offer,
} from '../lib/catalogSource';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchProducts, fetchOffer } from '../lib/adminApi';

interface CatalogValue {
  items: Item[];
  /** Only what a customer can actually buy right now. */
  available: Item[];
  offer: Offer;
  byId: (id: string) => Item | undefined;
  loading: boolean;
  origin: CatalogOrigin;
  updatedAt?: string;
}

const Ctx = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Start from the bundled catalog so the page renders instantly, then swap in
  // the live one. The shop never sees an empty grid while a fetch is in flight.
  const [items, setItems] = useState<Item[]>(CATALOG);
  const [offer, setOffer] = useState<Offer>(EMPTY_OFFER);
  const [origin, setOrigin] = useState<CatalogOrigin>('bundled');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    /**
     * SUPABASE PATH: a genuine live push. When the admin publishes, this
     * fires within a second for every visitor with the page open — no
     * polling delay, no reload.
     */
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;

      const refresh = () => {
        Promise.all([fetchProducts(), fetchOffer()])
          .then(([prods, off]) => {
            if (cancelled) return;
            setItems(prods);
            setOffer(off);
            setOrigin('json'); // reuse the "freshly fetched" origin label
            setUpdatedAt(new Date().toISOString());
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      };

      refresh();

      const channel = sb
        .channel('storefront-catalog-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, refresh)
        .subscribe();

      return () => {
        cancelled = true;
        sb.removeChannel(channel);
      };
    }

    /**
     * FALLBACK PATH (no Supabase): the original file-based catalog, refreshed
     * periodically since there's no server to push from.
     */
    const refresh = (isFirstLoad: boolean) => {
      loadCatalog()
        .then((c) => {
          if (cancelled) return;
          setItems(c.items);
          setOffer(c.offer);
          setOrigin(c.origin);
          setUpdatedAt(c.updatedAt);
        })
        .finally(() => {
          if (!cancelled && isFirstLoad) setLoading(false);
        });
    };

    refresh(true);

    /**
     * NEAR-REAL-TIME WITHOUT A BACKEND: this site has no server to push
     * changes to an open tab, so instead it quietly re-checks catalog.json
     * every 45s. A customer already browsing gets the shop's price/stock
     * change within under a minute, with no reload and no visible loading
     * state — it just becomes true next time this fires. It's not instant
     * push, but it's close, and it costs nothing to run.
     */
    const interval = setInterval(() => refresh(false), 45_000);

    // Also refresh the moment someone returns to the tab, so switching back
    // after a while doesn't wait for the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh(false);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const value = useMemo<CatalogValue>(() => {
    const map = new Map(items.map((i) => [i.id, i]));
    return {
      items,
      available: items.filter((i) => i.stock !== 'out'),
      offer,
      byId: (id: string) => map.get(id),
      loading,
      origin,
      updatedAt,
    };
  }, [items, offer, loading, origin, updatedAt]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
