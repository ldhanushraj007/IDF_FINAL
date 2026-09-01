import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [maxPrice, setMaxPrice] = useState<number>(20000);
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

    // Filter by max price
    if (maxPrice < 20000) {
      list = list.filter(i => i.pricePerMetre <= maxPrice);
    }

    switch (sort) {
      case 'price-asc':   return [...list].sort((a, b) => a.pricePerMetre - b.pricePerMetre);
      case 'price-desc':  return [...list].sort((a, b) => b.pricePerMetre - a.pricePerMetre);
      case 'best-selling':return [...list].sort((a, b) => (b.tags.includes('best-seller') ? 1 : 0) - (a.tags.includes('best-seller') ? 1 : 0));
      case 'featured':    return [...list].sort((a, b) => b.tags.length - a.tags.length);
      default:            return list;
    }
  }, [filter, sort, catalog, searchQuery, maxPrice]);

  const activeLabel = CATEGORY_FILTERS.find(f => f.id === filter)?.label ?? 'All Fabrics';

  return (
    <div className="bg-[#FAF7F5] text-[#1F1916] min-h-screen">
      {/* Breadcrumb Header */}
      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-10 lg:px-12 pt-6 pb-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60">
        <a href="/" className="hover:text-[#1F1916] transition-colors">HOME</a>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#1F1916]">SHOP</span>
      </div>

      {/* ── Bridal Edit Hero Banner (Exact match to Image 4 when filter === 'bridal' or header area) ─────────────────────────────── */}
      {filter === 'bridal' ? (
        <section className="bg-[#FAF7F5] px-6 md:px-12 py-12 md:py-16 border-b border-[#1F1916]/10 relative overflow-hidden">
          <div className="max-w-[1340px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="z-10">
              <span className="font-sans text-[11px] font-bold tracking-[0.25em] text-[#1F1916]/50 uppercase block mb-3">
                BRIDAL EDIT
              </span>
              <h1 className="font-serif text-[42px] sm:text-[54px] md:text-[64px] text-[#1F1916] font-light leading-[1.05] mb-4">
                For the day<br />that begins<br />forever.
              </h1>
              <div className="w-14 h-[2px] bg-[#C5A059] mb-6" />
              <p className="text-[14px] md:text-[15px] text-[#1F1916]/75 max-w-md leading-relaxed font-sans mb-8">
                Hand-embroidered tulles, pearl organzas, and heirloom silks chosen for the most significant garment a woman will ever wear.
              </p>
              <button
                type="button"
                className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase shadow-md group"
              >
                <span>EXPLORE BRIDAL EDIT</span>
                <span className="ml-3 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>

            {/* Right Blended Image Container */}
            <div className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] border border-[#1F1916]/10">
              <img
                src="/images/collections/bridal.jpg"
                alt="Bridal Organza Fabric with Cherry Blossom"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/fabrics/f01.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5]/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>
      ) : null}

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

      {/* ── Main layout: sidebar + content (Exact match to Image 3) ──────────────────────────── */}
      <div className="flex min-h-screen bg-[#FAF7F5]">

        {/* ════════════════════════════════════════════════════════════
            LEFT SIDEBAR — Category, Colour & Price Filters (Matching Image 3)
        ════════════════════════════════════════════════════════════ */}
        <aside
          className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-[#1F1916]/10 p-8 sticky top-[80px] h-fit"
          aria-label="Filter sidebar"
        >
          {/* Breadcrumb Header on Top Left */}
          <div className="text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60 mb-8">
            <Link to="/" className="hover:text-[#1F1916] transition-colors">HOME</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-[#1F1916]">SHOP</span>
          </div>

          <span className="font-sans text-[10px] font-bold tracking-[0.25em] uppercase text-[#1F1916]/40 mb-4 block">
            FILTER BY
          </span>

          {/* Category List */}
          <div className="mb-8">
            <h4 className="font-sans text-[11px] font-bold tracking-[0.18em] uppercase text-[#1F1916] mb-3">
              CATEGORY
            </h4>
            <nav className="flex flex-col space-y-2">
              {[
                { id: 'all', label: 'All Fabrics' },
                { id: 'bridal', label: 'Bridal' },
                { id: 'heritage', label: 'Heritage Weaves' },
                { id: 'silks', label: 'Silks' },
                { id: 'organza', label: 'Organza' },
                { id: 'tulle', label: 'Tulle' },
                { id: 'brocades', label: 'Brocades' },
                { id: 'embroidered', label: 'Embroidered' },
                { id: 'couture', label: 'Couture' },
              ].map((cat) => {
                const active = filter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFilterChange(cat.id)}
                    className={`text-left font-sans text-[12px] transition-colors ${
                      active ? 'font-bold text-[#1F1916]' : 'text-[#1F1916]/60 hover:text-[#1F1916]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Price Range Slider (Interactive) */}
          <div>
            <h4 className="font-sans text-[11px] font-bold tracking-[0.18em] uppercase text-[#1F1916] mb-3">
              PRICE
            </h4>
            <div className="flex items-center justify-between text-[11px] font-sans text-[#1F1916]/70 mb-2">
              <span>₹0</span>
              <span className="font-semibold text-[#1F1916]">
                {maxPrice >= 20000 ? '₹20,000+' : `Up to ₹${maxPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#1F1916] cursor-pointer"
            />
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT CONTENT — Toolbar + 3-Column Grid
        ════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1F1916]/10">
            <h1 className="font-serif text-[28px] md:text-[34px] font-light text-[#1F1916] uppercase tracking-wide">
              SHOP ALL
            </h1>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 font-sans text-[11px] tracking-[0.15em] uppercase text-[#1F1916]/70 hover:text-[#1F1916] font-semibold"
              >
                <span>SORT BY {SORT_OPTIONS.find((s) => s.id === sort)?.label}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#1F1916]/10 rounded-xl shadow-lg z-30 p-1">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSort(s.id);
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 font-sans text-[11px] tracking-[0.1em] uppercase hover:bg-[#FAF7F5] rounded-lg transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                    className="absolute left-0 top-full mt-2 bg-white z-[60] w-64 max-w-[calc(100vw-2rem)] rounded-2xl p-2 shadow-2xl border border-[#1F0505]/20 max-h-80 overflow-y-auto"
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



          {/* ── Product Grid ─────────────────────────────────────────── */}
          <section className="flex-1 bg-[#FAF7F5]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 px-6 text-center">
                <p className="font-serif text-[28px] text-[#1F1916]">No fabrics found</p>
                <p className="font-sans text-[13px] text-[#1F1916]/50">
                  Try a different category or clear the filter.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange('all')}
                  className="font-sans text-[11px] font-bold tracking-[0.18em] uppercase px-6 py-3 border border-[#1F1916] text-[#1F1916] hover:bg-[#1F1916] hover:text-white transition-colors mt-2"
                >
                  View All Fabrics
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 py-4">
                {items.map((item) => (
                  <ProductCard key={item.id} item={item} onQuickView={setQuickViewItem} />
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
    </div>
  );
}
