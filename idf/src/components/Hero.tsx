import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BUSINESS } from '../lib/constants';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [played, setPlayed] = useState(true);

  const { scrollY } = useScroll();
  const featureY = useTransform(scrollY, [0, 300], [0, -30]);
  const taglineY = useTransform(scrollY, [0, 300], [0, 20]);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('idf_hero_intro_played');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasPlayed && !prefersReduced) {
      setPlayed(false);
      sessionStorage.setItem('idf_hero_intro_played', 'true');
    }
  }, []);

  const text1 = "Order by";
  const text2 = "the metre.";

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.03 }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 30, rotate: 3 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const listContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: played ? 0 : 0.8,
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: 12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const taglineVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: played ? 0 : 1.2 }
    }
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section
      id="top"
      ref={containerRef}
      className="relative bg-[#FFE6E9] min-h-[360px] md:min-h-[340px]"
      style={{ borderBottom: '1px solid rgba(31,5,5,0.08)' }}
    >
      {/* 3-column hero grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0 min-h-[340px] md:min-h-[320px] pb-16 md:pb-0">
        {/* Col 1 — Big headline */}
        <div className="flex flex-col justify-end px-6 md:px-12 py-12 md:py-16 relative overflow-hidden">
          <div className="relative overflow-hidden">
            {prefersReduced ? (
              <h1 className="font-serif text-[54px] md:text-[84px] lg:text-[100px] text-[#1F0505] leading-[0.9] tracking-tight relative z-10">
                Order by<br />the metre.
              </h1>
            ) : (
              <h1 className="font-serif text-[54px] md:text-[84px] lg:text-[100px] text-[#1F0505] leading-[0.9] tracking-tight relative z-10">
                <motion.span
                  variants={containerVariants}
                  initial={played ? "visible" : "hidden"}
                  animate="visible"
                  className="block"
                >
                  {text1.split("").map((char, index) => (
                    <motion.span key={index} variants={letterVariants} className="inline-block origin-bottom-left">
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.span>
                <motion.span
                  variants={containerVariants}
                  initial={played ? "visible" : "hidden"}
                  animate="visible"
                  className="block mt-1"
                >
                  {text2.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      transition={{ delay: 0.25 }}
                      className="inline-block origin-bottom-left"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.span>
              </h1>
            )}

            {!played && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.1, delay: 1.0 }}
                onAnimationComplete={() => setPlayed(true)}
                className="absolute inset-0 z-20 pointer-events-none"
              />
            )}
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: played ? 0.2 : 1.4 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <Link
              to="/shop"
              className="btn btn-dark btn-sheen"
            >
              Shop Now
            </Link>
            <Link
              to="/collections"
              className="btn btn-outline"
            >
              Explore Collections
            </Link>
          </motion.div>
        </div>

        {/* Col 2 — Numbered features */}
        <motion.div
          style={{ y: prefersReduced ? 0 : featureY }}
          className="border-t md:border-t-0 md:border-l border-[#1F0505]/8 px-8 py-12 flex items-center min-w-[260px]"
        >
          <motion.ul
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-0 w-full"
          >
            {[
              { n: '01', label: 'PREMIUM FABRICS' },
              { n: '02', label: 'CUT TO YOUR REQUIREMENT' },
              { n: '03', label: 'SHIPPED ACROSS INDIA' },
              { n: '04', label: 'PAY SECURELY BY UPI' },
            ].map((f) => (
              <motion.li
                key={f.n}
                variants={listItemVariants}
                className="flex items-center gap-4 py-3 border-b border-[#1F0505]/8 last:border-b-0"
              >
                <span className="font-sans text-[10px] text-[#1F0505]/30 w-5 shrink-0 font-medium">{f.n}</span>
                <span className="font-sans text-[10px] tracking-[0.15em] text-[#1F0505]/60 font-semibold uppercase">{f.label}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Col 3 — Tagline */}
        <motion.div
          style={{ y: prefersReduced ? 0 : taglineY }}
          className="border-t md:border-t-0 md:border-l border-[#1F0505]/8 px-8 py-12 flex items-center min-w-[220px]"
        >
          <motion.div
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-8 h-px bg-[#1F0505]/20 mb-4" />
            <p className="font-serif text-[18px] text-[#1F0505] leading-snug max-w-[200px]">
              Luxury couture and bridal fabrics, curated in {BUSINESS.city}.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
