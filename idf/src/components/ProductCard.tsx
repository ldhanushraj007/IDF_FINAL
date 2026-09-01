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
      className={`group flex flex-col h-full bg-white border border-[#1F1916]/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${soldOut ? 'opacity-65' : ''}`}
      aria-label={item.name}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F0EB]">
        <Link to={`/shop/product/${item.id}`} className="block w-full h-full" tabIndex={soldOut ? -1 : 0}>
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badge */}
        {badge && !soldOut && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#1F1916] text-white font-sans text-[8px] font-semibold tracking-wider uppercase rounded-xs">
            {badge.label}
          </span>
        )}

        {/* Wishlist Heart Button */}
        {enabled && (
          <button
            type="button"
            onClick={onHeart}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={liked}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-[#1F1916]/60'}`}
              strokeWidth={1.5}
            />
          </button>
        )}

        {/* Quick View Button on Hover */}
        {onQuickView && !soldOut && (
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView(item); }}
            className="absolute inset-x-0 bottom-0 py-2.5 bg-white/95 text-[#1F1916] font-sans text-[9.5px] font-semibold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-t border-[#1F1916]/10"
          >
            Quick View
          </button>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-3.5 bg-white">
        <span className="font-sans text-[8px] tracking-[0.2em] text-[#1F1916]/50 uppercase font-semibold mb-1">
          {item.category}
        </span>

        <Link to={`/shop/product/${item.id}`}>
          <h3 className="font-serif text-[14px] text-[#1F1916] leading-snug hover:text-[#1F1916]/70 transition-colors line-clamp-1 font-medium mb-1">
            {item.name}
          </h3>
        </Link>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[#1F1916]/8">
          <div>
            <span className="font-sans text-[13px] font-semibold text-[#1F1916]">
              {inr(item.pricePerMetre)}
            </span>
            <span className="font-sans text-[9px] text-[#1F1916]/50 ml-0.5">/m</span>
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={soldOut}
            className={`px-3 py-1.5 rounded-md font-sans text-[9px] font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
              soldOut
                ? 'bg-[#1F1916]/10 text-[#1F1916]/30 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1F1916] text-white hover:bg-black'
            }`}
          >
            <ShoppingBag className="h-3 w-3" strokeWidth={1.5} />
            {soldOut ? 'Sold' : added ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
