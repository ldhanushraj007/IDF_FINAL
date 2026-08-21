import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BUSINESS } from '../lib/constants';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Scroll-linked headline animation
      gsap.to('h1.hero-heading', {
        letterSpacing: '0.01em',
        opacity: 0.85,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // 2. Feature list reveal
      gsap.from('.hero-feature-list li', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.hero-feature-list',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // 3. Tagline paragraph reveal
      gsap.from('.hero-intro-paragraph', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.3,
        scrollTrigger: {
          trigger: '.hero-feature-list',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={containerRef} className="grid-line relative border-b border-[#1a1a1a] bg-[#F2F1EC] hero-section">
      <span className="index-badge">02</span>

      {/* 3-column hero grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0 min-h-[340px] md:min-h-[280px]">
        {/* Col 1 — Big headline */}
        <div className="flex items-end px-6 md:px-12 py-12 md:py-16">
          <h1 className="hero-heading font-serif text-[54px] md:text-[84px] lg:text-[100px] text-primary leading-[0.9] tracking-tight">
            Order by<br />the metre.
          </h1>
        </div>

        {/* Col 2 — Numbered features */}
        <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[260px]">
          <ul className="space-y-0 w-full hero-feature-list">
            {[
              { n: '01', label: 'PREMIUM FABRICS' },
              { n: '02', label: 'CUT TO YOUR REQUIREMENT' },
              { n: '03', label: 'SHIPPED ACROSS INDIA' },
              { n: '04', label: 'PAY SECURELY BY UPI' },
            ].map((f) => (
              <li key={f.n} className="flex items-center gap-4 py-3 border-b border-[#1a1a1a]/15 last:border-b-0">
                <span className="font-mono text-[10px] text-secondary w-5 shrink-0">{f.n}</span>
                <span className="font-label-caps text-[10px] tracking-[0.15em] text-secondary">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Tagline */}
        <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[220px]">
          <div>
            <div className="w-8 h-px bg-[#1a1a1a]/30 mb-4" />
            <p className="hero-intro-paragraph font-serif text-[18px] text-primary leading-snug max-w-[200px]">
              Luxury couture and bridal fabrics, curated in {BUSINESS.city}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
