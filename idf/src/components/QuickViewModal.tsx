import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Minus, Plus, ShoppingBag, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { inr } from '../lib/constants';
import type { Item } from '../data/catalog';

const fadeOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

interface Props {
  item: Item | null;
  onClose: () => void;
}

export default function QuickViewModal({ item, onClose }: Props) {
  const { add, setOpen } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [metres, setMetres] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (item) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setActiveImage(0);
      setMetres(item.minMetres);
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const gallery = item.gallery && item.gallery.length ? item.gallery : [item.image];
  const soldOut = item.stock === 'out';

  const handleBuyNow = () => {
    add(item.id, metres);
    onClose();
    setOpen(true);
  };

  const handleAddToCart = () => {
    add(item.id, metres);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={fadeOverlay}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-[96] flex items-end justify-center bg-[#1F0505]/70 backdrop-blur-sm p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${item.name}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto bg-white text-[#1F0505] outline-none sm:grid sm:grid-cols-2 sm:overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center border border-[#1F0505]/15 bg-white text-[#1F0505]/60 transition-colors hover:border-[#1F0505] hover:text-[#1F0505]"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left: Gallery */}
          <div className="flex flex-col bg-[#f5f0ed] p-4 sm:p-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f5f0ed]">
              <img
                src={gallery[activeImage]}
                alt={item.name}
                className={`h-full w-full object-cover ${soldOut ? 'grayscale-[0.5] opacity-80' : ''}`}
              />
              {item.stock !== 'in' && (
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-block border px-2 py-1 font-sans text-[10px] font-semibold uppercase ${
                      item.stock === 'low'
                        ? 'border-[#1F0505] bg-[#FFE6E9] text-[#1F0505]'
                        : 'border-[#1F0505]/20 bg-white/80 text-[#1F0505]/50'
                    }`}
                  >
                    {item.stock === 'low' ? '⬦ Low Stock' : '× Unavailable'}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-14 w-12 shrink-0 border ${
                      activeImage === i ? 'border-[#1F0505]' : 'border-[#1F0505]/15 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-between p-6">
            <div>
              <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1F0505]/40">
                {item.category}
              </span>
              <h2 className="font-serif text-2xl text-[#1F0505] mt-1 leading-snug">{item.name}</h2>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-nums text-2xl font-semibold text-[#1F0505]">
                  {inr(item.pricePerMetre)}
                </span>
                <span className="font-sans text-[12px] text-[#1F0505]/40">/ metre</span>
                {item.mrp && item.mrp > item.pricePerMetre && (
                  <span className="font-nums text-[12px] text-[#1F0505]/30 line-through">
                    {inr(item.mrp)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-[#1F0505]/60 line-clamp-3">
                {item.details || item.blurb}
              </p>

              {/* Specs */}
              <div className="mt-4 border-t border-[#1F0505]/6 pt-3 space-y-1.5 text-[12px] text-[#1F0505]/40">
                <p>Composition: <span className="text-[#1F0505] font-medium">{item.composition || '—'}</span></p>
                <p>Width: <span className="text-[#1F0505] font-medium">{item.width}</span></p>
                <p>Min Order: <span className="text-[#1F0505] font-medium">{item.minMetres} metres</span></p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#1F0505]/6 pt-4 space-y-4">
              {!soldOut && (
                <>
                  <div className="flex items-center justify-between border border-[#1F0505]/15 px-3">
                    <button
                      type="button"
                      aria-label="Decrease metres"
                      onClick={() => setMetres((m) => Math.max(item.minMetres, m - 1))}
                      className="flex h-10 w-10 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-nums text-[13px] text-[#1F0505]">
                      {metres} <span className="text-[#1F0505]/40">metres</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Increase metres"
                      onClick={() => setMetres((m) => m + 1)}
                      className="flex h-10 w-10 items-center justify-center text-[#1F0505]/40 hover:text-[#1F0505]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={handleAddToCart} className="btn btn-outline !text-[11px] !py-3">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                    <button type="button" onClick={handleBuyNow} className="btn btn-dark !text-[11px] !py-3">
                      <Zap className="h-3.5 w-3.5" />
                      Buy Now
                    </button>
                  </div>
                </>
              )}

              <Link
                to={`/shop/product/${item.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1F0505]/60 hover:text-[#1F0505] hover:underline pt-2"
              >
                <span>View Full Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
