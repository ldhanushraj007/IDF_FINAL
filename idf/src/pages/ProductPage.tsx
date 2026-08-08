import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Minus, Plus, ShoppingBag, Zap } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { inr, waLink } from '../lib/constants';
import StockBadge from '../components/StockBadge';
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

  const related = useMemo(() => {
    if (!item) return [];
    return items.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 3);
  }, [items, item]);

  // Catalog hasn't finished its first load yet — avoid flashing "not found".
  if (loading && !item) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ivory">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-walnut/20 border-t-gold" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
        <p className="font-serif text-2xl text-ink">This fabric isn't available anymore</p>
        <p className="text-[14px] text-muted">It may have sold out and been removed from the shop.</p>
        <Link to="/#shop" className="btn btn-ghost-dark mt-2">
          <ChevronLeft className="h-4 w-4" />
          Back to the shop
        </Link>
      </div>
    );
  }

  const soldOut = item.stock === 'out';

  const buyNow = () => {
    add(item.id, metres);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-ivory pb-20 pt-24 sm:pt-28">
      <div className="container-lux">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* ---------- Gallery ---------- */}
          <div>
            <motion.div
              key={gallery[activeImage]}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-[3px] bg-chocolate/5"
            >
              <img
                src={gallery[activeImage]}
                alt={item.name}
                className={`aspect-[4/5] w-full object-cover ${soldOut ? 'grayscale-[0.5] opacity-80' : ''}`}
              />
              <div className="absolute left-3 top-3">
                <StockBadge stock={item.stock} />
              </div>
              {item.mrp && !soldOut && (
                <div className="absolute right-3 top-3 rounded-full bg-maroon px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory">
                  Save {inr(item.mrp - item.pricePerMetre)}
                </div>
              )}
            </motion.div>

            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show photo ${i + 1}`}
                    className={`overflow-hidden rounded-[2px] ring-1 transition-all ${
                      activeImage === i ? 'ring-2 ring-gold-dark' : 'ring-walnut/15 hover:ring-walnut/35'
                    }`}
                  >
                    <img src={src} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Details ---------- */}
          <div className="lg:pt-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold-dark">{item.category}</p>
            <h1 className="mt-2 font-serif text-3xl leading-snug text-ink sm:text-4xl">{item.name}</h1>

            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="font-nums text-3xl font-semibold text-gold-dark">{inr(item.pricePerMetre)}</span>
              <span className="text-[13px] text-muted">/ metre</span>
              {item.mrp && <span className="text-[13px] text-muted line-through">{inr(item.mrp)}</span>}
            </div>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/75">
              {item.details || item.blurb}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-walnut/12 py-5 text-[13px] sm:max-w-md">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Composition</dt>
                <dd className="mt-1 text-ink">{item.composition || '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Width</dt>
                <dd className="mt-1 text-ink">{item.width}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Minimum order</dt>
                <dd className="mt-1 text-ink">{item.minMetres} metres</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Availability</dt>
                <dd className="mt-1 text-ink">
                  {item.stock === 'in' ? 'In stock' : item.stock === 'low' ? 'Only a few metres left' : 'Unavailable'}
                </dd>
              </div>
            </dl>

            {soldOut ? (
              <div className="mt-6 max-w-md space-y-2.5">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-[2px] border border-walnut/20 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted"
                >
                  Unavailable right now
                </button>
                <a
                  href={waLink(`Hello! Please notify me when "${item.name}" is back in stock.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-1 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark hover:text-gold"
                >
                  Notify me when back →
                </a>
              </div>
            ) : (
              <div className="mt-6 max-w-md space-y-3.5">
                <div className="flex items-center justify-between rounded-[2px] border border-walnut/20 px-2">
                  <button
                    type="button"
                    aria-label="Decrease metres"
                    onClick={() => setMetres((m) => Math.max(item.minMetres, m - 1))}
                    className="flex h-12 w-12 items-center justify-center text-ink/70 transition-colors hover:text-gold-dark"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-[14px] tracking-wide text-ink">
                    {metres} <span className="text-muted">metres</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Increase metres"
                    onClick={() => setMetres((m) => m + 1)}
                    className="flex h-12 w-12 items-center justify-center text-ink/70 transition-colors hover:text-gold-dark"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-center text-[13px] text-muted">
                  Line total <span className="font-semibold text-ink">{inr(item.pricePerMetre * metres)}</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => add(item.id, metres)} className="btn btn-ghost-dark">
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </button>
                  <button type="button" onClick={buyNow} className="btn btn-gold btn-sheen">
                    <Zap className="h-4 w-4" />
                    Buy Now
                  </button>
                </div>
                <p className="text-center text-[10px] uppercase tracking-[0.16em] text-muted">
                  Cut to order · min {item.minMetres} m
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Recommendations & Related ---------- */}
        <FrequentlyViewedTogether currentProduct={item} />
        <RecentlyViewed excludeId={item.id} />

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-ink">More from {item.category}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => (
                <div key={r.id} className="rounded-[3px] bg-night">
                  <ProductCard item={r} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
