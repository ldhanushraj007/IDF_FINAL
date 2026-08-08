import { useState } from 'react';
import { Instagram } from 'lucide-react';
import { GALLERY } from '../data/gallery';
import { BUSINESS } from '../lib/constants';
import Lightbox from './Lightbox';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const IMAGES = GALLERY.slice(0, 9);

export default function Gallery() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className="scroll-mt-20 bg-cream py-16 sm:py-24 lg:py-28">
      <div className="container-lux">
        <SectionHeading
          kicker="The Gallery"
          title="Texture, up close"
          sub="Weaves, zari and handwork from the archive — photographed in the showroom's own light."
        />

        <div className="mt-10 columns-2 gap-3 sm:mt-16 sm:gap-4 md:columns-3">
          {IMAGES.map((img, i) => (
            <Reveal key={img.src} delay={(i % 3) * 0.08} className="mb-3 break-inside-avoid sm:mb-4">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group relative block w-full overflow-hidden rounded-[3px]"
                aria-label={`View larger: ${img.alt}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className="img-zoom w-full object-cover"
                />
                <span
                  className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/25"
                  aria-hidden="true"
                />
                <span className="frame-hover" aria-hidden="true" />
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center sm:mt-14">
          <a
            href={BUSINESS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:text-gold-dark sm:text-[13px] sm:tracking-[0.24em]"
          >
            <Instagram className="h-4 w-4 shrink-0 text-gold-dark" />
            <span>More on Instagram — {BUSINESS.instagramHandle}</span>
            <span
              className="hidden h-px w-8 bg-gold transition-all duration-500 ease-lux group-hover:w-14 sm:block"
              aria-hidden="true"
            />
          </a>
        </Reveal>
      </div>

      <Lightbox images={IMAGES} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </section>
  );
}
