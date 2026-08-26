import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Brief brand reveal on first visit of a session. */
export default function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('idlf_seen');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem('idlf_seen', '1');
      } catch {
        /* storage unavailable */
      }
    }, 850);
    return () => clearTimeout(t);
  }, [show]);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <AnimatePresence>
      {show && !prefersReduced && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night px-8"
          aria-hidden="true"
        >
          <motion.img
            src="/images/logo/logo-full-dark.png"
            alt=""
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-auto max-h-[38vh] w-auto max-w-[280px] object-contain sm:max-w-[360px]"
          />
          <div className="w-48 h-0.5 bg-ivory/10 mt-6 relative overflow-hidden">
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '0%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 right-0 w-full bg-brand-gold"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
