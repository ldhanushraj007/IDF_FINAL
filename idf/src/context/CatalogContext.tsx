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
import { DEFAULT_CATEGORIES, type CategoryConfig } from '../lib/categories';
import { DEFAULT_COMBOS, fetchCategories, fetchCombos, type ComboDeal } from '../lib/adminApi';

interface CatalogValue {
  items: Item[];
  /** Only what a customer can actually buy right now. */
  available: Item[];
  offer: Offer;
  byId: (id: string) => Item | undefined;
  loading: boolean;
  origin: CatalogOrigin;
  updatedAt?: string;
  categories: CategoryConfig[];
  activeCategories: CategoryConfig[];
  combos: ComboDeal[];
  activeCombos: ComboDeal[];
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
  const [categories, setCategories] = useState<CategoryConfig[]>(() => {
    try {
      const cached = localStorage.getItem('idf_categories_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_CATEGORIES;
  });
  const [combos, setCombos] = useState<ComboDeal[]>(() => {
    try {
      const cached = localStorage.getItem('idf_combos_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_COMBOS;
  });

  const refreshCategories = () => {
    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  };

  const refreshCombos = () => {
    fetchCombos().then((c) => {
      if (c && c.length > 0) setCombos(c);
    });
  };

  useEffect(() => {
    refreshCategories();
    refreshCombos();

    const onCatsUpdate = () => refreshCategories();
    const onCombosUpdate = () => refreshCombos();
    const onCatalogUpdate = (e: any) => {
      if (e.detail?.items && Array.isArray(e.detail.items)) {
        setItems(e.detail.items);
      }
      if (e.detail?.offer) {
        setOffer(e.detail.offer);
      }
    };

    window.addEventListener('idf_categories_updated', onCatsUpdate);
    window.addEventListener('idf_combos_updated', onCombosUpdate);
    window.addEventListener('idf_catalog_updated', onCatalogUpdate);
    return () => {
      window.removeEventListener('idf_categories_updated', onCatsUpdate);
      window.removeEventListener('idf_combos_updated', onCombosUpdate);
      window.removeEventListener('idf_catalog_updated', onCatalogUpdate);
    };
  }, []);

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
      if (document.visibilityState === 'visible') {
        refresh(false);
        refreshCategories();
        refreshCombos();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const value = useMemo<CatalogValue>(() => {
    // Exclude products marked hidden (Not Live) from customer website view
    const liveItems = items.filter((i) => !i.hidden);
    const map = new Map(liveItems.map((i) => [i.id, i]));
    const activeCategories = categories.filter((c) => c.active !== false);
    const activeCombos = combos.filter((c) => c.active !== false);

    return {
      items: liveItems,
      available: liveItems.filter((i) => i.stock !== 'out'),
      offer,
      byId: (id: string) => map.get(id),
      loading,
      origin,
      updatedAt,
      categories,
      activeCategories,
      combos,
      activeCombos,
    };
  }, [items, offer, loading, origin, updatedAt, categories, combos]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
