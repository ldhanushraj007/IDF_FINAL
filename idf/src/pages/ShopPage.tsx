import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { type Tag } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { BUSINESS, inr, waLink } from '../lib/constants';
import type { Item } from '../data/catalog';

type FilterType = 'all' | Tag | string;
type SortKey = 'newest' | 'best-selling' | 'price-asc' | 'price-desc' | 'featured';

const CATEGORY_FILTERS: { id: FilterType; label: string; group?: string; isCategory?: boolean }[] = [
  { id: 'all',         label: 'All Fabrics' },
  // --- Tags
  { id: 'best-seller', label: 'Best Selling',    group: 'Popular' },
  { id: 'new-arrival', label: 'New Arrivals',    group: 'Popular' },
  { id: 'festival',    label: 'Festival Offers', group: 'Popular' },
  { id: 'seasonal',    label: 'Seasonal Edit',   group: 'Popular' },
  { id: 'wholesale',   label: 'Wholesale',       group: 'Popular' },
  // --- Categories from catalog
  ...DEFAULT_CATEGORIES.map(c => ({ id: c.slug, label: c.name, group: 'Category', isCategory: true })),
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest',      label: 'Newest' },
  { id: 'best-selling',label: 'Best Selling' },
  { id: 'price-asc',   label: 'Price ↑ Low to High' },
  { id: 'price-desc',  label: 'Price ↓ High to Low' },
  { id: 'featured',    label: 'Featured' },
];

export default function ShopPage() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { items: catalog } = useCatalog();
  const { isBulkOrder, totalMetres, distinctProducts } = useCart();

  const [filter, setFilter] = useState<FilterType>(urlCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort]     = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [catOpen, setCatOpen]   = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<Item | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const catRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    if (newFilter === 'all') navigate('/shop', { replace: true });
    else navigate(`/shop/${newFilter}`, { replace: true });
  }, [navigate]);

  const items = useMemo(() => {
    let list = catalog;

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = catalog.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.composition.toLowerCase().includes(q) ||
        i.blurb.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      );
    } else if (filter !== 'all') {
      const isCat = CATEGORY_FILTERS.find(f => f.id === filter)?.isCategory;
      if (isCat) {
        list = catalog.filter(i =>
          (i.categoryId?.toLowerCase() || '') === String(filter).toLowerCase() ||
          (i.category?.toLowerCase() || '') === String(filter).toLowerCase()
        );
      } else {
        list = catalog.filter(i => i.tags.includes(filter as Tag));
      }
    }
    switch (sort) {
      case 'price-asc':   return [...list].sort((a, b) => a.pricePerMetre - b.pricePerMetre);
      case 'price-desc':  return [...list].sort((a, b) => b.pricePerMetre - a.pricePerMetre);
      case 'best-selling':return [...list].sort((a, b) => (b.tags.includes('best-seller') ? 1 : 0) - (a.tags.includes('best-seller') ? 1 : 0));
      case 'featured':    return [...list].sort((a, b) => b.tags.length - a.tags.length);
      default:            return list;
    }
  }, [filter, sort, catalog, searchQuery]);

  const activeLabel = CATEGORY_FILTERS.find(f => f.id === filter)?.label ?? 'All Fabrics';

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <section
        className="bg-white px-5 md:px-10 lg:px-12 py-8 md:py-12"
        style={{ borderBottom: '2px solid #1F0505' }}
      >
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-sans text-[9px] tracking-[0.3em] text-[#1F0505]/40 uppercase font-semibold mb-2">
              The Catalogue
            </p>
            <h1 className="font-serif text-[40px] md:text-[60px] text-[#1F0505] leading-[0.95] tracking-tight">
              Shop<br />by the metre.
            </h1>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10">
            {[
              { n: '01', label: 'Premium Fabrics' },
              { n: '02', label: 'Cut to Order' },
              { n: '03', label: 'Ships Nationwide' },
              { n: '04', label: 'Secure UPI Pay' },
            ].map(f => (
              <div key={f.n} className="flex items-start gap-2.5" style={{ borderLeft: '2px solid #1F0505', paddingLeft: '10px' }}>
                <span className="font-sans text-[8px] text-[#1F0505]/30 font-bold mt-0.5">{f.n}</span>
                <span className="font-sans text-[10px] tracking-[0.14em] text-[#1F0505] font-semibold uppercase">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bulk order banner ───────────────────────────────────────── */}
      {isBulkOrder && (
        <div
          className="bg-[#1F0505] text-white px-5 md:px-10 lg:px-12 py-4 flex flex-wrap items-center justify-between gap-4"
          style={{ borderBottom: '1px solid rgba(255,230,233,0.15)' }}
        >
          <div>
            <span className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-[#FFE6E9] block mb-0.5">
              Bulk Order Detected
            </span>
            <p className="text-[12px] text-white/60">
              {distinctProducts} fabrics · {totalMetres} m total — eligible for wholesale pricing
            </p>
          </div>
          <a
            href={waLink(`Hello IN DESIGN! Bulk enquiry — ${distinctProducts} fabrics, ${totalMetres} metres. Please share wholesale pricing.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[9px] font-bold tracking-[0.18em] uppercase bg-[#FFE6E9] text-[#1F0505] px-5 py-2.5 hover:bg-white transition-colors"
          >
            Request Bulk Pricing →
          </a>
        </div>
      )}

      {/* ── Main layout: sidebar + content ──────────────────────────── */}
      <div className="flex min-h-screen bg-white" style={{ borderTop: '1px solid #1F0505' }}>

        {/* ════════════════════════════════════════════════════════════
            LEFT SIDEBAR — Category Index (Desktop Floating Curved Card)
        ════════════════════════════════════════════════════════════ */}
        <aside
          className="hidden lg:flex flex-col w-[230px] xl:w-[250px] shrink-0 sticky top-[100px] self-start h-fit my-4 ml-5 mr-3 p-3 bg-white border border-[#1F0505]/20 rounded-2xl shadow-sm"
          aria-label="Filter by category"
        >
          {/* Sidebar header */}
          <div className="px-4 py-2.5 bg-[#1F0505] rounded-xl text-center mb-2">
            <span className="font-sans text-[9px] tracking-[0.3em] text-[#FFE6E9] uppercase font-bold">
              Browse By
            </span>
          </div>

          {/* Category list */}
          <nav className="flex flex-col gap-0.5">
            {CATEGORY_FILTERS.map((f, i) => {
              const active = filter === f.id;
              const prevGroup = i > 0 ? CATEGORY_FILTERS[i - 1].group : undefined;
              const showDivider = f.group && f.group !== prevGroup && i > 0;

              return (
                <div key={f.id}>
                  {showDivider && (
                    <div className="px-3 py-1 bg-[#FFE6E9]/60 rounded-lg text-center my-1.5 border border-[#1F0505]/10">
                      <span className="font-sans text-[8px] tracking-[0.28em] text-[#1F0505]/70 uppercase font-bold">
                        {f.group}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleFilterChange(f.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-[10px] font-bold tracking-[0.14em] uppercase transition-all duration-200 flex items-center justify-between group ${
                      active
                        ? 'bg-[#1F0505] text-white shadow-sm'
                        : 'text-[#1F0505]/80 hover:bg-[#FFE6E9]/60 hover:text-[#1F0505]'
                    }`}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span>{f.label}</span>
                    {active && <span className="text-[#FFE6E9] text-[10px]">→</span>}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-4 py-3 mt-2 border-t border-[#1F0505]/10 text-center">
            <p className="font-sans text-[8px] tracking-[0.18em] text-[#1F0505]/40 uppercase font-medium">
              {BUSINESS.city} · Est. 2009
            </p>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT CONTENT — Toolbar + Grid
        ════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* ── Mobile horizontal category tabs (Curved pills + All Categories Dropdown) ───────── */}
          <div className="lg:hidden p-3 bg-white/90 backdrop-blur-md border-b border-[#1F0505]/15 relative z-30">
            <div className="flex items-center gap-2">
              {/* Category Dropdown button */}
              <div className="relative shrink-0" ref={catRef}>
                <button
                  type="button"
                  onClick={() => setCatOpen(v => !v)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-white bg-[#1F0505] shadow-sm transition-all hover:bg-[#3a0a0a]"
                >
                  <span>Categories</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
                </button>
                {catOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 bg-white z-[60] w-64 rounded-2xl p-2 shadow-2xl border border-[#1F0505]/20 max-h-80 overflow-y-auto"
                  >
                    {CATEGORY_FILTERS.map((f, i) => {
                      const active = filter === f.id;
                      const prevGroup = i > 0 ? CATEGORY_FILTERS[i - 1].group : undefined;
                      const showDivider = f.group && f.group !== prevGroup && i > 0;
                      return (
                        <div key={f.id}>
                          {showDivider && (
                            <div className="px-3 py-1 bg-[#FFE6E9]/60 rounded-lg text-center my-1 border border-[#1F0505]/10">
                              <span className="font-sans text-[8px] tracking-[0.28em] text-[#1F0505]/70 uppercase font-bold">
                                {f.group}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => { handleFilterChange(f.id); setCatOpen(false); }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.12em] transition-all flex items-center justify-between ${
                              active
                                ? 'bg-[#1F0505] text-white shadow-sm'
                                : 'text-[#1F0505]/80 hover:bg-[#FFE6E9]/50'
                            }`}
                          >
                            <span>{f.label}</span>
                            {active && <span className="text-[#FFE6E9] text-[10px]">✓</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Horizontal Scroll Pill Row (Clean scrollbar hidden) */}
              <div className="flex-1 overflow-x-auto flex items-center gap-1.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORY_FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFilterChange(f.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full font-sans text-[10px] font-bold tracking-[0.14em] uppercase transition-all duration-200 whitespace-nowrap ${
                        active
                          ? 'bg-[#1F0505] text-white shadow-sm'
                          : 'text-[#1F0505]/70 hover:bg-[#FFE6E9]/60 bg-white border border-[#1F0505]/15'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Sort & Search toolbar ─────────────────────────────────────────── */}
          <div
            className="px-5 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3 bg-white sticky top-[44px] lg:top-[86px] z-20 border-b border-[#1F0505]/15"
          >
            {/* Active filter label */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-sans text-[11px] font-bold tracking-[0.18em] text-[#1F0505] uppercase px-4 py-1.5 rounded-full bg-[#FFE6E9]/40 border border-[#1F0505]/20">
                {activeLabel}
              </span>
              <span className="font-sans text-[10px] text-[#1F0505]/50 font-medium hidden sm:inline">
                {items.length} {items.length === 1 ? 'fabric' : 'fabrics'}
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-xs md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1F0505]/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fabrics by name or material..."
                className="w-full pl-9 pr-8 py-2 rounded-full border border-[#1F0505]/20 bg-[#FAFAFA] text-[11px] font-medium text-[#1F0505] placeholder-[#1F0505]/40 outline-none focus:border-[#1F0505] focus:bg-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1F0505]/40 hover:text-[#1F0505] text-[11px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-sans text-[10px] font-bold tracking-[0.14em] uppercase text-[#1F0505] bg-white border border-[#1F0505]/20 hover:bg-[#FFE6E9]/40 transition-all shadow-sm"
              >
                Sort: {SORT_OPTIONS.find(s => s.id === sort)?.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white z-30 w-56 rounded-2xl p-1.5 shadow-xl border border-[#1F0505]/20 overflow-hidden"
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => { setSort(o.id); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${
                        sort === o.id
                          ? 'bg-[#1F0505] text-white shadow-sm'
                          : 'text-[#1F0505]/80 hover:bg-[#FFE6E9]/50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Product Grid ─────────────────────────────────────────── */}
          <section className="flex-1 bg-white">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
                <p className="font-serif text-[28px] text-[#1F0505]">No fabrics found</p>
                <p className="font-sans text-[13px] text-[#1F0505]/40">
                  Try a different category or clear the filter.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange('all')}
                  className="font-sans text-[10px] font-bold tracking-[0.18em] uppercase px-6 py-3 text-[#1F0505] hover:bg-[#1F0505] hover:text-white transition-colors mt-2"
                  style={{ border: '2px solid #1F0505' }}
                >
                  View All Fabrics
                </button>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                style={{ borderBottom: '1px solid #1F0505' }}
              >
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      borderRight: (i % 3 !== 2) ? '1px solid #1F0505' : undefined,
                      borderBottom: '1px solid #1F0505',
                    }}
                  >
                    <ProductCard item={item} onQuickView={setQuickViewItem} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewItem && (
        <QuickViewModal item={quickViewItem} onClose={() => setQuickViewItem(null)} />
      )}
    </>
  );
}
