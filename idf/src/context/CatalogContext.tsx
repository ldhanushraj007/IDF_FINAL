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
     * File-based catalog, refreshed periodically.
     * NEAR-REAL-TIME WITHOUT A BACKEND: this site has no server to push
     * changes to an open tab, so instead it quietly re-checks catalog.json
     * every 45s. A customer already browsing gets the shop's price/stock
     * change within under a minute, with no reload and no visible loading
     * state — it just becomes true next time this fires. It's not instant
     * push, but it's close, and it costs nothing to run.
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
