import { motion } from 'framer-motion';
import { BUSINESS, WA_DEFAULT } from '../lib/constants';

const lineReveal = (delay: number) => ({
  initial: { y: '112%' },
  animate: { y: '0%' },
  transition: { delay, duration: 1, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero() {
  return (
    <section id="top" className="relative flex h-[100svh] min-h-[560px] items-end overflow-hidden">
      {/* Backdrop */}
      <img
        src="/images/hero.jpg"
        alt="Cascading luxury silks in warm golden light"
        className="absolute inset-0 h-full w-full object-cover animate-kenburns motion-reduce:animate-none"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-night/25"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-night/55 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Copy */}
      <div className="container-lux relative pb-20 pt-32 sm:pb-32 sm:pt-40">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-[11px] sm:tracking-[0.34em]"
        >
          Commercial Street · Bengaluru
          <span className="hidden sm:inline"> — Est. 2009</span>
        </motion.p>

        <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.25rem,9vw,5.6rem)] leading-[1.05] text-ivory sm:mt-6 sm:leading-[1.03]">
          <span className="block overflow-hidden pb-1">
            <motion.span className="block" {...lineReveal(1.0)}>
              Fabric for the days
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span className="block" {...lineReveal(1.16)}>
              you&rsquo;ll <em className="text-gold-light">never forget.</em>
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.75 }}
          className="mt-5 max-w-xl text-sm leading-relaxed text-ivory/75 sm:mt-6 sm:text-[15px]"
        >
          Banarasi silks, bridal couture and designer textiles — hand-picked at the loom and
          curated in the heart of {BUSINESS.city}.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.75 }}
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
        >
          <a href="#collections" className="btn btn-gold btn-sheen w-full sm:w-auto">
            Explore Collections
          </a>
          <a
            href={WA_DEFAULT}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost-light w-full sm:w-auto"
          >
            WhatsApp the Showroom
          </a>
        </motion.div>
      </div>

      {/* Scroll thread */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1, duration: 0.8 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        aria-hidden="true"
      >
        <span className="text-[9px] uppercase tracking-[0.42em] text-ivory/50">Scroll</span>
        <span className="relative block h-12 w-px overflow-hidden bg-ivory/20">
          <span className="absolute left-0 top-0 h-5 w-px bg-gold animate-thread-drop motion-reduce:animate-none" />
        </span>
      </motion.div>
    </section>
  );
}
