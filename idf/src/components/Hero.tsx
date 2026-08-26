import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { BUSINESS } from '../lib/constants';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [played, setPlayed] = useState(true);
  const [showScrollCue, setShowScrollCue] = useState(false);

  // Parallax transform offsets tied to scroll position
  const { scrollY } = useScroll();
  const cueOpacity = useTransform(scrollY, [0, 80], [1, 0]);
  const featureY = useTransform(scrollY, [0, 300], [0, -30]);
  const taglineY = useTransform(scrollY, [0, 300], [0, 20]);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('idf_hero_intro_played');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasPlayed && !prefersReduced) {
      setPlayed(false);
      sessionStorage.setItem('idf_hero_intro_played', 'true');
    } else {
      setShowScrollCue(true);
    }
  }, []);

  const handleScrollDown = () => {
    const nextSection = document.getElementById('collections') || document.querySelector('#shop');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Letter split animation helpers
  const text1 = "Order by";
  const text2 = "the metre.";

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.03,
      }
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
    <section id="top" ref={containerRef} className="grid-line relative border-b border-[#1a1a1a] bg-[#F2F1EC] hero-section min-h-[360px] md:min-h-[300px]">
      {/* 3-column hero grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0 min-h-[340px] md:min-h-[280px] pb-12 md:pb-0">
        {/* Col 1 — Big headline */}
        <div className="flex items-end px-6 md:px-12 py-12 md:py-16 relative overflow-hidden">
          <div className="relative overflow-hidden">
            {prefersReduced ? (
              <h1 className="hero-heading font-serif text-[54px] md:text-[84px] lg:text-[100px] text-primary leading-[0.9] tracking-tight relative z-10">
                Order by<br />the metre.
              </h1>
            ) : (
              <h1 className="hero-heading font-serif text-[54px] md:text-[84px] lg:text-[100px] text-primary leading-[0.9] tracking-tight relative z-10">
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

            {/* Curtain reveal callback helper logic */}
            {!played && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.1, delay: 1.0 }}
                onAnimationComplete={() => {
                  setPlayed(true);
                  setShowScrollCue(true);
                }}
                className="absolute inset-0 z-20 pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Col 2 — Numbered features */}
        <motion.div
          style={{ y: prefersReduced ? 0 : featureY }}
          className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[260px]"
        >
          <motion.ul
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-0 w-full hero-feature-list"
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
                className="flex items-center gap-4 py-3 border-b border-[#1a1a1a]/15 last:border-b-0"
              >
                <span className="font-mono text-[10px] text-secondary w-5 shrink-0">{f.n}</span>
                <span className="font-label-caps text-[10px] tracking-[0.15em] text-secondary">{f.label}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Col 3 — Tagline */}
        <motion.div
          style={{ y: prefersReduced ? 0 : taglineY }}
          className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[220px]"
        >
          <motion.div
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-8 h-px bg-[#1a1a1a]/30 mb-4" />
            <p className="hero-intro-paragraph font-serif text-[18px] text-primary leading-snug max-w-[200px]">
              Luxury couture and bridal fabrics from In Design (InDesign), curated in {BUSINESS.city}.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Down Cue */}
      <AnimatePresence>
        {showScrollCue && (
          <motion.button
            type="button"
            onClick={handleScrollDown}
            style={{ opacity: cueOpacity }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-brand-gold hover:text-primary transition-colors cursor-pointer z-30"
          >
            <span className="font-label-caps text-[9px] tracking-[0.2em] uppercase">SCROLL</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
