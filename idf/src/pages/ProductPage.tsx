import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Truck, ShieldCheck } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { inr, waLink } from '../lib/constants';
import ProductCard from '../components/ProductCard';
import FrequentlyViewedTogether from '../components/recommendations/FrequentlyViewedTogether';
import RecentlyViewed from '../components/recommendations/RecentlyViewed';
import { useTrackProductView } from '../lib/useTrackInteraction';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, byId, loading } = useCatalog();
  const { add, setOpen } = useCart();

  const item = id ? byId(id) : undefined;
  const [activeImage, setActiveImage] = useState(0);
  const [metres, setMetres] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'care' | 'shipping'>('description');

  useTrackProductView(item?.id);

  useEffect(() => {
    setActiveImage(0);
    if (item) setMetres(item.minMetres);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [item]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.gallery && item.gallery.length ? item.gallery : [item.image];
  }, [item]);

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

        {/* Row 04+05: Bottom cross-sell */}
        <div className="flex flex-col xl:flex-row w-full border-b border-[#1a1a1a]">
          {/* Complete The Look */}
          <div className="w-full xl:w-1/3 flex flex-col p-6 border-r border-[#1a1a1a] relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">04</span>
            <div className="mt-8 flex justify-between items-center mb-4">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary">COMPLETE THE LOOK</h3>
              <span className="border border-[#1a1a1a]/20 px-2 py-0.5 text-[9px] font-label-caps tracking-widest text-secondary uppercase">CURATED BUNDLE</span>
            </div>
            <h4 className="font-serif text-[20px] mb-1">{item.name.split(' ').slice(0, 2).join(' ')} Set</h4>
            <p className="text-[12px] text-secondary mb-5">Perfectly paired for a timeless look.</p>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 flex flex-col gap-1.5">
                <img className="w-full aspect-square object-cover border border-[#1a1a1a]/15" src={item.image} alt="" />
                <span className="font-label-caps text-[9px] text-secondary">Main Fabric</span>
              </div>
              <span className="text-secondary text-lg">+</span>
              <div className="w-16 flex flex-col gap-1.5">
                <img className="w-full aspect-square object-cover border border-[#1a1a1a]/15" src="/images/fabrics/f02.jpg" alt="" />
                <span className="font-label-caps text-[9px] text-secondary">Lining</span>
              </div>
            </div>
            <div className="bg-[#F7F5F0] p-4 flex flex-col gap-1.5 mt-auto mb-4">
              <div className="flex justify-between text-[12px] text-secondary line-through">
                <span>Individual Total</span>
                <span>{inr(item.pricePerMetre * 2 + 1500)}</span>
              </div>
              <div className="flex justify-between font-serif text-[18px] text-primary">
                <span>Bundle Total</span>
                <span>{inr(Math.round((item.pricePerMetre * 2 + 1500) * 0.85))}</span>
              </div>
              <p className="text-[11px] text-green-700 mt-1">You save 15%</p>
            </div>
            <button
              type="button"
              onClick={() => { add(item.id, 2); add('fabric-f02', 2); }}
              className="w-full border border-[#1a1a1a] py-2.5 flex items-center justify-center gap-2 font-label-caps text-[11px] tracking-widest text-primary hover:bg-primary hover:text-white transition-colors uppercase"
            >
              ADD ALL TO CART
            </button>
          </div>

          {/* You May Also Like */}
          <div className="w-full xl:w-[40%] flex flex-col p-6 border-r border-[#1a1a1a] relative">
            <span className="absolute top-4 left-4 font-mono text-[10px] text-secondary/50">04</span>
            <div className="mt-8 mb-5 flex justify-between items-center">
              <h3 className="font-label-caps text-[11px] tracking-widest text-primary">YOU MAY ALSO LIKE</h3>
              <Link to="/#shop" className="text-[11px] text-secondary hover:text-primary flex items-center gap-1">View all →</Link>
            </div>
            <FrequentlyViewedTogether currentProduct={item} />
          </div>

          {/* Recently Viewed */}
          <div className="w-full xl:flex-1 flex flex-col p-6 relative">
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
