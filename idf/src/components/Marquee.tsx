import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const ITEMS = [
  'NEW COLLECTIONS ARRIVING THIS WEEK',
  'GLOBAL SHIPPING AVAILABLE',
  'PREMIUM FABRICS CUT BY THE METRE',
  'VISIT OUR BANGALORE SHOWROOM'
];

export default function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [animateCSS, setAnimateCSS] = useState(false);
  const row = [...ITEMS, ...ITEMS, ...ITEMS];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimateCSS(true);
      return;
    }

    const track = trackRef.current;
    if (!track) return;

    // Use GSAP for infinite scrolling loop
    const marqueeTween = gsap.to(track, {
      xPercent: -50,
      repeat: -1,
      duration: 20,
      ease: 'none',
    });

    let lastY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      
      // Scale speed based on velocity
      const speed = gsap.utils.clamp(0.3, 2, 1 + Math.abs(delta) * 0.05);
      
      // If scrolling up, reverse or slow direction
      marqueeTween.timeScale(delta < 0 ? -speed : speed);
      lastY = currentY;

      // Gradually decay speed back to normal (1)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        gsap.to(marqueeTween, { timeScale: 1, duration: 0.5, ease: 'power1.out' });
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      marqueeTween.kill();
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="grid-line bg-primary text-on-primary py-3 overflow-hidden whitespace-nowrap border-b border-[#1a1a1a]" aria-hidden="true">
      <div
        ref={trackRef}
        className={`flex w-max gap-0 marquee-track ${animateCSS ? 'animate-marquee' : ''} motion-reduce:animate-none`}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-6 pr-6 font-label-caps text-label-caps text-on-primary tracking-widest uppercase"
          >
            {item}
            <span className="text-brand-gold font-bold">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
