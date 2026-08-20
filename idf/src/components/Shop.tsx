import { useMemo, useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { TAG_LABELS, type Tag } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { ORDER } from '../lib/constants';
import ProductCard from './ProductCard';

type Filter = 'all' | Tag;
type SortKey = 'newest' | 'price-asc' | 'price-desc';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All Fabrics' },
  { id: 'best-seller', label: 'Best Selling' },
  { id: 'new-arrival', label: 'New Arrivals' },
  { id: 'festival', label: 'Festival Offers' },
  { id: 'seasonal', label: 'Seasonal Edit' },
  { id: 'wholesale', label: 'Wholesale' },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low–High' },
  { id: 'price-desc', label: 'Price: High–Low' },
];

export default function Shop() {
  const { items: catalog } = useCatalog();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  const items = useMemo(() => {
    let list = filter === 'all' ? catalog : catalog.filter((i) => i.tags.includes(filter));
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.pricePerMetre - b.pricePerMetre);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.pricePerMetre - a.pricePerMetre);
    return list;
  }, [filter, sort, catalog]);

  return (
    <div id="shop" className="w-full">
      {/* Filters & Sorting Row (03) */}
      <section className="grid-line relative px-6 md:px-12 py-5 flex flex-wrap justify-between items-center bg-surface border-b border-[#1a1a1a] gap-y-3">
        <span className="index-badge">03</span>

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

      {/* Products Grid (04) */}
      <section className="grid-line relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-surface border-b border-[#1a1a1a]">
        <span className="index-badge z-10">04</span>
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}
