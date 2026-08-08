import { Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BUSINESS, WA_VISIT } from '../lib/constants';
import Reveal from './Reveal';

export default function Visit() {
  return (
    <section id="visit" className="scroll-mt-20 bg-ivory py-16 sm:py-24 lg:py-28">
      <div className="container-lux grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="kicker">Visit Us</p>
          <h2 className="mt-4 font-serif text-3xl leading-[1.1] text-ink sm:text-4xl md:text-5xl md:leading-[1.08]">
            The showroom, off Commercial Street
          </h2>

          <address className="mt-7 flex items-start gap-3 not-italic sm:gap-4">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
            <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
              {BUSINESS.addressLine1}
              <br />
              {BUSINESS.addressLine2}
              <br />
              {BUSINESS.addressLine3}
            </p>
          </address>

          <a
            href={`tel:${BUSINESS.phoneRaw}`}
            className="mt-6 inline-flex items-center gap-3 font-serif text-2xl text-ink transition-colors hover:text-gold-dark sm:gap-4 sm:text-3xl"
          >
            <Phone className="h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
            {BUSINESS.phoneDisplay}
          </a>

          <div className="mt-7 max-w-sm">
            {BUSINESS.hours.map((h) => (
              <div
                key={h.days}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-walnut/15 py-3 text-[13px] sm:text-[13.5px]"
              >
                <span className="uppercase tracking-[0.12em] text-walnut">{h.days}</span>
                <span className="text-muted">{h.time}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href={WA_VISIT}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-sheen w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <a
              href={BUSINESS.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-dark w-full sm:w-auto"
            >
              Get Directions
            </a>
          </div>

          <a
            href={BUSINESS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2.5 break-all text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark transition-colors hover:text-ink sm:text-[13px] sm:tracking-[0.2em]"
          >
            <Instagram className="h-4 w-4 shrink-0" />
            {BUSINESS.instagramHandle}
          </a>
        </Reveal>

        <Reveal delay={0.15} className="relative">
          <span
            className="absolute -inset-2 hidden -translate-x-4 translate-y-4 border border-gold/40 sm:-inset-3 sm:block"
            aria-hidden="true"
          />
          <iframe
            title="Map to the In Design Luxury Fabrics showroom"
            src={BUSINESS.mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="map-tint relative h-[320px] w-full rounded-[3px] ring-1 ring-gold/30 sm:h-[420px] lg:h-full lg:min-h-[520px]"
          />
        </Reveal>
      </div>
    </section>
  );
}
