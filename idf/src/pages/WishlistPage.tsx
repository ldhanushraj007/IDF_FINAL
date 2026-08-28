import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/constants';

export default function WishlistPage() {
  const { user, requestSignIn } = useAuth();
  const { ids, toggle } = useWishlist();
  const { byId } = useCatalog();
  const { add } = useCart();

  if (!user) {
    return (
      <section className="bg-white py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[500px] mx-auto text-center">
          <Heart className="h-12 w-12 text-[#1F0505]/20 mx-auto mb-6" strokeWidth={1} />
          <h1 className="font-serif text-[36px] text-[#1F0505] leading-tight">
            Your Wishlist
          </h1>
          <p className="mt-4 text-[14px] text-[#1F0505]/50">
            Sign in to save your favourite fabrics and access your wishlist from any device.
          </p>
          <button
            type="button"
            onClick={requestSignIn}
            className="btn btn-dark btn-sheen mt-8"
          >
            Sign In
          </button>
        </div>
      </section>
    );
  }

  const wishlistItems = Array.from(ids)
    .map(id => byId(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];

  if (wishlistItems.length === 0) {
    return (
      <section className="bg-white py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[500px] mx-auto text-center">
          <Heart className="h-12 w-12 text-[#1F0505]/20 mx-auto mb-6" strokeWidth={1} />
          <h1 className="font-serif text-[36px] text-[#1F0505] leading-tight">
            Your Wishlist is Empty
          </h1>
          <p className="mt-4 text-[14px] text-[#1F0505]/50">
            Start exploring our collection and save the fabrics you love.
          </p>
          <Link to="/shop" className="btn btn-dark btn-sheen mt-8">
            Explore the Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[#FFE6E9] py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="font-serif text-[36px] md:text-[48px] text-[#1F0505] leading-tight">
            Your Wishlist
          </h1>
          <p className="mt-2 text-[13px] text-[#1F0505]/40">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</p>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {wishlistItems.map(item => (
              <article key={item.id} className="flex flex-col bg-white border border-[#1F0505]/6 group">
                <Link to={`/shop/product/${item.id}`} className="aspect-[3/4] overflow-hidden bg-[#f5f0ed]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </Link>
                <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
                  <span className="font-sans text-[9px] tracking-[0.18em] text-[#1F0505]/40 mb-1 uppercase font-semibold">{item.category}</span>
                  <Link to={`/shop/product/${item.id}`}>
                    <h3 className="font-serif text-[17px] text-[#1F0505] leading-snug hover:text-[#1F0505]/70 transition-colors">{item.name}</h3>
                  </Link>
                  <p className="text-[13px] font-semibold text-[#1F0505] mt-1 font-sans">{inr(item.pricePerMetre)} <span className="text-[11px] text-[#1F0505]/40 font-normal">/ metre</span></p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => { add(item.id, item.minMetres); }}
                      disabled={item.stock === 'out'}
                      className="flex-1 btn btn-dark !py-2 !px-3 !text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="flex items-center justify-center w-10 border border-[#1F0505]/15 text-[#1F0505]/40 hover:text-red-500 hover:border-red-500/30 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
