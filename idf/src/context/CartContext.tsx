import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Item } from '../data/catalog';
import { useCatalog } from './CatalogContext';
import { ORDER, BULK } from '../lib/constants';
import { trackInteraction } from '../lib/useTrackInteraction';

export interface CartLine {
  id: string;
  metres: number;
}

interface CartValue {
  lines: CartLine[];
  items: { item: Item; metres: number; lineTotal: number }[];
  count: number;
  distinctProducts: number;
  totalMetres: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isWholesale: boolean;
  isBulkOrder: boolean;
  add: (id: string, metres: number) => void;
  addMultiple: (entries: { id: string; metres: number }[]) => void;
  setMetres: (id: string, metres: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartCtx = createContext<CartValue | null>(null);
const STORAGE_KEY = 'idlf_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  // Prices and stock come from the LIVE catalog, so a cart left open overnight
  // reprices itself against today's numbers instead of yesterday's.
  const { byId, activeCombos } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines]);

  const add = useCallback((id: string, metres: number) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) {
        return prev.map((l) => (l.id === id ? { ...l, metres: l.metres + metres } : l));
      }
      return [...prev, { id, metres }];
    });
    trackInteraction(id, 'add_to_cart');
    setOpen(true);
  }, []);

  const addMultiple = useCallback((entries: { id: string; metres: number }[]) => {
    setLines((prev) => {
      let next = [...prev];
      for (const entry of entries) {
        const found = next.find((l) => l.id === entry.id);
        if (found) {
          next = next.map((l) => (l.id === entry.id ? { ...l, metres: l.metres + entry.metres } : l));
        } else {
          next.push({ id: entry.id, metres: entry.metres });
        }
        trackInteraction(entry.id, 'add_to_cart');
      }
      return next;
    });
    setOpen(true);
  }, []);

  const setMetres = useCallback((id: string, metres: number) => {
    setLines((prev) =>
      metres <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, metres } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const items = lines.flatMap((l) => {
      const item = byId(l.id);
      if (!item || item.stock === 'out') return [];
      return [{ item, metres: l.metres, lineTotal: item.pricePerMetre * l.metres }];
    });

    const distinctProducts = items.length;
    const totalMetres = items.reduce((s, i) => s + i.metres, 0);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

    // Bulk order detection:
    // distinctProducts >= 4 OR totalMetres >= 16
    const isBulkOrder =
      distinctProducts >= BULK.distinctProductsThreshold ||
      totalMetres >= BULK.totalMetresThreshold;

    // 1. Tiered Bulk Quantity Discount (20m -> 15%, 50m -> 20%, 100m -> 25%)
    let bulkDiscountRate = 0;
    if (totalMetres >= 100) {
      bulkDiscountRate = 0.25;
    } else if (totalMetres >= 50) {
      bulkDiscountRate = 0.20;
    } else if (totalMetres >= 20) {
      bulkDiscountRate = 0.15;
    }
    const bulkDiscount = Math.round(subtotal * bulkDiscountRate);

    // 2. Dynamic Combo Offer Detection
    let maxComboDiscount = 0;
    const cartProductIds = new Set(items.map(i => i.item.id));

    if (activeCombos && activeCombos.length > 0) {
      for (const combo of activeCombos) {
        if (!combo.productIds || combo.productIds.length < 2) continue;
        const allPresent = combo.productIds.every(pid => cartProductIds.has(pid));
        if (allPresent) {
          const comboLineTotal = items
            .filter(i => combo.productIds.includes(i.item.id))
            .reduce((sum, i) => sum + i.lineTotal, 0);
          const currentComboDiscount = Math.round(comboLineTotal * (combo.discountPercent / 100));
          if (currentComboDiscount > maxComboDiscount) {
            maxComboDiscount = currentComboDiscount;
          }
        }
      }
    } else {
      // Fallback Seeded Combo: "aurelia-tulle" and "noor-organza"
      const hasTulle = items.some(i => i.item.id === 'aurelia-tulle');
      const hasOrganza = items.some(i => i.item.id === 'noor-organza');
      if (hasTulle && hasOrganza) {
        const eligibleTotal = items
          .filter(i => i.item.id === 'aurelia-tulle' || i.item.id === 'noor-organza')
          .reduce((sum, i) => sum + i.lineTotal, 0);
        maxComboDiscount = Math.round(eligibleTotal * 0.10);
      }
    }

    // Apply whichever discount is larger (not stacking them to keep margins safe)
    const discount = Math.max(bulkDiscount, maxComboDiscount);
    const isWholesale = totalMetres >= 20;

    const afterDiscount = subtotal - discount;
    const shipping =
      afterDiscount === 0 || afterDiscount >= ORDER.freeShippingAbove ? 0 : ORDER.shippingFlat;

    return {
      lines,
      items,
      count: items.length,
      distinctProducts,
      totalMetres,
      subtotal,
      discount,
      shipping,
      total: afterDiscount + shipping,
      isWholesale,
      isBulkOrder,
      add,
      addMultiple,
      setMetres,
      remove,
      clear,
      open,
      setOpen,
    };
  }, [lines, open, add, addMultiple, setMetres, remove, clear, byId]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
