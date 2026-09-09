import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, Truck, ShieldCheck, ShoppingCart, Ruler, MessageCircle, Heart, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
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
import { getProductGallery } from '../data/catalog';

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

  // Zoom & High-Res Lightbox states
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoomLevel, setLightboxZoomLevel] = useState(1);

  const lastLoadedProductId = useRef<string | null>(null);
  useTrackProductView(item?.id);

  // Unified image list: main image first, followed by extra gallery images
  const images = useMemo(() => getProductGallery(item), [item]);

  useEffect(() => {
    setActiveImage(0);
    setIsZoomed(false);
    setLightboxZoomLevel(1);
    if (item) {
      if (lastLoadedProductId.current !== item.id) {
        setMetres(item.minMetres);
        lastLoadedProductId.current = item.id;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [item]);

  // Ensure activeImage stays valid if image count changes
  useEffect(() => {
    if (activeImage >= images.length) {
      setActiveImage(0);
    }
  }, [images.length, activeImage]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoomLevel(1);
      } else if (e.key === 'ArrowLeft') {
        setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setLightboxZoomLevel(1);
      } else if (e.key === 'ArrowRight') {
        setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setLightboxZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
    setLightboxZoomLevel(1);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
    setLightboxZoomLevel(1);
  };


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
              <div
                className="relative aspect-[4/5] overflow-hidden bg-[#f5f0ed] mb-3 group select-none cursor-zoom-in rounded-sm"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
                title="Click to view full screen high-resolution photos"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${item.id}-${activeImage}`}
                    src={images[activeImage]}
                    alt={`${item.name} - View ${activeImage + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                    }}
                    className={`w-full h-full object-cover transition-transform duration-150 ease-out ${
                      isZoomed ? 'scale-[2.2]' : 'scale-100'
                    } ${soldOut ? 'grayscale-[0.4] opacity-80' : ''}`}
                  />
                </AnimatePresence>

                {/* Stock badge */}
                <div className="absolute top-4 left-4 pointer-events-none z-10">
                  <span className={`bg-white/90 backdrop-blur-sm px-2.5 py-1 font-sans text-[9px] font-semibold tracking-[0.1em] uppercase flex items-center gap-1.5 shadow-sm ${soldOut ? 'text-red-600' : 'text-[#1F0505]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {soldOut ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 font-sans text-[11px] font-medium text-white bg-[#1F0505]/75 backdrop-blur-sm px-2.5 py-1 rounded shadow-sm z-10">
                    {String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                )}

                {/* Navigation Chevrons on Main Image (when multiple images exist) */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1F0505] shadow-md border border-[#1F0505]/10 opacity-85 hover:opacity-100 hover:scale-105 hover:bg-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1F0505] shadow-md border border-[#1F0505]/10 opacity-85 hover:opacity-100 hover:scale-105 hover:bg-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Bottom Bar: Zoom Hint + Fullscreen & Wishlist actions */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="hidden sm:flex items-center gap-1.5 bg-[#1F0505]/70 backdrop-blur-sm text-white text-[10px] font-sans px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-3.5 w-3.5 text-[#d4af37]" />
                    <span>{isZoomed ? 'Pan to inspect weave' : 'Hover to zoom · Click for high-res'}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(true);
                      }}
                      aria-label="Expand image in high resolution"
                      title="Expand photo"
                      className="flex h-10 w-10 items-center justify-center bg-white/90 backdrop-blur-sm text-[#1F0505] hover:bg-white shadow-sm border border-[#1F0505]/10 rounded-sm transition-all hover:scale-105"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>

                    {enabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHeart(e);
                        }}
                        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                        className="flex h-10 w-10 items-center justify-center bg-white/90 backdrop-blur-sm text-[#1F0505] hover:bg-white shadow-sm border border-[#1F0505]/10 rounded-sm transition-all hover:scale-105"
                      >
                        <Heart className={`h-5 w-5 ${liked ? 'fill-[#1F0505] text-[#1F0505]' : 'text-[#1F0505]/40'}`} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnails Navigation */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => {
                        setActiveImage(i);
                        setIsZoomed(false);
                      }}
                      aria-label={`Select photo ${i + 1} of ${images.length}`}
                      className={`relative aspect-square w-16 sm:w-20 shrink-0 overflow-hidden rounded border-2 transition-all ${
                        activeImage === i
                          ? 'border-[#1F0505] shadow-sm ring-1 ring-[#1F0505]/40 opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-90 hover:border-[#1F0505]/20'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#1F0505]/80 text-[8px] font-sans font-semibold text-white text-center py-0.5 uppercase tracking-wider">
                          Main
                        </span>
                      )}
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

      {/* High-Resolution Fullscreen Lightbox Modal with Zoom */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={`${item.name} high-resolution gallery`}
          >
            {/* Top Lightbox Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white z-20">
              <div className="flex items-center gap-3">
                <span className="text-xs font-sans uppercase tracking-[0.2em] text-[#d4af37]">
                  High-Res Gallery
                </span>
                <span className="text-white/30 text-xs">|</span>
                <span className="font-serif text-sm truncate max-w-[200px] sm:max-w-md">{item.name}</span>
                {images.length > 1 && (
                  <span className="text-xs font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded">
                    {activeImage + 1} / {images.length}
                  </span>
                )}
              </div>

              {/* Lightbox Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxZoomLevel((prev) => Math.max(1, prev - 0.5))}
                  disabled={lightboxZoomLevel <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoomLevel((prev) => Math.min(3.5, prev + 0.5))}
                  disabled={lightboxZoomLevel >= 3.5}
                  className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                {lightboxZoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => setLightboxZoomLevel(1)}
                    className="text-[11px] font-sans text-[#d4af37] px-2 py-1 rounded bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setLightboxZoomLevel(1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-red-500/80 text-white transition-colors ml-2"
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8">
              {/* Prev Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous photo"
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Active Image with interactive pan / zoom */}
              <div
                className="relative max-w-full max-h-full flex items-center justify-center overflow-auto"
                style={{ cursor: lightboxZoomLevel > 1 ? 'grab' : 'zoom-in' }}
                onClick={() => setLightboxZoomLevel((prev) => (prev > 1 ? 1 : 2))}
              >
                <img
                  src={images[activeImage]}
                  alt={`${item.name} high-resolution`}
                  style={{
                    transform: `scale(${lightboxZoomLevel})`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="max-h-[75vh] max-w-[88vw] object-contain rounded-sm select-none shadow-2xl"
                />
              </div>

              {/* Next Button */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next photo"
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Bottom Lightbox Thumbnails Bar */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-3 py-4 px-6 border-t border-white/10 bg-black/50 overflow-x-auto z-20">
                {images.map((src, i) => (
                  <button
                    key={'lightbox-' + src + i}
                    type="button"
                    onClick={() => {
                      setActiveImage(i);
                      setLightboxZoomLevel(1);
                    }}
                    aria-label={`Select photo ${i + 1}`}
                    className={`relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded border-2 transition-all ${
                      activeImage === i
                        ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 scale-105 opacity-100'
                        : 'border-white/20 opacity-40 hover:opacity-90 hover:border-white/50'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
