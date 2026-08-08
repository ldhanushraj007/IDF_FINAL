import { COLLECTIONS } from '../data/collections';
import { waLink } from '../lib/constants';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Collections() {
  return (
    <section id="collections" className="scroll-mt-20 bg-ivory py-16 sm:py-24 lg:py-28">
      <div className="container-lux">
        <SectionHeading
          kicker="The Collections"
          title="Three rooms, one house"
          sub="Every length in the archive lives in one of three edits — from heirloom handlooms to red-carpet embellishment."
        />

        <div className="mt-10 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-3">
          {COLLECTIONS.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.12}>
              <a
                href={waLink(`Hello! I'm interested in the ${c.name} collection.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-[3px]"
                aria-label={`Enquire about ${c.name} on WhatsApp`}
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  className="img-zoom aspect-[4/5] w-full object-cover md:aspect-[3/4]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-transparent"
                  aria-hidden="true"
                />
                <span className="frame-hover" aria-hidden="true" />

                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
                    {c.tagline}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug text-ivory md:text-xl lg:text-2xl">
                    {c.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ivory/65 md:max-lg:hidden">
                    {c.description}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold opacity-0 transition-all duration-500 ease-lux group-hover:opacity-100 touch:opacity-100">
                    Enquire on WhatsApp <span aria-hidden="true">→</span>
                  </p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
