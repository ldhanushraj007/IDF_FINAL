import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLLECTIONS } from '../data/collections';
import { waLink } from '../lib/constants';
import SectionHeading from './SectionHeading';

gsap.registerPlugin(ScrollTrigger);

export default function Collections() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // No animation — ensure everything is instantly visible
      gsap.set('.collection-card', { opacity: 1, y: 0, clearProps: 'all' });
      gsap.set('.collection-card__caption', { opacity: 1, x: 0, clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      // Set starting states via GSAP (not CSS) so they're always controlled
      gsap.set('.collection-card', { opacity: 0, y: 40 });
      gsap.set('.collection-card__caption', { opacity: 0, x: -15 });

      // 1. Reveal collection cards on scroll trigger
      gsap.to('.collection-card', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.collections-grid',
          start: 'top 90%',   // generous threshold so it fires even when in viewport on load
          toggleActions: 'play none none none',
          onEnter: () => ScrollTrigger.refresh(),
        },
      });

      // 2. Parallax on inner image
      gsap.utils.toArray('.collection-card__image').forEach((img: any) => {
        gsap.to(img, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: img.closest('.collection-card'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // 3. Caption slide-in — each triggered individually
      gsap.utils.toArray('.collection-card__caption').forEach((caption: any) => {
        gsap.to(caption, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: caption.closest('.collection-card'),
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        });
      });

      // Safety: if section was already in view before GSAP initialised, force-play after short delay
      const safetyTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);

      return () => clearTimeout(safetyTimer);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="collections" ref={containerRef} className="scroll-mt-20 bg-surface border-b border-[#1a1a1a] py-16 sm:py-24">
      <div className="container-lux">
        <SectionHeading
          kicker="The Collections"
          title="Three rooms, one house"
          sub="Every length in the archive lives in one of three edits — from heirloom handlooms to red-carpet advancement."
        />

        <div className="collections-grid mt-10 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <a
              key={c.slug}
              href={waLink(`Hello! I'm interested in the ${c.name} collection.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="collection-card group relative block overflow-hidden border border-[#1a1a1a] bg-surface"
              aria-label={`Enquire about ${c.name} on WhatsApp`}
            >
              {/* Outer image wrapper for parallax clipping */}
              <div className="w-full aspect-[4/5] md:aspect-[3/4] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  className="collection-card__image w-full h-full object-cover scale-[1.2]"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 text-white">
                <p className="collection-card__caption text-[10px] uppercase tracking-[0.3em] text-brand-gold inline-block">
                  {c.tagline.toUpperCase()}
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-snug text-white md:text-xl lg:text-2xl">
                  {c.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/80 md:max-lg:hidden">
                  {c.description}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold opacity-0 transition-all duration-500 ease-lux group-hover:opacity-100 touch:opacity-100">
                  Enquire on WhatsApp <span aria-hidden="true">→</span>
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
