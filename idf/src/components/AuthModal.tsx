import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import AuthGate from './AuthGate';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[96] flex items-end justify-center bg-night/80 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to In Design Luxury Fabrics"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '5%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '5%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-t-[6px] border border-gold/20 bg-chocolate shadow-2xl sm:rounded-[5px]"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gold/15 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl text-ivory">Welcome Back</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-ivory/50">
                  Sign in to place orders, save wishlists, and view order history.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sign-in"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-ivory/50 transition-colors hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <AuthGate compact />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
