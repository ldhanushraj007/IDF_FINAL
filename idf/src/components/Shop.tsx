import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { TAG_LABELS, type Tag } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { ORDER } from '../lib/constants';
import ProductCard from './ProductCard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { DEFAULT_CATEGORIES } from '../lib/categories';

type FilterType = 'all' | Tag | string; // Allow category slugs as string
type SortKey = 'newest' | 'price-asc' | 'price-desc';

const FILTERS: { id: FilterType; label: string; isCategory?: boolean }[] = [
  { id: 'all', label: 'All Fabrics' },
  { id: 'best-seller', label: 'Best Selling' },
  { id: 'new-arrival', label: 'New Arrivals' },
  { id: 'festival', label: 'Festival Offers' },
  { id: 'seasonal', label: 'Seasonal Edit' },
  { id: 'wholesale', label: 'Wholesale' },
  // Inject the categories dynamically
  ...DEFAULT_CATEGORIES.map(c => ({ id: c.slug, label: c.name, isCategory: true }))
];

const SORT_OPTIONS: { id: SortKey; label: string; }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low–High' },
  { id: 'price-desc', label: 'Price: High–Low' },
];

export default function Shop() {
  const { items: catalog } = useCatalog();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    let list = catalog;
    if (filter !== 'all') {
      const isCat = FILTERS.find(f => f.id === filter)?.isCategory;
      if (isCat) {
        list = catalog.filter((i) => {
          const itemCatLower = i.category?.toLowerCase() || '';
          const itemCatIdLower = i.categoryId?.toLowerCase() || '';
          return itemCatIdLower === String(filter).toLowerCase() || itemCatLower === String(filter).toLowerCase();
        });
      } else {
        list = catalog.filter((i) => i.tags.includes(filter as Tag));
      }
    }
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.pricePerMetre - b.pricePerMetre);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.pricePerMetre - a.pricePerMetre);
    return list;
  }, [filter, sort, catalog]);

  // Group items into rows of 4
  const rows = useMemo(() => {
    const res = [];
    for (let i = 0; i < items.length; i += 4) {
      res.push(items.slice(i, i + 4));
    }
    return res;
  }, [items]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Fallback: make all product cards immediately visible
      gsap.set('.product-card', { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Pinned filter bar (desktop only)
      ScrollTrigger.matchMedia({
        '(min-width: 768px)': function () {
          ScrollTrigger.create({
            trigger: '.shop-filter-bar',
            start: 'top top+=64', // sticky header is 64px
            endTrigger: '#shop',
            end: 'bottom bottom-=80',
            pin: true,
            pinSpacing: false,
            onEnter: () => gsap.to('.shop-filter-bar', { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderBottomColor: 'transparent', duration: 0.3 }),
            onLeaveBack: () => gsap.to('.shop-filter-bar', { boxShadow: 'none', borderBottomColor: '#1a1a1a', duration: 0.3 }),
          });
        },
      });

      // 2. Staggered card entry per row
      gsap.utils.toArray('.product-row').forEach((row: any) => {
        gsap.to(row.querySelectorAll('.product-card'), {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: row,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, containerRef);

    // Refresh ScrollTrigger since items layout changes
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [items]);

  return (
    <div id="shop" ref={containerRef} className="w-full">
      {/* Filters & Sorting Row */}
      <section className="shop-filter-bar grid-line relative px-6 md:px-12 py-5 flex flex-wrap justify-between items-center bg-surface border-b border-[#1a1a1a] gap-y-3 z-20">
        {/* Filter tabs */}
        <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar scroll-smooth">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`font-label-caps text-[11px] tracking-[0.12em] pb-1 whitespace-nowrap uppercase transition-colors duration-200 shrink-0 ${
                  active
                    ? 'text-brand-gold border-b border-brand-gold font-bold'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort + Filters */}
        <div className="flex items-center gap-3">
          {/* Sort by */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 font-label-caps text-[11px] tracking-widest uppercase text-secondary hover:text-primary transition-colors"
            >
              <span className="text-secondary/50 mr-1">SORT BY</span>
              {SORT_OPTIONS.find((s) => s.id === sort)?.label.toUpperCase()}
              <ChevronDown className="h-3 w-3" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-[#1a1a1a] z-30 w-44">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { setSort(o.id); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 font-label-caps text-[11px] uppercase tracking-wider transition-colors ${
                      sort === o.id ? 'text-brand-gold bg-brand-gold/5' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-2 border border-[#1a1a1a] px-4 py-2 font-label-caps text-[11px] tracking-widest uppercase text-secondary hover:text-primary transition-colors"
          >
            FILTERS
            <SlidersHorizontal className="h-3 w-3" />
          </button>
        </div>
      </section>

      {filter === 'wholesale' && (
        <div className="mx-auto my-6 max-w-2xl border border-brand-gold/30 bg-brand-gold/5 p-4 text-center">
          <p className="text-[13px] leading-relaxed text-secondary">
            Wholesale pricing applies automatically —{' '}
            <span className="font-semibold text-brand-gold">
              {Math.round(ORDER.wholesaleDiscount * 100)}% off
            </span>{' '}
            on total orders of {ORDER.wholesaleMinMetres} metres or more.
          </p>
        </div>
      )}

      {/* Products Grid */}
      <section className="grid-line relative bg-surface flex flex-col">
        {rows.map((rowItems, rowIndex) => (
          <div
            key={rowIndex}
            className="product-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#1a1a1a] last:border-b-0"
          >
            {rowItems.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-24 text-center text-secondary text-[14px]">
            No fabrics found matching this filter.
          </div>
        )}
      </section>
    </div>
  );
}
