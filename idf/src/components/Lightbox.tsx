import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}

export default function Lightbox({ images, index, onClose, onIndex }: LightboxProps) {
  const open = index !== null && images.length > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex(((index as number) + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex(((index as number) - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, index, images.length, onClose, onIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 p-2 text-ivory/80 transition-colors hover:text-gold"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex(((index as number) - 1 + images.length) % images.length);
                }}
                className="absolute left-3 z-10 rounded-full border border-gold/40 p-2.5 text-ivory/80 transition-colors hover:border-gold hover:text-gold sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex(((index as number) + 1) % images.length);
                }}
                className="absolute right-3 z-10 rounded-full border border-gold/40 p-2.5 text-ivory/80 transition-colors hover:border-gold hover:text-gold sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <motion.img
            key={images[index as number].src}
            src={images[index as number].src}
            alt={images[index as number].alt}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[85vh] max-w-full object-contain ring-1 ring-gold/40"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-ivory/60">
            {(index as number) + 1} / {images.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
