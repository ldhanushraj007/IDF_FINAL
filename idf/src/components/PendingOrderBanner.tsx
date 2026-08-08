import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, MessageCircle, X } from 'lucide-react';
import { inr } from '../lib/constants';
import {
  bumpAttempt,
  clearPending,
  readPending,
  subscribePending,
  type PendingOrder,
} from '../lib/pendingOrder';

/**
 * The safety net for the one step the website cannot control.
 *
 * If a customer opened WhatsApp but never confirmed they pressed Send, this
 * sits at the bottom of every page until they either send it or dismiss it.
 * It is the strongest guarantee a site with no backend can offer — and it is
 * far better than silently showing "order placed" for an order that never
 * arrived, which is what most WhatsApp-checkout sites do.
 */
export default function PendingOrderBanner() {
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setPending(readPending());
    sync();
    return subscribePending(sync);
  }, []);

  if (!pending || hidden) return null;

  const send = () => {
    bumpAttempt();
    window.open(pending.waLink, '_blank', 'noopener');
  };

  const done = () => {
    clearPending();
    setPending(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-[92] border-t border-gold/40 bg-chocolate/98 backdrop-blur"
        role="status"
      >
        <div className="container-lux flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 pr-8 sm:pr-0">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-[13px] font-semibold leading-snug text-ivory">
                Order <span className="font-nums">{pending.orderId}</span> hasn't reached the showroom yet
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-ivory/55">
                {inr(pending.total)} · the WhatsApp message still needs to be sent
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={send} className="btn btn-gold btn-sheen flex-1 sm:flex-none">
              <MessageCircle className="h-4 w-4" />
              Send now
            </button>
            <button
              type="button"
              onClick={done}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[12px] tracking-wide text-ivory/55 transition-colors hover:text-gold"
            >
              <Check className="h-3.5 w-3.5" />
              Already sent
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Hide reminder"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-ivory/40 transition-colors hover:text-ivory sm:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
