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
import { ORDER } from '../lib/constants';
import { trackInteraction } from '../lib/useTrackInteraction';

export interface CartLine {
  id: string;
  metres: number;
}

interface CartValue {
  lines: CartLine[];
  items: { item: Item; metres: number; lineTotal: number }[];
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isWholesale: boolean;
  add: (id: string, metres: number) => void;
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
  const { byId } = useCatalog();
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

    const totalMetres = items.reduce((s, i) => s + i.metres, 0);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

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

    // 2. Combo Offer Detection
    // Seeded Combo: "aurelia-tulle" and "noor-organza" bought together triggers 10% off
    const hasTulle = items.some(i => i.item.id === 'aurelia-tulle');
    const hasOrganza = items.some(i => i.item.id === 'noor-organza');
    let comboDiscount = 0;
    if (hasTulle && hasOrganza) {
      const eligibleTotal = items
        .filter(i => i.item.id === 'aurelia-tulle' || i.item.id === 'noor-organza')
        .reduce((sum, i) => sum + i.lineTotal, 0);
      comboDiscount = Math.round(eligibleTotal * 0.10);
    }

    // Apply whichever discount is larger (not stacking them to keep margins safe)
    const discount = Math.max(bulkDiscount, comboDiscount);
    const isWholesale = totalMetres >= 20;

    const afterDiscount = subtotal - discount;
    const shipping =
      afterDiscount === 0 || afterDiscount >= ORDER.freeShippingAbove ? 0 : ORDER.shippingFlat;

    return {
      lines,
      items,
      count: items.length,
      subtotal,
      discount,
      shipping,
      total: afterDiscount + shipping,
      isWholesale,
      add,
      setMetres,
      remove,
      clear,
      open,
      setOpen,
    };
  }, [lines, open, add, setMetres, remove, clear, byId]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
