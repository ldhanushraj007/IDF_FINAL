import { Instagram, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { BUSINESS, WA_VISIT } from '../lib/constants';

export default function VisitPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#FFE6E9] py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <span className="kicker-dark">Visit Us</span>
          <h1 className="mt-4 font-serif text-[42px] md:text-[64px] text-[#1F0505] leading-[0.95] tracking-tight max-w-[600px]">
            The showroom, off Commercial Street
          </h1>
          <p className="mt-5 text-[14px] text-[#1F0505]/50 max-w-[480px] leading-relaxed">
            Experience our fabrics in person. Touch the textures, see the true colours under natural light, and let our team help you find exactly what you need.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — Info */}
          <div>
            {/* Address */}
            <div className="flex items-start gap-3 mb-8">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#1F0505]/40" strokeWidth={1.5} />
              <div>
                <p className="text-[14px] text-[#1F0505]/70 leading-relaxed">
                  {BUSINESS.addressLine1}<br />
                  {BUSINESS.addressLine2}<br />
                  {BUSINESS.addressLine3}
                </p>
              </div>
            </div>

            {/* Phone */}
            <a
              href={`tel:${BUSINESS.phoneRaw}`}
              className="flex items-center gap-3 mb-8 font-serif text-2xl text-[#1F0505] hover:text-[#1F0505]/70 transition-colors"
            >
              <Phone className="h-5 w-5 shrink-0 text-[#1F0505]/40" strokeWidth={1.5} />
              {BUSINESS.phoneDisplay}
            </a>

            {/* Hours */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#1F0505]/40" strokeWidth={1.5} />
                <span className="font-sans text-[10px] font-semibold tracking-[0.15em] uppercase text-[#1F0505]/40">Opening Hours</span>
              </div>
              <div className="max-w-sm">
                {BUSINESS.hours.map((h) => (
                  <div
                    key={h.days}
                    className="flex items-baseline justify-between gap-6 py-2.5 border-b border-[#1F0505]/6 text-[13px]"
                  >
                    <span className="uppercase tracking-[0.1em] text-[#1F0505]/50 font-sans font-medium text-[11px]">{h.days}</span>
                    <span className="text-[#1F0505]/70">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WA_VISIT}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark btn-sheen"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
              <a
                href={BUSINESS.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Get Directions
              </a>
            </div>

            {/* Instagram */}
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#1F0505]/40 hover:text-[#1F0505] transition-colors"
            >
              <Instagram className="h-4 w-4 shrink-0" />
              {BUSINESS.instagramHandle}
            </a>
          </div>

          {/* Right — Map */}
          <div className="relative">
            <iframe
              title="Map to the In Design Luxury Fabrics showroom"
              src={BUSINESS.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="w-full h-[320px] sm:h-[420px] lg:h-full lg:min-h-[520px]"
              style={{ border: '1px solid rgba(31,5,5,0.08)', filter: 'sepia(0.1) saturate(0.9)' }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
