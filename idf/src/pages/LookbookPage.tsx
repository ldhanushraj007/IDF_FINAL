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
    </div>
  );
}
