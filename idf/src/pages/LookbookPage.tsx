import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS, WA_VISIT } from '../lib/constants';

export default function LookbookPage() {
  useEffect(() => {
    document.title = `Lookbook | ${BUSINESS.name}`;
  }, []);

  return (
    <div className="bg-[#FAF7F5] text-[#1F1916] min-h-screen">
      {/* Breadcrumb Header */}
      <div className="w-full max-w-[1340px] mx-auto px-6 pt-6 pb-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60">
        <Link to="/" className="hover:text-[#1F1916] transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#1F1916]">LOOKBOOK</span>
      </div>

      {/* Main Hero Lookbook Section with Full-Bleed Floral Branch Background */}
      <section className="py-12 md:py-20 px-6 relative overflow-hidden bg-[#FAF7F5]">
        {/* Full-Bleed Right Background Image */}
        <div className="absolute right-0 top-0 w-full md:w-3/4 h-[540px] z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/lookbook-bg.jpg"
            alt="Floral Branch Wall Texture"
            className="w-full h-full object-cover object-right-top scale-[1.24] origin-top-left"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
            }}
          />
          {/* Left-to-Right Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5] via-[#FAF7F5]/50 to-transparent pointer-events-none" />
          {/* Top-to-Bottom Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5]/40 via-transparent to-[#FAF7F5] pointer-events-none" />
        </div>

        <div className="max-w-[1340px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-center relative z-10">
          {/* Left Column Content (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h1 className="font-serif text-[42px] sm:text-[56px] md:text-[68px] text-[#1F1916] leading-[1.05] tracking-tight font-light mb-4">
              Timeless styles.<br />
              Modern muse.
            </h1>

            {/* Gold Accent Bar */}
            <div className="w-14 h-[2px] bg-[#C5A059] mb-8" />

            <p className="text-[15px] text-[#1F1916]/75 max-w-md leading-relaxed font-sans mb-10">
              A curated edit of textures, drapes and details — designed to inspire.
            </p>

            <div>
              <a
                href={WA_VISIT}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-9 py-4 text-[11px] font-sans font-semibold tracking-[0.25em] uppercase shadow-md group"
              >
                <span>VIEW LOOKBOOK</span>
                <span className="ml-3 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </a>
            </div>
          </div>

          {/* Right Column Grid (7 cols) — Editorial Rounded Gallery (Exact match to Image 5) */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-4">
            {/* Tall Portrait Main Bride Image (Spans 1 col) */}
            <div className="col-span-1 rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-[2/3] md:aspect-[3/5]">
              <img
                src="/images/gallery/g01.jpg"
                alt="Editorial Bride Couture Gown"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
                }}
              />
            </div>

            {/* Middle Column Stack (2 detail shots) */}
            <div className="col-span-1 flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-square">
                <img
                  src="/images/gallery/g02.jpg"
                  alt="Embroidered Gold Fabric Texture Detail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/fabrics/f01.jpg';
                  }}
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-square">
                <img
                  src="/images/gallery/g03.jpg"
                  alt="Drape and Texture Detail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/fabrics/f02.jpg';
                  }}
                />
              </div>
            </div>

            {/* Right Column Stack (1 detail shot) */}
            <div className="col-span-1 flex flex-col justify-end">
              <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-[2/3] md:aspect-[3/4]">
                <img
                  src="/images/gallery/g04.jpg"
                  alt="Artisan Hands Draping Silk Fabric"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/fabrics/f06.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COUTURE DRAPES & ARTISANAL SILHOUETTES GALLERY
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-6 max-w-[1340px] mx-auto border-t border-[#1F1916]/10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#1F1916]/50 font-semibold">
            VOLUME 01 — THE TROUSSEAU ARCHIVE
          </span>
          <h2 className="font-serif text-[36px] md:text-[50px] font-light text-[#1F1916] mt-2 mb-4 leading-tight">
            Crafted for Rare Occasions
          </h2>
          <p className="text-[14px] text-[#1F1916]/70 font-sans leading-relaxed">
            From zardozi and mirror-work lattices to pure handloom silks, explore how our textiles come alive in couture silhouettes.
          </p>
        </div>

        {/* 3-Column Couture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Gold Mirrorwork */}
          <div className="group flex flex-col">
            <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-[3/4] mb-5 relative">
              <img
                src="/images/editorial/couture_gold_mirror.jpg"
                alt="Mirrorwork Bridal Couture"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-sans tracking-widest uppercase rounded">
                GILDED TROUSSEAU
              </span>
            </div>
            <h3 className="font-serif text-[22px] text-[#1F1916] font-medium">
              Zardozi Lattice & Mirror Drape
            </h3>
            <p className="text-[13px] text-[#1F1916]/65 font-sans mt-2 leading-relaxed">
              Hand-appliqued mirrors framed in aged gold dabka thread over deep crimson banarasi brocade.
            </p>
            <Link
              to="/shop/bridal"
              className="inline-flex items-center text-[11px] font-sans font-semibold tracking-[0.2em] text-[#1F1916] uppercase mt-4 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore Bridal Textiles</span>
              <span className="ml-2">&rarr;</span>
            </Link>
          </div>

          {/* Card 2: Aubergine Resham Lehenga */}
          <div className="group flex flex-col">
            <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-[3/4] mb-5 relative">
              <img
                src="/images/editorial/couture_purple_lehenga.jpg"
                alt="Aubergine Resham Embroidery Lehenga"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-sans tracking-widest uppercase rounded">
                IMPERIAL SILK
              </span>
            </div>
            <h3 className="font-serif text-[22px] text-[#1F1916] font-medium">
              Aubergine Floral Kalidar
            </h3>
            <p className="text-[13px] text-[#1F1916]/65 font-sans mt-2 leading-relaxed">
              Layered net and silk organza richly encrusted with antique tilla and multi-tonal resham floral motifs.
            </p>
            <Link
              to="/shop/bridal"
              className="inline-flex items-center text-[11px] font-sans font-semibold tracking-[0.2em] text-[#1F1916] uppercase mt-4 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore Silk Organzas</span>
              <span className="ml-2">&rarr;</span>
            </Link>
          </div>

          {/* Card 3: Olive Anarkali */}
          <div className="group flex flex-col">
            <div className="rounded-2xl overflow-hidden shadow-sm bg-[#E8E2DB] aspect-[3/4] mb-5 relative">
              <img
                src="/images/editorial/couture_olive_anarkali.jpg"
                alt="Forest Green Scalloped Organza Anarkali"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-sans tracking-widest uppercase rounded">
                GARDEN ORGANZA
              </span>
            </div>
            <h3 className="font-serif text-[22px] text-[#1F1916] font-medium">
              Earthy Olive Botanical Jaal
            </h3>
            <p className="text-[13px] text-[#1F1916]/65 font-sans mt-2 leading-relaxed">
              Muted floral prints overlaid with delicate zardozi border-work and scalloped pearl tassels.
            </p>
            <Link
              to="/shop/contemporary"
              className="inline-flex items-center text-[11px] font-sans font-semibold tracking-[0.2em] text-[#1F1916] uppercase mt-4 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore Contemporary</span>
              <span className="ml-2">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BOLT & SWATCH ATELIER ARCHIVE — REAL FABRIC ROLLS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-6 bg-[#F5F0EB] border-t border-[#1F1916]/10">
        <div className="max-w-[1340px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Brocade Rolls Shot */}
            <div className="rounded-3xl overflow-hidden shadow-md bg-white p-3 aspect-[16/10] sm:aspect-[4/3] flex items-center justify-center">
              <img
                src="/images/editorial/rolls_brocade.jpg"
                alt="Pure Banarasi Brocade Fabric Rolls"
                className="w-full h-full object-cover rounded-2xl hover:scale-102 transition-transform duration-500"
              />
            </div>

            {/* Right Content */}
            <div>
              <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#1F1916]/50 font-semibold">
                HERITAGE WEFT & WARP
              </span>
              <h2 className="font-serif text-[36px] md:text-[46px] font-light text-[#1F1916] mt-2 mb-4 leading-tight">
                Vibrant Brocade Bolts
              </h2>
              <div className="w-12 h-[2px] bg-[#C5A059] mb-6" />
              <p className="text-[14px] text-[#1F1916]/75 font-sans leading-relaxed mb-6">
                Woven on traditional jacquard looms, each bolt features rich paisley motifs, metallic zari borders, and jewel tones engineered for lehengas, sherwanis, and luxury dupattas.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left mb-8">
                <div className="p-4 bg-white/70 rounded-xl">
                  <span className="text-[10px] font-sans tracking-widest text-[#1F1916]/50 uppercase block">WIDTH</span>
                  <span className="font-serif text-[18px] text-[#1F1916]">44 - 48 Inches</span>
                </div>
                <div className="p-4 bg-white/70 rounded-xl">
                  <span className="text-[10px] font-sans tracking-widest text-[#1F1916]/50 uppercase block">CRAFT</span>
                  <span className="font-serif text-[18px] text-[#1F1916]">Kadhwa & Tanchoi</span>
                </div>
              </div>
              <Link
                to="/shop/heritage"
                className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
              >
                Browse Heritage Weaves &rarr;
              </Link>
            </div>
          </div>

          {/* Second Row: Polka Dots & Pure Silks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16 md:mt-24">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#1F1916]/50 font-semibold">
                FLUIDITY & LUSTRE
              </span>
              <h2 className="font-serif text-[36px] md:text-[46px] font-light text-[#1F1916] mt-2 mb-4 leading-tight">
                Mulberry Silk Satin Dots
              </h2>
              <div className="w-12 h-[2px] bg-[#C5A059] mb-6" />
              <p className="text-[14px] text-[#1F1916]/75 font-sans leading-relaxed mb-6">
                Micro polka-dots jacquard-woven into high-sheen fluid silk satins. Breathable, featherweight, and ideal for contemporary saris, shirts, and tailored resort jackets.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left mb-8">
                <div className="p-4 bg-white/70 rounded-xl">
                  <span className="text-[10px] font-sans tracking-widest text-[#1F1916]/50 uppercase block">TOUCH</span>
                  <span className="font-serif text-[18px] text-[#1F1916]">Liquid Drape</span>
                </div>
                <div className="p-4 bg-white/70 rounded-xl">
                  <span className="text-[10px] font-sans tracking-widest text-[#1F1916]/50 uppercase block">BASE</span>
                  <span className="font-serif text-[18px] text-[#1F1916]">100% Pure Silk</span>
                </div>
              </div>
              <Link
                to="/shop/silks"
                className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
              >
                Browse Silk Satins &rarr;
              </Link>
            </div>

            {/* Right: Polka Silk Rolls Shot */}
            <div className="rounded-3xl overflow-hidden shadow-md bg-white p-3 aspect-[16/10] sm:aspect-[4/3] flex items-center justify-center order-1 lg:order-2">
              <img
                src="/images/editorial/rolls_polka.jpg"
                alt="Mulberry Silk Polka Rolls"
                className="w-full h-full object-cover rounded-2xl hover:scale-102 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ATELIER CONSULTATION BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#1F1916] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#C5A059] font-semibold block mb-3">
            BESPOKE ASSISTANCE
          </span>
          <h2 className="font-serif text-[32px] md:text-[44px] font-light text-white leading-tight mb-4">
            Need Fabric Swatches or Drapery Advice?
          </h2>
          <p className="text-[14px] text-white/70 font-sans leading-relaxed mb-8">
            Connect with our Bengaluru master drapers on WhatsApp for high-definition video walkthroughs, swatch dispatches, and custom meterage estimates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WA_VISIT}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#C5A059] text-[#1F1916] hover:bg-[#D4AF37] transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase rounded-xs"
            >
              Chat With Draper On WhatsApp
            </a>
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 transition-colors px-8 py-3.5 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase rounded-xs"
            >
              Explore Storefront
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
