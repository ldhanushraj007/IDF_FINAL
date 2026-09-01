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
  const HERO_SLIDES = [
    {
      id: 1,
      image: '/images/hero.jpg',
      tagline: "THE SEASON'S EDIT",
      title: "Timeless\nby Nature.",
      subtitle: "Exclusive fabrics rooted in craftsmanship\nand made to last generations.",
      cta: "EXPLORE COLLECTIONS",
      link: "/collections",
    },
    {
      id: 2,
      image: '/images/hero-slide-2.jpg',
      tagline: "COUTURE SILKS & EMBROIDERY",
      title: "Woven for\nGrandeur.",
      subtitle: "Pure silk satin and intricate hand embroidery\ncrafted for unforgettable moments.",
      cta: "SHOP BRIDAL EDIT",
      link: "/shop/bridal",
    },
    {
      id: 3,
      image: '/images/hero-slide-3.jpg',
      tagline: "HERITAGE SWATCHES",
      title: "Textures of\nElegance.",
      subtitle: "Explore over 500+ curated artisan textiles\navailable for custom cut orders.",
      cta: "BROWSE ALL FABRICS",
      link: "/shop",
    },
  ];

  // Auto-advance hero carousel every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = `IN DESIGN — Luxury Fabrics, Bengaluru`;
  }, []);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          HERO CAROUSEL — SMOOTH SLIDE TRANSITION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[82vh] min-h-[580px] max-h-[900px] overflow-hidden bg-[#FAF7F5] flex items-center justify-center border-b border-[#1F1916]/10" aria-label="Hero Carousel">
        {/* Background Carousel Images with Smooth Crossfade */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.tagline}
              className="w-full h-full object-cover object-center scale-[1.22] origin-center transition-transform duration-1000"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
              }}
            />
            {/* Smooth Top-to-Bottom Fade Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5]/90 via-[#FAF7F5]/40 to-[#FAF7F5] pointer-events-none" />
          </div>
        ))}

        {/* Decorative Framing Accents (Cherry Blossom Left) */}
        <div className="absolute top-0 left-0 h-full w-[35%] pointer-events-none z-10 opacity-90 hidden sm:block">
          <svg className="w-full h-full text-pink-300/40" viewBox="0 0 200 400" fill="none" preserveAspectRatio="xMinYMin meet">
            <path d="M-20,0 Q60,100 20,220 T60,400" stroke="#8B5A5A" strokeWidth="2" fill="none" />
            <circle cx="30" cy="50" r="12" fill="#FFC0CB" opacity="0.8" />
            <circle cx="65" cy="110" r="15" fill="#FFB6C1" opacity="0.85" />
            <circle cx="25" cy="180" r="10" fill="#FFC0CB" opacity="0.8" />
          </svg>
        </div>

        {/* Centered Dynamic Hero Slide Content */}
        <div key={currentSlide} className="relative z-20 max-w-[680px] mx-auto px-6 text-center flex flex-col items-center justify-center animate-fade-in">
          <span className="font-sans text-[11px] sm:text-[12px] tracking-[0.35em] text-[#1F1916]/70 uppercase font-semibold mb-4">
            {activeSlide.tagline}
          </span>

          <h1 className="font-serif text-[48px] sm:text-[68px] md:text-[84px] text-[#1F1916] leading-[1.02] tracking-tight font-light mb-6 whitespace-pre-line">
            {activeSlide.title}
          </h1>

          <p className="font-sans text-[14px] sm:text-[16px] text-[#1F1916]/80 max-w-[480px] leading-relaxed mb-8 whitespace-pre-line">
            {activeSlide.subtitle}
          </p>

          <Link
            to={activeSlide.link}
            className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-9 py-4 text-[11px] font-sans font-semibold tracking-[0.25em] uppercase shadow-md group"
          >
            <span>{activeSlide.cta}</span>
            <span className="ml-3 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* Bottom Carousel Controls & Pagination Dots */}
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-4 font-sans text-[12px] tracking-[0.2em] text-[#1F1916]">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-300 ${
                i === currentSlide
                  ? 'font-bold text-[#1F1916] scale-110 border-b-2 border-[#1F1916]'
                  : 'text-[#1F1916]/40 hover:text-[#1F1916]'
              }`}
            >
              0{i + 1}
            </button>
          ))}
        </div>
      </section>








      {/* ══════════════════════════════════════════════════════════════════
          FEATURED FABRICS — ELEGANT COMPACT GRID
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF7F5] py-16 md:py-24 px-6 md:px-12 border-b border-[#1F1916]/10" aria-label="Featured fabrics">
        <div className="max-w-[1340px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="font-sans text-[10px] tracking-[0.25em] text-[#1F1916]/50 uppercase font-semibold">
                CURATED SELECTION
              </span>
              <h2 className="font-serif text-[32px] md:text-[42px] text-[#1F1916] font-light mt-1">
                The Current Collection
              </h2>
            </div>
            <Link
              to="/shop"
              className="font-sans text-[11px] font-semibold tracking-[0.2em] text-[#1F1916] uppercase hover:underline underline-offset-4"
            >
              View Full Catalogue &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-[#1F1916]/20 border-t-[#1F1916] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {featured.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onQuickView={setQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════
          EDITORIAL QUOTE STRIP — LUXURY GRADIENT FABRIC BACKDROP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#FAF7F5] py-20 px-6 md:px-12 text-center border-b border-[#1F1916]/10 overflow-hidden" aria-label="Brand quote">
        {/* Subtle Background Fabric Image with Gradient Fade */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/reviews-bg.jpg"
            alt="Atelier Silk Fold Texture"
            className="w-full h-full object-cover object-center scale-110 opacity-40 mix-blend-multiply"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
            }}
          />
          {/* Dual Soft Gradient Masks */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5] via-[#FAF7F5]/50 to-[#FAF7F5] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5] via-transparent to-[#FAF7F5] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="font-sans text-[10px] tracking-[0.3em] text-[#1F1916]/60 uppercase font-semibold block mb-4">
            FROM OUR ATELIER
          </span>
          <blockquote className="font-serif text-[24px] sm:text-[34px] md:text-[42px] text-[#1F1916] leading-[1.25] font-light">
            “Every fabric here has been chosen by hand, inspected in natural light, and measured against the discipline of the weaver's craft.”
          </blockquote>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="h-px w-12 bg-[#1F1916]/30" />
            <p className="font-sans text-[10px] tracking-[0.25em] text-[#1F1916]/70 uppercase font-semibold">
              IN DESIGN — BENGALURU
            </p>
            <span className="h-px w-12 bg-[#1F1916]/30" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          THE THREE EDITS — CLEAN ROUNDED CARDS (NO NEWSPAPER LINES)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF7F5] py-16 md:py-24 px-6 md:px-12" aria-label="Collections">
        <div className="max-w-[1340px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="font-sans text-[10px] tracking-[0.25em] text-[#1F1916]/50 uppercase font-semibold">
                CURATED CATEGORIES
              </span>
              <h2 className="font-serif text-[32px] md:text-[42px] text-[#1F1916] font-light mt-1">
                The Three Edits
              </h2>
            </div>
            <Link to="/collections" className="font-sans text-[11px] font-semibold tracking-[0.2em] text-[#1F1916] uppercase hover:underline underline-offset-4">
              See All Collections &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Bridal', tagline: 'The Trousseau Edit', desc: 'Heritage silks and embroidered fabrics for once-in-a-lifetime garments.', href: '/shop/bridal', img: '/images/collections/bridal.jpg' },
              { label: 'Heritage Weaves', tagline: 'The Archive', desc: 'Banarasi, Kanjivaram, and Chanderi — woven traditions, modernised.', href: '/shop/heritage', img: '/images/collections/heritage.jpg' },
              { label: 'Contemporary', tagline: 'The Atelier', desc: 'Clean lines and elevated materials for the modern Indian wardrobe.', href: '/shop/contemporary', img: '/images/collections/contemporary.jpg' },
            ].map((col, i) => (
              <Link
                key={col.label}
                to={col.href}
                className="group bg-white border border-[#1F1916]/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#F5F0EB]">
                  <img
                    src={col.img}
                    alt={col.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/fabrics/f01.jpg';
                    }}
                  />
                </div>
                <div className="p-7 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="font-sans text-[9px] tracking-[0.25em] text-[#1F1916]/40 uppercase font-semibold block mb-2">
                      0{i + 1} / {col.tagline}
                    </span>
                    <h3 className="font-serif text-[24px] text-[#1F1916] font-medium mb-3">
                      {col.label}
                    </h3>
                    <p className="font-sans text-[13px] text-[#1F1916]/65 leading-relaxed">
                      {col.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-sans text-[10px] tracking-[0.2em] text-[#1F1916] uppercase font-semibold mt-6 pt-4 border-t border-[#1F1916]/8 group-hover:translate-x-1 transition-transform">
                    <span>Shop Collection</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal item={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
