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
    }, 1350);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night px-8"
          aria-hidden="true"
        >
          <motion.img
            src="/images/logo/logo-full-dark.png"
            alt=""
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-auto max-h-[38vh] w-auto max-w-[280px] object-contain sm:max-w-[360px]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
