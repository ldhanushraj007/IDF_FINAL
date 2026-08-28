import { useState, useMemo } from 'react';
import { Plus, Check, ShoppingBag } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/constants';
import type { Item } from '../data/catalog';

/**
 * Bundle offer type — manually defined since the catalog doesn't have
 * bundle data in the current schema. This component renders a "Complete
 * the Look" panel on the product page.
 */
export interface BundleItem {
  productId: string;
  role: string;
  metres: number;
}

export interface BundleDef {
  title: string;
  description: string;
  discountPercent: number;
  items: BundleItem[];
}

interface Props {
  currentProduct: Item;
}

/**
 * SAMPLE bundles — ideally these come from the catalog/admin, but for now
 * they're seeded here so the feature works out of the box.
 */
const SAMPLE_BUNDLES: BundleDef[] = [
  // Empty for now — add bundles here when the admin panel supports them
];

export default function BundleOffer({ currentProduct }: Props) {
  const { byId } = useCatalog();
  const { add } = useCart();

  // Find a bundle that includes the current product
  const activeBundle = useMemo(() => {
    return SAMPLE_BUNDLES.find((b) => {
      const containsCurrent = b.items.some((i) => i.productId === currentProduct.id);
      if (!containsCurrent) return false;

      const allInStock = b.items.every((bi) => {
        const item = byId(bi.productId);
        return item && item.stock !== 'out';
      });

      return allInStock;
    });
  }, [currentProduct, byId]);

  if (!activeBundle) return null;

  return <BundleCard bundle={activeBundle} byId={byId} />;
}

function BundleCard({
  bundle,
  byId,
}: {
  bundle: BundleDef;
  byId: (id: string) => Item | undefined;
}) {
  const { add } = useCart();

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    bundle.items.forEach((i) => {
      initial[i.productId] = true;
    });
    return initial;
  });

  const toggleItem = (productId: string) => {
    setSelected((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const allSelected = bundle.items.every((i) => selected[i.productId]);
  const selectedItems = bundle.items.filter((i) => selected[i.productId]);

  const calculations = useMemo(() => {
    let subtotal = 0;
    for (const bi of selectedItems) {
      const it = byId(bi.productId);
      if (it) {
        subtotal += it.pricePerMetre * bi.metres;
      }
    }

    const discount = allSelected ? Math.round((subtotal * bundle.discountPercent) / 100) : 0;
    const total = subtotal - discount;
    const saved = discount;

    return { subtotal, discount, total, saved };
  }, [selectedItems, allSelected, bundle.discountPercent, byId]);

  const handleAddToCart = () => {
    if (selectedItems.length === 0) return;
    for (const bi of selectedItems) {
      add(bi.productId, bi.metres);
    }
  };

  return (
    <section className="mt-16 sm:mt-20 border-t border-[#1F0505]/8 pt-10" aria-label="Curated Fabric Bundle">
      <div className="mb-8">
        <span className="kicker-dark">Complete the Look</span>
        <h3 className="font-serif text-[24px] md:text-[32px] leading-tight text-[#1F0505] mt-2" style={{ letterSpacing: '-0.02em' }}>
          {bundle.title}
        </h3>
        <p className="mt-2 text-[14px] text-[#1F0505]/50 max-w-xl">{bundle.description}</p>
        <span className="mt-4 block h-px w-full bg-[#1F0505]/8" aria-hidden="true" />
      </div>

      <div className="border border-[#1F0505]/10 bg-[#FFE6E9]/20 p-6 sm:p-8">
        {/* Fabric visual strip joined by + marks */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {bundle.items.map((bi, idx) => {
            const item = byId(bi.productId);
            if (!item) return null;
            const isChecked = Boolean(selected[bi.productId]);

            return (
              <div key={bi.productId} className="flex items-center gap-4 sm:gap-6">
                <div
                  onClick={() => toggleItem(bi.productId)}
                  className={`cursor-pointer border transition-colors p-3 w-40 sm:w-48 ${
                    isChecked ? 'border-[#1F0505] bg-white' : 'border-[#1F0505]/10 bg-transparent opacity-60'
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f0ed]">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center justify-center h-5 w-5 border border-[#1F0505] bg-white text-[#1F0505]">
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1F0505]/50 block">
                      {bi.role}
                    </span>
                    <p className="font-serif text-[13px] font-medium text-[#1F0505] truncate mt-0.5">{item.name}</p>
                    <p className="font-nums text-[12px] text-[#1F0505]/40 mt-1">
                      {bi.metres}m @ {inr(item.pricePerMetre)}/m
                    </p>
                  </div>
                </div>

                {idx < bundle.items.length - 1 && (
                  <Plus className="h-5 w-5 text-[#1F0505]/30 shrink-0 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>

        {/* Pricing Summary & Discount Statement */}
        <div className="mt-8 border-t border-[#1F0505]/8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-nums text-3xl font-semibold text-[#1F0505]">{inr(calculations.total)}</span>
              {allSelected && calculations.saved > 0 && (
                <span className="font-nums text-lg text-[#1F0505]/30 line-through">
                  {inr(calculations.subtotal)}
                </span>
              )}
              {allSelected && calculations.saved > 0 && (
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1F0505] border border-[#1F0505]/20 px-2 py-0.5">
                  Save {inr(calculations.saved)} ({bundle.discountPercent}% off)
                </span>
              )}
            </div>

            {!allSelected && (
              <p className="mt-2 text-[12px] text-[#1F0505]/40 font-sans">
                Full bundle discount applies when all items are selected. Individual metres calculated at regular price.
              </p>
            )}
            {allSelected && (
              <p className="mt-2 text-[12px] text-[#1F0505]/60 font-sans font-medium">
                Bundle pricing includes {bundle.discountPercent}% off the combined fabric lengths.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={selectedItems.length === 0}
            className="btn btn-dark flex items-center justify-center gap-2 !px-8 !py-4 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Add Selected to Cart ({selectedItems.length})</span>
          </button>
        </div>
      </div>
    </section>
  );
}
