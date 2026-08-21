import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Truck, ShieldCheck, ShoppingCart, Package, Tag } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { inr, waLink } from '../lib/constants';
import FrequentlyViewedTogether from '../components/recommendations/FrequentlyViewedTogether';
import RecentlyViewed from '../components/recommendations/RecentlyViewed';
import { useTrackProductView } from '../lib/useTrackInteraction';

// --- Bundle add-ons (always appear in the "Complete the Look" panel) --------
const FIXED_ADDONS = [
  { key: 'lining',  label: 'Lining',             metres: 2.5, pricePerMetre: 600, image: '/images/fabrics/f02.jpg' },
  { key: 'border',  label: 'Embroidered Border',  metres: 2.5, pricePerMetre: 800, image: '/images/fabrics/f03.jpg' },
  { key: 'tassels', label: 'Tassels',             metres: 1,   pricePerMetre: 500, image: '/images/fabrics/f04.jpg' },
] as const;

// --- Bulk order tiers -------------------------------------------------------
const BULK_TIERS = [
  { label: 'Sample',    metres: 1,  desc: 'Single metre sample',  badge: '' },
  { label: 'Outfit',    metres: 5,  desc: 'Full outfit (5 m)',    badge: '' },
  { label: 'Wholesale', metres: 20, desc: '20 m+ → 15% off',     badge: 'BEST VALUE' },
  { label: 'Boutique',  metres: 50, desc: '50 m+ → 15% off',     badge: '' },
] as const;

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, byId, loading } = useCatalog();
  const { add, setOpen } = useCart();

  const item = id ? byId(id) : undefined;
  const [activeImage, setActiveImage] = useState(0);
  const [metres, setMetres] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'care' | 'shipping'>('description');

  // Bundle item selection (true = included in bundle)
  const [bundleSelected, setBundleSelected] = useState<Record<string, boolean>>({
    main: true, lining: true, border: true, tassels: false,
  });

  useTrackProductView(item?.id);

  useEffect(() => {
    setActiveImage(0);
    if (item) setMetres(item.minMetres);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setBundleSelected({ main: true, lining: true, border: true, tassels: false });
  }, [item]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.gallery && item.gallery.length ? item.gallery : [item.image];
  }, [item]);

  // Bundle pricing
  const bundlePricing = useMemo(() => {
    if (!item) return null;
    const mainCost = bundleSelected.main ? item.pricePerMetre * 2.5 : 0;
    const addonCost = FIXED_ADDONS.reduce((sum, a) =>
      sum + (bundleSelected[a.key] ? a.pricePerMetre * a.metres : 0), 0);
    const individualTotal = mainCost + addonCost;
    if (individualTotal === 0) return null;
    const discount = 0.15;
    const bundleTotal = Math.round(individualTotal * (1 - discount));
    return { individualTotal, bundleTotal, savings: individualTotal - bundleTotal };
  }, [item, bundleSelected]);

  if (loading && !item) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a]/20 border-t-brand-gold" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="font-serif text-2xl text-primary">This fabric isn't available anymore</p>
        <p className="text-[14px] text-secondary">It may have sold out and been removed from the shop.</p>
        <Link to="/#shop" className="flex items-center gap-1.5 mt-2 font-label-caps text-[11px] tracking-wider text-secondary hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to the shop
        </Link>
      </div>
    );
  }

  const soldOut = item.stock === 'out';
  const lineTotal = item.pricePerMetre * metres;

  const buyNow = () => {
    add(item.id, metres);
    setOpen(true);
  };

  const handleAddBundle = () => {
    if (bundleSelected.main) add(item.id, 2.5);
    setOpen(true);
  };

  return (
    <div className="w-full flex flex-row bg-surface">
      {/* Left sidebar — PRODUCT label */}
      <aside className="hidden md:flex flex-col w-12 border-r border-[#1a1a1a] shrink-0 pt-8 items-center">
        <span className="font-mono text-[10px] text-secondary/50 mb-auto">02</span>
        <div className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase [writing-mode:vertical-rl] rotate-180 mb-8">
          PRODUCT
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Row 02: Breadcrumb */}
        <div className="py-4 px-6 border-b border-[#1a1a1a] flex items-center">
          <span className="index-badge">02</span>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 font-label-caps text-[11px] tracking-widest text-secondary hover:text-primary transition-colors uppercase ml-6"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Shop
          </button>
        </div>

        {/* Row 03: 3-column product detail */}
        <div className="flex flex-col lg:flex-row border-b border-[#1a1a1a]">

          {/* Col A — Image gallery */}
          <div className="w-full lg:w-[45%] flex flex-col border-r border-[#1a1a1a] p-5 gap-3">
            {/* Main image */}
            <div className="relative w-full aspect-[4/3] bg-[#DEDAD5] overflow-hidden">
              <img
                src={gallery[activeImage]}
                alt={item.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${soldOut ? 'grayscale-[0.4] opacity-80' : ''}`}
              />
              {/* Stock badge */}
              <div className="absolute top-4 left-4 bg-white px-2 py-1 font-label-caps text-[10px] flex items-center gap-1.5 border border-[#1a1a1a]/20">
                <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-black'}`} />
                {soldOut ? 'OUT OF STOCK' : 'IN STOCK'}
              </div>
              {/* Image counter */}
              <div className="absolute top-4 right-4 font-mono text-[11px] text-white bg-black/40 px-2 py-0.5">
                {String(activeImage + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
              </div>
              {/* Gold hairline indicator */}
              <div className="absolute right-4 top-1/4 bottom-1/4 flex flex-col items-center pointer-events-none">
                <div className="flex-1 w-px bg-white/30" />
                <div className="w-0.5 h-6 bg-brand-gold" />
                <div className="flex-1 w-px bg-white/30" />
              </div>
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 h-20">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`bg-[#DEDAD5] overflow-hidden border transition-all ${
                      activeImage === i ? 'border-[#1a1a1a]' : 'border-transparent opacity-55 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Col B — Product info */}
          <div className="w-full lg:flex-1 flex flex-col p-8 border-r border-[#1a1a1a] gap-6">
            {/* Name & Price */}
            <div>
              <span className="font-label-caps text-[10px] tracking-[0.15em] text-brand-gold uppercase">{item.category}</span>
              <h1 className="font-serif text-[32px] md:text-[38px] text-primary leading-tight mt-1 mb-3">{item.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[28px] text-brand-gold font-bold">{inr(item.pricePerMetre)}</span>
                <span className="text-[13px] text-secondary">/ metre</span>
                {item.mrp && <span className="text-[13px] text-secondary line-through ml-2">{inr(item.mrp)}</span>}
              </div>
              <p className="text-[14px] text-secondary mt-3 leading-relaxed">{item.blurb}</p>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-6 py-5 border-y border-[#1a1a1a]">
              <div>
                <span className="font-label-caps text-[10px] tracking-widest text-secondary block mb-1">COMPOSITION</span>
                <span className="text-[13px] text-primary">{item.composition || '100% Pure Fabric'}</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] tracking-widest text-secondary block mb-1">WIDTH</span>
                <span className="text-[13px] text-primary">{item.width}</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] tracking-widest text-secondary block mb-1">MINIMUM ORDER</span>
                <span className="text-[13px] text-primary">{item.minMetres} metres</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] tracking-widest text-secondary block mb-1">AVAILABILITY</span>
                <span className="text-[13px] text-primary flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-green-600'}`} />
                  {soldOut ? 'Unavailable' : 'In stock'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex gap-5 border-b border-[#1a1a1a] pb-0 mb-4">
                {([
                  { id: 'description', label: 'DESCRIPTION' },
                  { id: 'details', label: 'DETAILS' },
                  { id: 'care', label: 'CARE' },
                  { id: 'shipping', label: 'SHIPPING & RETURNS' },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`font-label-caps text-[10px] tracking-widest pb-3 -mb-px border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === t.id ? 'text-brand-gold border-brand-gold' : 'text-secondary hover:text-primary border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-secondary leading-relaxed min-h-[60px]">
                {activeTab === 'description' && (item.details || item.blurb)}
                {activeTab === 'details' && 'Premium weave density, color-fastness guaranteed. Directly sourced from active artisan clusters.'}
                {activeTab === 'care' && 'Dry clean only. Iron on reverse low heat. Store wrapped in soft muslin cloth.'}
                {activeTab === 'shipping' && 'Standard delivery across India takes 3–7 business days. Express shipping options available at checkout.'}
              </p>
            </div>
          </div>

          {/* Col C — Purchase panel (right column) */}
          <div className="w-full lg:w-[220px] shrink-0 flex flex-col p-6 gap-5 border-t lg:border-t-0">
            {soldOut ? (
              <>
                <button disabled className="w-full border border-secondary text-secondary py-3 font-label-caps text-[11px] tracking-widest cursor-not-allowed uppercase">
                  Unavailable
                </button>
                <a
                  href={waLink(`Hello! Please notify me when "${item.name}" is back in stock.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-[11px] font-semibold tracking-wider text-brand-gold hover:underline"
                >
                  Notify me when back →
                </a>
              </>
            ) : (
              <>
                <div>
                  <span className="font-label-caps text-[10px] tracking-widest text-secondary block mb-3">SELECT LENGTH</span>
                  <div className="flex items-center gap-3">
                    <div className="flex border border-[#1a1a1a] h-10">
                      <button
                        type="button"
                        onClick={() => setMetres((m) => Math.max(item.minMetres, m - 1))}
                        className="w-10 flex items-center justify-center hover:bg-surface-variant transition-colors border-r border-[#1a1a1a]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex-grow flex items-center justify-center font-mono text-[15px] text-primary min-w-[40px]">{metres}</span>
                      <button
                        type="button"
                        onClick={() => setMetres((m) => m + 1)}
                        className="w-10 flex items-center justify-center hover:bg-surface-variant transition-colors border-l border-[#1a1a1a]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-[12px] text-secondary">metres</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => add(item.id, metres)}
                  className="w-full border border-[#1a1a1a] py-3 font-label-caps text-[11px] tracking-widest text-primary hover:bg-primary hover:text-white transition-colors uppercase"
                >
                  ADD TO CART
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  className="w-full bg-brand-gold text-white py-3 font-label-caps text-[11px] tracking-widest hover:bg-brand-gold/90 transition-opacity uppercase"
                >
                  BUY NOW
                </button>

                <p className="text-center text-[11px] text-secondary">
                  Line total <span className="font-semibold text-primary">{inr(lineTotal)}</span>
                </p>

                <div className="border-t border-[#1a1a1a]/10 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-[12px] text-secondary">
                    <Truck className="h-4 w-4 shrink-0" /> Ships across India
                  </div>
                  <div className="flex items-center gap-2.5 text-[12px] text-secondary">
                    <ShieldCheck className="h-4 w-4 shrink-0" /> Secure payments via UPI
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ======================================================
            Row 04 — Complete the Look | Bulk Orders | You May Also Like | Recently Viewed
            ====================================================== */}
        <div className="flex flex-col xl:flex-row w-full border-b border-[#1a1a1a]">

          {/* ---- COMPLETE THE LOOK (Curated Bundle) ---- */}
          <div className="w-full xl:w-[36%] flex flex-col p-6 border-r border-[#1a1a1a] relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">04</span>

            <div className="mt-8 flex justify-between items-center mb-1">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary">COMPLETE THE LOOK</h3>
              <span className="border border-[#1a1a1a]/20 px-2 py-0.5 text-[9px] font-label-caps tracking-widest text-secondary uppercase">CURATED BUNDLE</span>
            </div>
            <h4 className="font-serif text-[20px] mb-1">{item.name.split(' ').slice(0, 2).join(' ')} Elegance Set</h4>
            <p className="text-[12px] text-secondary mb-5">Perfectly paired for a timeless evening look.</p>

            {/* Bundle items with checkboxes */}
            <div className="flex items-start gap-2 mb-5 flex-wrap">
              {/* Main Fabric */}
              <label className="flex flex-col items-center gap-1.5 w-[64px] cursor-pointer">
                <div className="relative w-full">
                  <input
                    type="checkbox"
                    checked={bundleSelected.main}
                    onChange={(e) => setBundleSelected((s) => ({ ...s, main: e.target.checked }))}
                    className="absolute top-1 right-1 z-10 accent-brand-gold w-3 h-3"
                  />
                  <img
                    className={`w-full aspect-square object-cover border transition-all ${bundleSelected.main ? 'border-[#1a1a1a]' : 'border-[#1a1a1a]/15 opacity-40'}`}
                    src={item.image}
                    alt=""
                  />
                </div>
                <span className="font-label-caps text-[9px] text-secondary text-center leading-tight">Main Fabric<br/>2.5 m</span>
              </label>

              <span className="text-secondary text-base mt-4">+</span>

              {FIXED_ADDONS.map((addon, idx) => (
                <div key={addon.key} className="flex items-start gap-1">
                  {idx > 0 && <span className="text-secondary text-base mt-4">+</span>}
                  <label className="flex flex-col items-center gap-1.5 w-[64px] cursor-pointer">
                    <div className="relative w-full">
                      <input
                        type="checkbox"
                        checked={bundleSelected[addon.key] ?? false}
                        onChange={(e) => setBundleSelected((s) => ({ ...s, [addon.key]: e.target.checked }))}
                        className="absolute top-1 right-1 z-10 accent-brand-gold w-3 h-3"
                      />
                      <img
                        className={`w-full aspect-square object-cover border transition-all ${bundleSelected[addon.key] ? 'border-[#1a1a1a]' : 'border-[#1a1a1a]/15 opacity-40'}`}
                        src={addon.image}
                        alt=""
                      />
                    </div>
                    <span className="font-label-caps text-[9px] text-secondary text-center leading-tight">
                      {addon.label}<br/>{addon.key === 'tassels' ? '1 set' : `${addon.metres} m`}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {/* Pricing summary */}
            {bundlePricing ? (
              <div className="bg-[#F7F5F0] p-4 flex flex-col gap-2 mb-4">
                <div className="flex justify-between text-[12px] text-secondary">
                  <span>INDIVIDUAL TOTAL</span>
                  <span className="line-through">{inr(bundlePricing.individualTotal)}</span>
                </div>
                <div className="flex justify-between font-serif text-[20px] text-primary">
                  <span>BUNDLE TOTAL</span>
                  <span>{inr(bundlePricing.bundleTotal)}</span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Tag className="h-2.5 w-2.5 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-[11px] text-green-700 font-semibold">
                      You save {inr(bundlePricing.savings)} (15%)
                    </p>
                    <p className="text-[10px] text-secondary/70 mt-0.5">
                      Bundle discount applies only when all items are selected.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F7F5F0] p-4 mb-4 text-[12px] text-secondary text-center">
                Select items above to see bundle pricing.
              </div>
            )}

            <button
              type="button"
              onClick={handleAddBundle}
              className="w-full border border-[#1a1a1a] py-2.5 flex items-center justify-center gap-2 font-label-caps text-[11px] tracking-widest text-primary hover:bg-primary hover:text-white transition-colors uppercase"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              ADD ALL TO CART (2.5 M EACH)
            </button>
          </div>

          {/* ---- BULK ORDER OPTIONS ---- */}
          <div className="w-full xl:w-[22%] flex flex-col p-6 border-r border-[#1a1a1a] relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">04</span>

            <div className="mt-8 mb-5">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary mb-1">BULK ORDER OPTIONS</h3>
              <p className="text-[12px] text-secondary">Order more, save more — auto-applied at checkout.</p>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {BULK_TIERS.map((tier) => {
                const tierTotal = item.pricePerMetre * tier.metres;
                const isWholesale = tier.metres >= 20;
                const discountedTotal = isWholesale ? Math.round(tierTotal * 0.85) : tierTotal;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => { setMetres(tier.metres); add(item.id, tier.metres); setOpen(true); }}
                    className="relative w-full border border-[#1a1a1a]/20 px-4 py-3 text-left hover:border-brand-gold hover:bg-brand-gold/5 transition-all group"
                  >
                    {tier.badge && (
                      <span className="absolute -top-2 right-3 bg-brand-gold text-white text-[9px] font-label-caps tracking-widest px-2 py-0.5">
                        {tier.badge}
                      </span>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label-caps text-[11px] tracking-widest text-primary group-hover:text-brand-gold transition-colors">{tier.label.toUpperCase()}</p>
                        <p className="text-[11px] text-secondary mt-0.5">{tier.desc}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {isWholesale ? (
                          <>
                            <p className="font-mono text-[11px] text-secondary line-through">{inr(tierTotal)}</p>
                            <p className="font-mono text-[13px] text-green-700 font-semibold">{inr(discountedTotal)}</p>
                          </>
                        ) : (
                          <p className="font-mono text-[13px] text-primary">{inr(tierTotal)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Wholesale note */}
            <div className="mt-4 border border-brand-gold/20 bg-brand-gold/5 p-3">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-label-caps text-[10px] tracking-widest text-brand-gold mb-1">WHOLESALE TERMS</p>
                  <p className="text-[11px] text-secondary leading-relaxed">15% off on 20 m+ orders. No code needed — applied automatically at checkout.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ---- YOU MAY ALSO LIKE ---- */}
          <div className="w-full xl:flex-1 flex flex-col p-6 border-r border-[#1a1a1a] relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">04</span>
            <div className="mt-8 mb-5 flex justify-between items-center">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary">YOU MAY ALSO LIKE</h3>
              <Link to="/#shop" className="text-[11px] text-secondary hover:text-primary flex items-center gap-1">View all →</Link>
            </div>
            <FrequentlyViewedTogether currentProduct={item} />
          </div>

          {/* ---- RECENTLY VIEWED ---- */}
          <div className="w-full xl:w-[18%] flex flex-col p-6 relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">05</span>
            <div className="mt-8 mb-5">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary">RECENTLY VIEWED</h3>
            </div>
            <RecentlyViewed excludeId={item.id} />
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="hidden md:flex flex-col w-12 border-l border-[#1a1a1a] shrink-0 pt-8 items-center">
        <span className="font-mono text-[10px] text-secondary/50">D/12</span>
      </aside>
    </div>
  );
}
