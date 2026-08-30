import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatalog } from '../context/CatalogContext';
import { BUSINESS, inr, waLink } from '../lib/constants';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import type { Item } from '../data/catalog';

// Edition metadata
const TODAY = new Date();
const EDITION_DATE = TODAY.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

// Thin black rule utility (reuse inline style)
const rule = { borderBottom: '1px solid #1F0505' };
const ruleTop = { borderTop: '1px solid #1F0505' };
const ruleRight = { borderRight: '1px solid #1F0505' };
const ruleLeft = { borderLeft: '1px solid #1F0505' };

const BRAND_PILLARS = [
  { num: '01', label: 'Sourced Direct', body: 'Straight from the looms of Varanasi, Kanchipuram & Bhagalpur.' },
  { num: '02', label: 'Cut by the Metre', body: 'Every length made to order — no off-the-shelf minimums.' },
  { num: '03', label: 'Ships Nationwide', body: 'Flat ₹149 shipping. Free above ₹5,000. Tracked dispatch.' },
  { num: '04', label: 'Showroom Open', body: 'Visit us on Commercial Street, Bengaluru, 7 days a week.' },
];

export default function HomePage() {
  const { items, loading } = useCatalog();
  const [quickView, setQuickView] = useState<Item | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const featured = items.filter(i => i.stock !== 'out').slice(0, 6);
  const heroItems = items.filter(i => i.stock !== 'out').slice(0, 5);
  const hero = heroItems[currentSlide] || heroItems[0] || null;
  const editorial = items.filter(i => i.stock !== 'out').slice(0, 5);

  // Auto-advance hero carousel every 4.5 seconds
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  useEffect(() => {
    document.title = `IN DESIGN — Luxury Fabrics, Bengaluru`;
  }, []);

  return (
    <>


      {/* ══════════════════════════════════════════════════════════════════
          HERO — NEWSPAPER BROADSHEET GRID
          4-column editorial layout with 1px borders
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white" aria-label="Hero">
        {/* 4-col grid with black rules */}
        <div
          className="grid grid-cols-1 lg:grid-cols-4"
          style={{ borderBottom: '1px solid #1F0505' }}
        >
          {/* COL 1 — Left sidebar: brand pillars stacked */}
          <div
            className="hidden lg:flex flex-col"
            style={ruleRight}
          >
            {BRAND_PILLARS.map((p, i) => (
              <div
                key={p.num}
                className="px-5 py-6 flex-1 group"
                style={i < BRAND_PILLARS.length - 1 ? rule : undefined}
              >
                <span className="font-sans text-[8px] tracking-[0.25em] text-[#1F0505]/30 font-semibold uppercase block mb-2">
                  {p.num}
                </span>
                <h3 className="font-serif text-[15px] text-[#1F0505] leading-snug mb-1.5">{p.label}</h3>
                <p className="font-sans text-[11px] text-[#1F0505]/50 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>

          {/* COL 2+3 — Hero centrepiece */}
          <div
            className="lg:col-span-2 flex flex-col"
            style={ruleRight}
          >
            {/* Big kicker headline */}
            <div
              className="px-4 xs:px-8 pt-8 xs:pt-10 pb-6 text-center"
              style={rule}
            >
              <p className="font-sans text-[8px] xs:text-[9px] tracking-[0.35em] text-[#1F0505]/40 uppercase font-semibold mb-3">
                — The Season's Edit —
              </p>
              <h1
                className="font-serif text-[36px] xs:text-[48px] md:text-[64px] lg:text-[72px] text-[#1F0505] leading-[0.92] font-medium"
                style={{ letterSpacing: '-0.02em' }}
              >
                Where Fabric<br />
                <em className="not-italic" style={{ fontStyle: 'italic', opacity: 0.75 }}>Becomes</em><br />
                Heritage.
              </h1>
              <div className="flex items-center justify-center gap-4 mt-6">
                <span className="h-px flex-1 bg-[#1F0505]/15" />
                <span className="font-sans text-[9px] tracking-[0.3em] text-[#1F0505]/35 uppercase">Est. 2009</span>
                <span className="h-px flex-1 bg-[#1F0505]/15" />
              </div>
            </div>

            {/* Hero fabric carousel — full bleed */}
            <div className="relative flex-1 min-h-[420px] md:min-h-[520px] overflow-hidden bg-[#FFE6E9]/30 group">
              {hero ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={hero.id}
                      src={hero.image}
                      alt={hero.name}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        filter: 'grayscale(0.12) contrast(1.04)',
                      }}
                    />
                  </AnimatePresence>
                  {/* Halftone texture overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(circle, rgba(31,5,5,0.06) 1px, transparent 1px)`,
                      backgroundSize: '6px 6px',
                    }}
                  />
                  {/* Gradient fade to white at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />

                  {/* Left / Right Carousel Controls */}
                  {heroItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentSlide((prev) => (prev - 1 + heroItems.length) % heroItems.length)}
                        aria-label="Previous featured fabric"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1F0505] shadow-md border border-[#1F0505]/20 hover:bg-[#1F0505] hover:text-white transition-all opacity-80 group-hover:opacity-100"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % heroItems.length)}
                        aria-label="Next featured fabric"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1F0505] shadow-md border border-[#1F0505]/20 hover:bg-[#1F0505] hover:text-white transition-all opacity-80 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Hero caption block (newspaper photo caption style) + Carousel Dots */}
                  <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-3">
                    <div className="bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-md" style={{ border: '1px solid #1F0505' }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-sans text-[8px] tracking-[0.2em] text-[#1F0505]/50 uppercase font-semibold">
                          Featured Fabric · {currentSlide + 1} of {heroItems.length}
                        </p>
                        {/* Carousel Dots */}
                        <div className="flex items-center gap-1.5">
                          {heroItems.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentSlide(idx)}
                              aria-label={`Go to slide ${idx + 1}`}
                              className={`h-1.5 rounded-full transition-all ${
                                currentSlide === idx ? 'w-5 bg-[#1F0505]' : 'w-1.5 bg-[#1F0505]/30 hover:bg-[#1F0505]/60'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="font-serif text-[18px] sm:text-[20px] text-[#1F0505] leading-tight font-medium">{hero.name}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1F0505]/10">
                        <span className="font-sans text-[12px] font-semibold text-[#1F0505]">{inr(hero.pricePerMetre)} / metre</span>
                        <Link
                          to={`/shop/product/${hero.id}`}
                          className="font-sans text-[9.5px] tracking-[0.18em] text-[#1F0505] uppercase font-bold underline underline-offset-2 hover:no-underline"
                        >
                          View Fabric →
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FFE6E9]/30">
                  <p className="font-sans text-[11px] tracking-[0.2em] text-[#1F0505]/30 uppercase">Loading collection…</p>
                </div>
              )}
            </div>

            {/* Two CTAs below hero image */}
            <div className="grid grid-cols-2" style={ruleTop}>
              <Link
                to="/shop"
                className="flex items-center justify-center gap-2 py-4 px-5 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-[#1F0505] hover:bg-[#1F0505] hover:text-white transition-colors group"
                style={ruleRight}
              >
                Shop All Fabrics
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/collections"
                className="flex items-center justify-center gap-2 py-4 px-5 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-[#1F0505]/50 hover:bg-[#FFE6E9]/40 hover:text-[#1F0505] transition-colors"
              >
                View Collections
              </Link>
            </div>
          </div>

          {/* COL 4 — Right sidebar: editorial snippets */}
          <div className="hidden lg:flex flex-col">
            {/* Tagline */}
            <div className="px-5 pt-8 pb-5" style={rule}>
              <p className="font-sans text-[8px] tracking-[0.22em] text-[#1F0505]/35 uppercase font-semibold mb-3">
                This Season
              </p>
              <p className="font-serif text-[22px] leading-[1.2] text-[#1F0505]">
                "The fabric should tell the story of the weaver."
              </p>
              <p className="font-sans text-[10px] text-[#1F0505]/40 mt-3 tracking-wide">
                — A note from the showroom
              </p>
            </div>

            {/* Mini editorial products */}
            {editorial.map((item, i) => (
              <div
                key={item.id}
                className="px-5 py-3.5 group cursor-pointer hover:bg-[#FFE6E9]/20 transition-colors"
                style={i < editorial.length - 1 ? rule : undefined}
                onClick={() => setQuickView(item)}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-16 shrink-0 overflow-hidden bg-[#f5f0ed] rounded" style={{ border: '1px solid rgba(31,5,5,0.1)' }}>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[7.5px] tracking-[0.18em] text-[#1F0505]/40 uppercase font-semibold mb-0.5">{item.category}</p>
                    <p className="font-serif text-[13px] text-[#1F0505] leading-snug truncate font-medium group-hover:text-[#1F0505]/70">{item.name}</p>
                    <p className="font-sans text-[10.5px] font-medium text-[#1F0505]/60 mt-1">{inr(item.pricePerMetre)}<span className="text-[8.5px] text-[#1F0505]/35">/m</span></p>
                  </div>
                </div>
              </div>
            ))}

            {/* Visit CTA */}
            <div className="px-5 py-5 mt-auto" style={ruleTop}>
              <p className="font-sans text-[8px] tracking-[0.22em] text-[#1F0505]/35 uppercase font-semibold mb-2">Showroom Hours</p>
              {BUSINESS.hours.map(h => (
                <div key={h.days} className="flex justify-between text-[10px] py-0.5">
                  <span className="text-[#1F0505]/50">{h.days}</span>
                  <span className="text-[#1F0505]/70 font-medium">{h.time}</span>
                </div>
              ))}
              <Link to="/visit" className="mt-3 block font-sans text-[9px] tracking-[0.18em] text-[#1F0505] uppercase font-semibold underline underline-offset-2 hover:no-underline">
                Get Directions →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION RULE + KICKER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#1F0505] px-5 md:px-10 lg:px-12 py-3 flex items-center justify-between gap-6">
        <span className="h-px flex-1 bg-white/20" />
        <span className="font-sans text-[9px] tracking-[0.35em] text-white/60 uppercase font-semibold whitespace-nowrap">
          The Current Collection
        </span>
        <span className="h-px flex-1 bg-white/20" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURED FABRICS — NEWSPAPER PRODUCT GRID
          3-column grid, each product separated by 1px rules
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white" aria-label="Featured fabrics">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 border border-[#1F0505]/20 border-t-[#1F0505] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" style={{ borderBottom: '1px solid #1F0505' }}>
              {featured.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={i * 0.06}
                  className="group"
                  style={{
                    borderRight: (i % 3 !== 2) ? '1px solid #1F0505' : undefined,
                    borderBottom: i < featured.length - 3 ? '1px solid #1F0505' : undefined,
                  } as React.CSSProperties}
                >
                  {/* Product image */}
                  <div
                    className="relative aspect-[4/5] overflow-hidden bg-[#f5f0ed]"
                    style={{ borderBottom: '1px solid #1F0505' }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    {/* Halftone grain overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                      style={{
                        backgroundImage: `radial-gradient(circle, rgba(31,5,5,0.08) 1px, transparent 1px)`,
                        backgroundSize: '5px 5px',
                      }}
                    />
                    {/* Quick View on hover */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <button
                        type="button"
                        onClick={() => setQuickView(item)}
                        className="w-full bg-[#1F0505] text-white py-3 font-sans text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-[#1F0505]/90 transition-colors"
                      >
                        Quick View
                      </button>
                    </div>
                    {/* Stock badge */}
                    {item.stock === 'low' && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#FFE6E9] px-2 py-0.5 font-sans text-[8px] font-semibold tracking-[0.15em] uppercase text-[#1F0505]" style={{ border: '1px solid #1F0505' }}>
                          Low Stock
                        </span>
                      </div>
                    )}
                    {/* Issue number */}
                    <div className="absolute top-3 right-3">
                      <span className="font-sans text-[9px] text-[#1F0505]/40 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Product text — newspaper dense typography */}
                  <div className="px-5 py-4">
                    <p className="font-sans text-[8px] tracking-[0.2em] text-[#1F0505]/40 uppercase font-semibold mb-1.5">
                      {item.category}
                    </p>
                    <h3 className="font-serif text-[16px] leading-snug text-[#1F0505] mb-2">
                      {item.name}
                    </h3>
                    <p className="font-sans text-[11px] text-[#1F0505]/50 leading-relaxed line-clamp-2 mb-3">
                      {item.blurb}
                    </p>
                    <div className="flex items-baseline gap-3" style={{ borderTop: '1px solid rgba(31,5,5,0.08)', paddingTop: '10px' }}>
                      <span className="font-serif text-[17px] font-medium text-[#1F0505]">
                        {inr(item.pricePerMetre)}
                      </span>
                      <span className="font-sans text-[9px] text-[#1F0505]/35 tracking-wide">/&nbsp;metre</span>
                      <Link
                        to={`/shop/product/${item.id}`}
                        className="ml-auto font-sans text-[9px] tracking-[0.16em] text-[#1F0505]/60 uppercase font-semibold hover:text-[#1F0505] underline underline-offset-2"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* "View full shop" row */}
            <div className="flex items-center justify-center py-6" style={rule}>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1F0505] hover:text-[#1F0505]/60 transition-colors"
              >
                Browse All Fabrics
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PULL QUOTE — EDITORIAL STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="bg-[#FFE6E9] px-5 md:px-10 lg:px-12 py-12 md:py-16 text-center"
        style={{ ...ruleTop, ...rule }}
        aria-label="Brand quote"
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="font-sans text-[8px] tracking-[0.4em] text-[#1F0505]/40 uppercase font-semibold mb-4"
          >
            — From the Showroom Floor —
          </p>
          {/* Editorial Pull Quote */}
          <blockquote
            className="relative font-serif text-[22px] sm:text-[32px] md:text-[40px] lg:text-[46px] text-[#1F0505] leading-[1.25] md:leading-[1.18] px-2 sm:px-6"
            style={{ letterSpacing: '-0.01em' }}
          >
            <span className="font-serif font-bold text-[#1F0505] text-[1.2em] inline-block mr-1 sm:mr-2">“</span>
            Every fabric here has been chosen by hand, inspected in natural light, and measured against the discipline of the weaver's craft.
            <span className="font-serif font-bold text-[#1F0505] text-[1.2em] inline-block ml-1 sm:ml-2">”</span>
          </blockquote>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="h-px w-12 bg-[#1F0505]/20" />
            <p className="font-sans text-[10px] tracking-[0.25em] text-[#1F0505]/50 uppercase font-medium">
              IN DESIGN — Bengaluru
            </p>
            <span className="h-px w-12 bg-[#1F0505]/20" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COLLECTIONS STRIP — 3 editorial columns
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white" aria-label="Collections">
        <div
          className="px-5 md:px-10 lg:px-12 py-4 flex items-center justify-between"
          style={rule}
        >
          <p className="font-sans text-[9px] tracking-[0.3em] text-[#1F0505]/40 uppercase font-semibold">
            The Three Edits
          </p>
          <Link to="/collections" className="font-sans text-[9px] tracking-[0.18em] text-[#1F0505]/50 uppercase font-semibold hover:text-[#1F0505] underline underline-offset-2">
            See All Collections →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={rule}>
          {[
            { label: 'Bridal', tagline: 'The Trousseau Edit', desc: 'Heritage silks and embroidered fabrics for once-in-a-lifetime garments.', href: '/shop/bridal', bg: '#FFE6E9' },
            { label: 'Heritage Weaves', tagline: 'The Archive', desc: 'Banarasi, Kanjivaram, and Chanderi — woven traditions, modernised.', href: '/shop/heritage', bg: '#FFFFFF' },
            { label: 'Contemporary', tagline: 'The Atelier', desc: 'Clean lines and elevated materials for the modern Indian wardrobe.', href: '/shop/contemporary', bg: '#FFE6E9' },
          ].map((col, i) => (
            <Link
              key={col.label}
              to={col.href}
              className="group flex flex-col justify-between p-6 md:p-8 min-h-[220px] hover:bg-opacity-60 transition-colors"
              style={{
                backgroundColor: col.bg,
                borderRight: i < 2 ? '1px solid #1F0505' : undefined,
              }}
            >
              <div>
                <p className="font-sans text-[8px] tracking-[0.3em] text-[#1F0505]/40 uppercase font-semibold mb-3">
                  {String(i + 1).padStart(2, '0')} / {col.tagline}
                </p>
                <h3 className="font-serif text-[26px] md:text-[30px] text-[#1F0505] leading-snug">
                  {col.label}
                </h3>
                <p className="font-sans text-[12px] text-[#1F0505]/50 leading-relaxed mt-3">
                  {col.desc}
                </p>
              </div>
              <div
                className="flex items-center gap-2 font-sans text-[9px] tracking-[0.2em] text-[#1F0505]/50 uppercase font-semibold mt-6 pt-4 group-hover:text-[#1F0505] transition-colors"
                style={ruleTop}
              >
                Shop Now
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          VISIT + CONTACT FOOTER STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="bg-[#1F0505] px-5 md:px-10 lg:px-12 py-10 md:py-14"
        aria-label="Visit the showroom"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          <div className="md:pr-8" style={{ borderRight: '1px solid rgba(255,230,233,0.15)' }}>
            <p className="font-sans text-[8px] tracking-[0.3em] text-[#FFE6E9]/40 uppercase font-semibold mb-3">Address</p>
            <p className="font-serif text-[18px] text-white leading-snug">{BUSINESS.addressLine1}</p>
            <p className="font-sans text-[11px] text-white/50 mt-1">{BUSINESS.addressLine2}</p>
            <p className="font-sans text-[11px] text-white/50">{BUSINESS.addressLine3}</p>
          </div>
          <div className="md:px-8" style={{ borderRight: '1px solid rgba(255,230,233,0.15)' }}>
            <p className="font-sans text-[8px] tracking-[0.3em] text-[#FFE6E9]/40 uppercase font-semibold mb-3">Hours</p>
            {BUSINESS.hours.map(h => (
              <div key={h.days} className="flex justify-between py-1">
                <span className="font-sans text-[11px] text-white/50">{h.days}</span>
                <span className="font-sans text-[11px] text-white/70 font-medium">{h.time}</span>
              </div>
            ))}
          </div>
          <div className="md:pl-8 flex flex-col justify-between">
            <div>
              <p className="font-sans text-[8px] tracking-[0.3em] text-[#FFE6E9]/40 uppercase font-semibold mb-3">Contact</p>
              <a href={`tel:${BUSINESS.phoneRaw}`} className="font-serif text-[20px] text-white hover:text-[#FFE6E9] transition-colors block">
                {BUSINESS.phoneDisplay}
              </a>
            </div>
            <div className="flex gap-3 mt-6">
              <Link to="/visit" className="border border-white/20 text-white px-4 py-2.5 font-sans text-[9px] tracking-[0.18em] uppercase font-semibold hover:bg-white/10 transition-colors flex-1 text-center">
                Get Directions
              </Link>
              <a href={waLink('Hello! I would like to visit your showroom.')} target="_blank" rel="noopener noreferrer" className="bg-[#FFE6E9] text-[#1F0505] px-4 py-2.5 font-sans text-[9px] tracking-[0.18em] uppercase font-semibold hover:bg-white transition-colors flex-1 text-center">
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View */}
      <QuickViewModal item={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
