import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

/**
 * The offer strip the shop switches on from /#/admin.
 * Hidden entirely when there is no live offer, so the site never carries a
 * stale "Diwali Sale" banner into February.
 */
export default function OfferBar() {
  const { offer } = useCatalog();
  const [dismissed, setDismissed] = useState(false);

  const show = offer.active && offer.headline && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden bg-maroon text-center"
        >
          <div className="container-lux py-2.5 pr-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-light sm:text-[13px]">
              {offer.headline}
            </p>
            {offer.detail && (
              <p className="mt-0.5 text-[11px] tracking-wide text-ivory/70">{offer.detail}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss offer"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ivory/50 transition-colors hover:text-ivory"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
