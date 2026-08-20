import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import type { Item } from '../data/catalog';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { inr } from '../lib/constants';

export default function ProductCard({ item }: { item: Item }) {
  const { add } = useCart();
  const { enabled, user, requestSignIn } = useAuth();
  const { has, toggle } = useWishlist();
  const soldOut = item.stock === 'out';
  const liked = has(item.id);

  const onHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { requestSignIn(); return; }
    toggle(item.id);
  };

  return (
    <article className={`border-r border-[#1a1a1a] flex flex-col h-full last:border-r-0 bg-surface group ${soldOut ? 'opacity-80' : ''}`}>
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-[#DEDAD5]">
        <Link to={`/product/${item.id}`} className="block w-full h-full">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* IN STOCK / OUT badge */}
        <div className="absolute top-4 left-4 bg-white px-2 py-1 font-label-caps text-[10px] flex items-center gap-1.5 border border-[#1a1a1a]/20">
          <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-black'}`} />
          <span>{soldOut ? 'OUT OF STOCK' : 'IN STOCK'}</span>
        </div>

        {/* Wishlist */}
        {enabled && (
          <button
            type="button"
            onClick={onHeart}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={liked}
            className="absolute top-4 right-4 text-secondary hover:text-brand-gold transition-colors z-10"
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-brand-gold text-brand-gold' : ''}`} strokeWidth={1.5} />
          </button>
        )}

        {/* Gold vertical hairline indicator (right edge) */}
        <div className="absolute right-4 top-1/4 bottom-1/4 flex flex-col items-center gap-1 pointer-events-none">
          <div className="flex-1 w-px bg-[#1a1a1a]/25" />
          <div className="w-1 h-5 bg-brand-gold" />
          <div className="flex-1 w-px bg-[#1a1a1a]/25" />
        </div>
      </div>

      {/* Card info */}
      <div className="px-5 pt-4 pb-5 flex-1 flex flex-col border-t border-[#1a1a1a] bg-surface">
        <span className="font-label-caps text-[10px] tracking-[0.15em] text-brand-gold mb-1 uppercase">{item.category}</span>
        <Link to={`/product/${item.id}`}>
          <h3 className="font-serif text-[20px] text-primary mb-1 hover:text-brand-gold transition-colors leading-snug">
            {item.name}
          </h3>
        </Link>
        <p className="text-[15px] font-semibold text-primary mb-4">
          {inr(item.pricePerMetre)} <span className="text-[12px] text-secondary font-normal">/ metre</span>
        </p>

        <Link
          to={`/product/${item.id}`}
          className="mt-auto border border-[#1a1a1a] w-full py-2.5 font-label-caps text-[11px] tracking-widest hover:bg-primary hover:text-white transition-colors flex justify-center items-center gap-2 uppercase"
        >
          QUICK VIEW
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
