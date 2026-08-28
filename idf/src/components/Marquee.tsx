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

      const speed = gsap.utils.clamp(0.3, 2, 1 + Math.abs(delta) * 0.05);
      marqueeTween.timeScale(delta < 0 ? -speed : speed);
      lastY = currentY;

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
    <div className="bg-[#1F0505] text-white py-3 overflow-hidden whitespace-nowrap" aria-hidden="true"
      style={{ borderBottom: '1px solid rgba(31,5,5,0.08)' }}
    >
      <div
        ref={trackRef}
        className={`flex w-max gap-0 marquee-track ${animateCSS ? 'animate-marquee' : ''} motion-reduce:animate-none`}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-6 pr-6 font-sans text-[10px] font-semibold text-white tracking-[0.2em] uppercase"
          >
            {item}
            <span className="text-[#FFE6E9] font-bold">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
