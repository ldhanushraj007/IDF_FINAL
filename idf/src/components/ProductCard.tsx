import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Item, Tag } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/constants';

function getBadge(item: Item): { label: string; dark?: boolean } | null {
  if (item.tags.includes('new-arrival' as Tag))  return { label: 'New' };
  if (item.tags.includes('best-seller' as Tag))  return { label: 'Best Seller', dark: true };
  if (item.tags.includes('festival' as Tag))     return { label: 'Offer' };
  if (item.stock === 'low')                       return { label: 'Limited' };
  return null;
}

interface ProductCardProps {
  item: Item;
  onQuickView?: (item: Item) => void;
}

export default function ProductCard({ item, onQuickView }: ProductCardProps) {
  const { enabled, user, requestSignIn } = useAuth();
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const soldOut = item.stock === 'out';
  const liked   = has(item.id);
  const badge   = getBadge(item);
  const hasDiscount = item.mrp && item.mrp > item.pricePerMetre;
  const discountPct = hasDiscount
    ? Math.round(100 - (item.pricePerMetre / item.mrp!) * 100)
    : 0;

  const onHeart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { requestSignIn(); return; }
    toggle(item.id);
  };

  const onAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (soldOut) return;
    add(item.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article
      className={`flex flex-col h-full bg-white group ${soldOut ? 'opacity-60' : ''}`}
      aria-label={item.name}
    >
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-[#f5f0ed]"
        style={{ borderBottom: '1px solid #1F0505' }}
      >
        <Link to={`/shop/product/${item.id}`} className="block w-full h-full" tabIndex={soldOut ? -1 : 0}>
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Halftone grain on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(31,5,5,0.07) 1px, transparent 1px)',
            backgroundSize: '5px 5px',
          }}
        />

        {/* Stock badge — top left */}
        <div className="absolute top-3 left-3">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 font-sans text-[9px] font-bold tracking-[0.1em] uppercase bg-white ${
              soldOut ? 'text-red-600' : 'text-[#1F0505]'
            }`}
            style={{ border: '1px solid #1F0505' }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {soldOut ? 'Out of Stock' : 'In Stock'}
          </span>
        </div>

        {/* Badge — top right area, pushed left of the wishlist heart */}
        {badge && !soldOut && (
          <span
            className={`absolute top-3 right-12 sm:right-10 px-2.5 py-1 font-sans text-[8px] sm:text-[9px] font-bold tracking-[0.1em] uppercase ${
              badge.dark ? 'bg-[#1F0505] text-white' : 'bg-[#FFE6E9] text-[#1F0505]'
            }`}
            style={{ border: '1px solid #1F0505' }}
          >
            {badge.label}
          </span>
        )}

        {/* Discount % */}
        {hasDiscount && !soldOut && (
          <span
            className="absolute bottom-3 left-3 bg-[#1F0505] text-white px-2 py-0.5 font-sans text-[9px] font-bold tracking-[0.08em]"
          >
            -{discountPct}%
          </span>
        )}

        {/* Wishlist button */}
        {enabled && (
          <button
            type="button"
            onClick={onHeart}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={liked}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white hover:bg-[#FFE6E9] transition-colors z-10"
            style={{ border: '1px solid rgba(31,5,5,0.25)' }}
          >
            <Heart
              className={`h-4 w-4 transition-all ${liked ? 'fill-[#1F0505] text-[#1F0505]' : 'text-[#1F0505]/50'}`}
              strokeWidth={1.5}
            />
          </button>
        )}

        {/* Quick View overlay on hover */}
        {onQuickView && !soldOut && (
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView(item); }}
            className="absolute inset-x-0 bottom-0 py-3 bg-white/95 font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[#1F0505] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
            style={{ borderTop: '1px solid #1F0505' }}
          >
            Quick View
          </button>
        )}
      </div>

      {/* ── Info ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 bg-white">
        {/* Category kicker */}
        <span className="font-sans text-[7.5px] sm:text-[8px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-bold mb-1 block">
          {item.category}
        </span>

        {/* Product name */}
        <Link to={`/shop/product/${item.id}`}>
          <h3 className="font-serif text-[14px] sm:text-[17px] text-[#1F0505] leading-tight sm:leading-snug hover:text-[#1F0505]/70 transition-colors mb-1.5 line-clamp-2">
            {item.name}
          </h3>
        </Link>

        {/* Blurb (optional short description) */}
        {item.blurb && (
          <p className="font-sans text-[10px] sm:text-[11px] text-[#1F0505]/50 leading-snug sm:leading-relaxed line-clamp-2 mb-2 hidden sm:block">
            {item.blurb}
          </p>
        )}

        {/* Price row */}
        <div
          className="flex items-baseline gap-1.5 sm:gap-2 pt-2 sm:pt-3 mt-auto"
          style={{ borderTop: '1px solid rgba(31,5,5,0.12)' }}
        >
          <span className="font-serif text-[15px] sm:text-[18px] font-medium text-[#1F0505]">
            {inr(item.pricePerMetre)}
          </span>
          <span className="font-sans text-[8.5px] sm:text-[9px] text-[#1F0505]/35 tracking-wide">/&nbsp;m</span>
          {hasDiscount && (
            <span className="font-sans text-[9px] sm:text-[10px] text-[#1F0505]/30 line-through ml-auto">
              {inr(item.mrp!)}
            </span>
          )}
        </div>

        {/* Add to cart / CTA */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={soldOut}
          className={`mt-3 w-full py-3 sm:py-2.5 font-sans text-[10px] sm:text-[10px] font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] ${
            soldOut
              ? 'text-[#1F0505]/25 cursor-not-allowed'
              : added
              ? 'bg-[#1F0505] text-white'
              : 'text-[#1F0505] hover:bg-[#1F0505] hover:text-white'
          }`}
          style={{ border: '1px solid #1F0505' }}
        >
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
          {soldOut ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
