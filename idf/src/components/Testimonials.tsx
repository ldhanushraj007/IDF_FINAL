import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TESTIMONIALS } from '../data/testimonials';
import SectionHeading from './SectionHeading';

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 6500);
    return () => clearInterval(t);
  }, [paused]);

  const t = TESTIMONIALS[idx];

  return (
    <section className="relative overflow-hidden bg-night py-16 sm:py-24 lg:py-28">
      <div className="container-lux">
        <SectionHeading light kicker="Word of Mouth" title="What the house is told" />

        <div
          className="relative mx-auto mt-10 max-w-3xl text-center sm:mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <span
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none font-serif text-[6.5rem] leading-none text-gold/15 sm:-top-12 sm:text-[9rem]"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <div className="relative min-h-[240px] sm:min-h-[190px] md:min-h-[170px]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={idx}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-serif text-[19px] italic leading-relaxed text-ivory sm:text-2xl md:text-[27px]">
                  {t.quote}
                </p>
                <footer className="mt-6 sm:mt-7">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gold sm:text-[13px]">
                    {t.name}
                  </p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-ivory/50 sm:text-[11px]">
                    {t.role}
                  </p>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div
            className="mt-6 flex items-center justify-center gap-1 sm:mt-8"
            role="tablist"
            aria-label="Testimonials"
          >
            {TESTIMONIALS.map((item, i) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={`Testimonial ${i + 1} of ${TESTIMONIALS.length}`}
                onClick={() => setIdx(i)}
                className="flex h-9 w-9 items-center justify-center"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ease-lux ${
                    i === idx ? 'w-7 bg-gold' : 'w-2.5 bg-ivory/25 hover:bg-ivory/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
