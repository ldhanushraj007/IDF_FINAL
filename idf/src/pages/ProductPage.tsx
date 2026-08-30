import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Truck, ShieldCheck, ShoppingCart, Ruler, MessageCircle, Heart } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { inr, waLink } from '../lib/constants';
import FrequentlyViewedTogether from '../components/recommendations/FrequentlyViewedTogether';
import RecentlyViewed from '../components/recommendations/RecentlyViewed';
import { useTrackProductView } from '../lib/useTrackInteraction';
import { motion, AnimatePresence } from 'framer-motion';
import BundleOffer from '../components/BundleOffer';
import MeasurementGuide from '../components/MeasurementGuide';

type TabKey = 'description' | 'details' | 'care' | 'shipping';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { byId, loading } = useCatalog();
  const { add, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const { enabled, user, requestSignIn } = useAuth();

  const item = id ? byId(id) : undefined;
  const [activeImage, setActiveImage] = useState(0);
  const [metres, setMetres] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const lastLoadedProductId = useRef<string | null>(null);
  useTrackProductView(item?.id);

  useEffect(() => {
    setActiveImage(0);
    if (item) {
      if (lastLoadedProductId.current !== item.id) {
        setMetres(item.minMetres);
        lastLoadedProductId.current = item.id;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [item]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.gallery && item.gallery.length ? item.gallery : [item.image];
  }, [item]);

  if (loading && !item) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1F0505]/10 border-t-[#1F0505]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="font-serif text-2xl text-[#1F0505]">This fabric isn't available anymore</p>
        <p className="text-[14px] text-[#1F0505]/50">It may have sold out and been removed from the shop.</p>
        <Link to="/shop" className="btn btn-outline mt-2">
          <ChevronLeft className="h-4 w-4" /> Back to the Shop
        </Link>
      </div>
    );
  }

  const soldOut = item.stock === 'out';
  const lineTotal = item.pricePerMetre * metres;
  const liked = has(item.id);

  const handleAddToCart = () => {
    add(item.id, metres);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    add(item.id, metres);
    setOpen(true);
  };

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { requestSignIn(); return; }
    toggle(item.id);
  };

  const waProductLink = waLink(
    `Hello IN DESIGN! I'm interested in ${item.name} (${inr(item.pricePerMetre)}/m). Could you help me?`
  );

  const TABS: { id: TabKey; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'details', label: 'Details' },
    { id: 'care', label: 'Fabric Care' },
    { id: 'shipping', label: 'Shipping' },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <nav className="bg-white px-5 md:px-12 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(31,5,5,0.06)' }}
      >
        <Link to="/shop" className="text-[11px] text-[#1F0505]/40 hover:text-[#1F0505] font-sans font-medium uppercase tracking-[0.1em]">
          Shop
        </Link>
        <span className="text-[#1F0505]/20 text-[11px]">/</span>
        <span className="text-[11px] text-[#1F0505]/40 font-sans uppercase tracking-[0.1em]">{item.category}</span>
        <span className="text-[#1F0505]/20 text-[11px]">/</span>
        <span className="text-[11px] text-[#1F0505] font-sans font-medium truncate max-w-[200px]">{item.name}</span>
      </nav>

      {/* Main product section */}
      <section className="bg-white">
        <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Left — Image Gallery */}
            <div>
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f0ed] mb-3">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={gallery[activeImage]}
                    alt={item.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`w-full h-full object-cover ${soldOut ? 'grayscale-[0.4] opacity-80' : ''}`}
                  />
                </AnimatePresence>

                {/* Stock badge */}
                <div className="absolute top-4 left-4">
                  <span className={`bg-white/90 backdrop-blur-sm px-2.5 py-1 font-sans text-[9px] font-semibold tracking-[0.1em] uppercase flex items-center gap-1.5 ${soldOut ? 'text-red-600' : 'text-[#1F0505]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {soldOut ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>

                {/* Image counter */}
                {gallery.length > 1 && (
                  <div className="absolute top-4 right-4 font-sans text-[11px] text-white bg-[#1F0505]/60 px-2 py-0.5">
                    {String(activeImage + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
                  </div>
                )}

                {/* Wishlist */}
                {enabled && (
                  <button
                    type="button"
                    onClick={handleHeart}
                    aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-[#1F0505] text-[#1F0505]' : 'text-[#1F0505]/40'}`} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`aspect-square overflow-hidden border transition-all ${
                        activeImage === i ? 'border-[#1F0505]' : 'border-transparent opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Product Info */}
            <div className="flex flex-col gap-6">
              {/* Category + Name */}
              <div>
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1F0505]/40">{item.category}</span>
                <h1 className="font-serif text-[32px] md:text-[40px] text-[#1F0505] leading-tight mt-1.5">{item.name}</h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[30px] text-[#1F0505] font-medium">{inr(item.pricePerMetre)}</span>
                <span className="text-[13px] text-[#1F0505]/40">/ metre</span>
                {item.mrp && item.mrp > item.pricePerMetre && (
                  <span className="text-[13px] text-[#1F0505]/30 line-through font-sans">{inr(item.mrp)}</span>
                )}
              </div>

              {/* Spec grid */}
              <div className="grid grid-cols-2 gap-4 py-5"
                style={{ borderTop: '1px solid rgba(31,5,5,0.06)', borderBottom: '1px solid rgba(31,5,5,0.06)' }}
              >
                {[
                  { label: 'Composition', value: item.composition || '—' },
                  { label: 'Width', value: item.width },
                  { label: 'Category', value: item.category },
                  { label: 'Min. Order', value: `${item.minMetres} metres` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="font-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1F0505]/30 block mb-0.5">{label}</span>
                    <span className="text-[13px] text-[#1F0505] font-sans">{value}</span>
                  </div>
                ))}
              </div>

              {/* Quantity + Measurement Guide */}
              {!soldOut && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1F0505]/40">Quantity (metres)</span>
                    <button
                      type="button"
                      onClick={() => setShowMeasurementGuide(true)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold font-sans tracking-[0.08em] uppercase text-[#1F0505]/50 hover:text-[#1F0505] transition-colors"
                    >
                      <Ruler className="h-3.5 w-3.5" /> How much do I need?
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-[#1F0505]/15">
                      <button
                        type="button"
                        aria-label="Decrease metres"
                        onClick={() => setMetres(m => Math.max(item.minMetres, Number((m - 0.5).toFixed(1))))}
                        className="flex h-11 w-10 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="relative flex items-center border-x border-[#1F0505]/10">
                        <input
                          type="number"
                          min={item.minMetres || 0.5}
                          step="0.5"
                          value={metres}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              setMetres(val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val < (item.minMetres || 0.5)) {
                              setMetres(item.minMetres || 0.5);
                            }
                          }}
                          aria-label="Quantity in metres"
                          className="w-16 h-11 text-center font-sans text-[15px] text-[#1F0505] font-medium bg-transparent focus:outline-none focus:bg-[#1F0505]/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-3"
                        />
                        <span className="absolute right-2 font-sans text-[12px] text-[#1F0505]/40 pointer-events-none">m</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Increase metres"
                        onClick={() => setMetres(m => Number((m + 0.5).toFixed(1)))}
                        className="flex h-11 w-10 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-sans text-[14px] font-semibold text-[#1F0505]">
                      {inr(lineTotal)}
                      <span className="text-[11px] text-[#1F0505]/40 font-normal ml-1">total</span>
                    </p>
                  </div>
                  {item.minMetres > 1 && (
                    <p className="text-[11px] text-[#1F0505]/30 mt-1 font-sans">
                      Min. order: {item.minMetres} metres
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {!soldOut ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`btn flex-1 transition-all duration-300 ${
                      addedFeedback ? 'btn-blush !text-[#1F0505]' : 'btn-outline'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {addedFeedback ? '✓ Added!' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="btn btn-dark btn-sheen flex-1"
                  >
                    Buy Now →
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[14px] text-[#1F0505]/50 mb-3">
                    This fabric is currently out of stock. Contact us to enquire about availability.
                  </p>
                  <a
                    href={waProductLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full"
                  >
                    <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                  </a>
                </div>
              )}

              {/* WhatsApp enquiry */}
              {!soldOut && (
                <a
                  href={waProductLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] font-sans font-semibold tracking-[0.1em] uppercase text-[#1F0505]/40 hover:text-[#1F0505] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Enquire about this fabric
                </a>
              )}

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2"
                style={{ borderTop: '1px solid rgba(31,5,5,0.06)' }}
              >
                <span className="flex items-center gap-2 text-[11px] text-[#1F0505]/40 font-sans">
                  <Truck className="h-4 w-4" /> Ships across India
                </span>
                <span className="flex items-center gap-2 text-[11px] text-[#1F0505]/40 font-sans">
                  <ShieldCheck className="h-4 w-4" /> Quality guaranteed
                </span>
              </div>
            </div>
          </div>

          {/* Tab section */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(31,5,5,0.06)' }}>
            <div className="flex gap-0 overflow-x-auto hide-scrollbar mb-8">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-sans text-[11px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1F0505] text-white'
                      : 'border border-[#1F0505]/15 text-[#1F0505]/50 hover:text-[#1F0505] -ml-px first:ml-0'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-w-2xl text-[14px] text-[#1F0505]/60 leading-relaxed">
              {activeTab === 'description' && (
                <p>{item.details || item.blurb || 'No description available.'}</p>
              )}
              {activeTab === 'details' && (
                <div className="space-y-2">
                  <p><strong className="text-[#1F0505]">Composition:</strong> {item.composition || '—'}</p>
                  <p><strong className="text-[#1F0505]">Width:</strong> {item.width}</p>
                  <p><strong className="text-[#1F0505]">Category:</strong> {item.category}</p>
                  <p><strong className="text-[#1F0505]">Minimum Order:</strong> {item.minMetres} metres</p>
                  {item.tags.length > 0 && (
                    <p><strong className="text-[#1F0505]">Tags:</strong> {item.tags.join(', ')}</p>
                  )}
                </div>
              )}
              {activeTab === 'care' && (
                <div className="space-y-3">
                  <p>To preserve the quality and beauty of your fabric:</p>
                  <ul className="list-disc list-inside space-y-1 text-[#1F0505]/50">
                    <li>Dry clean recommended for embroidered and zari fabrics</li>
                    <li>Gentle hand wash in cold water for most plain weaves</li>
                    <li>Do not wring or tumble dry</li>
                    <li>Iron on reverse side with a cool iron</li>
                    <li>Store away from direct sunlight to prevent fading</li>
                  </ul>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-3">
                  <p>We ship across India via courier.</p>
                  <ul className="list-disc list-inside space-y-1 text-[#1F0505]/50">
                    <li>Free shipping on orders above ₹5,000</li>
                    <li>Flat ₹149 shipping on smaller orders</li>
                    <li>Typical delivery: 3–7 working days</li>
                    <li>Tracking shared via WhatsApp/SMS after dispatch</li>
                    <li>In-store pickup available from our Bengaluru showroom</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Bundle Offer */}
          <BundleOffer currentProduct={item} />

          {/* Recommendations */}
          <div className="mt-16">
            <FrequentlyViewedTogether currentProduct={item} />
          </div>
          <div className="mt-8 pb-12">
            <RecentlyViewed excludeId={item.id} />
          </div>
        </div>
      </section>

      {/* Measurement Guide Modal */}
      <MeasurementGuide
        isOpen={showMeasurementGuide}
        onClose={() => setShowMeasurementGuide(false)}
        onSelectMetres={(m) => setMetres(m)}
        fabricWidthInches={44}
      />

      {/* Mobile sticky purchase bar */}
      {!soldOut && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white px-4 py-3 flex items-center gap-3"
          style={{ borderTop: '1px solid rgba(31,5,5,0.1)', boxShadow: '0 -4px 20px rgba(31,5,5,0.06)' }}
        >
          <div className="flex items-center border border-[#1F0505]/15 shrink-0">
            <button
              onClick={() => setMetres(m => Math.max(item.minMetres, Number((m - 0.5).toFixed(1))))}
              className="flex h-10 w-10 items-center justify-center text-[#1F0505]/40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[44px] text-center text-[13px] font-medium text-[#1F0505]">{metres}m</span>
            <button
              onClick={() => setMetres(m => Number((m + 0.5).toFixed(1)))}
              className="flex h-10 w-10 items-center justify-center text-[#1F0505]/40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[14px] font-semibold text-[#1F0505] shrink-0">{inr(lineTotal)}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn btn-dark btn-sheen flex-1"
          >
            <ShoppingCart className="h-4 w-4" />
            {addedFeedback ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      )}
    </>
  );
}
