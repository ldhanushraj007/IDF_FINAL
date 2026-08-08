import { ArrowUp, Instagram, MapPin, Phone } from 'lucide-react';
import { BUSINESS, NAV_LINKS } from '../lib/constants';
import Wordmark from './Wordmark';

export default function Footer() {
  return (
    <footer className="bg-night pb-8 pt-14 text-ivory/70 sm:pt-16">
      <div className="container-lux">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <Wordmark tone="light" />
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-ivory/55">
              {BUSINESS.tagline}. Heritage silks, bridal couture and designer fabrics — curated in{' '}
              {BUSINESS.city} since 2009.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="kicker-light">Explore</p>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-[13.5px] tracking-wide transition-colors hover:text-gold">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="kicker-light">Contact</p>
            <ul className="mt-5 space-y-4 text-[13.5px] leading-relaxed">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                <span>
                  {BUSINESS.addressLine1},<br />
                  {BUSINESS.addressLine2},<br />
                  {BUSINESS.addressLine3}
                </span>
              </li>
              <li>
                <a href={`tel:${BUSINESS.phoneRaw}`} className="flex items-center gap-3 transition-colors hover:text-gold">
                  <Phone className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                  {BUSINESS.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 break-all transition-colors hover:text-gold"
                >
                  <Instagram className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                  {BUSINESS.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/10 pt-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/40 sm:text-[11px] sm:tracking-[0.22em]">
            © {new Date().getFullYear()} {BUSINESS.legalName} · {BUSINESS.city}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-night"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
