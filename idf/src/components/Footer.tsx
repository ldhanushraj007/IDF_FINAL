import { Instagram, MapPin, Phone, MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BUSINESS, NAV_LINKS, WA_DEFAULT } from '../lib/constants';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#191514] text-white">
      {/* ── Brand masthead strip ─────────────────────────────────────── */}
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-12 py-6 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/images/logo/logo-mark.png"
            alt="In Design Luxury Fabrics Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div>
            <div className="font-serif text-[20px] tracking-[0.14em] text-white uppercase font-light">
              In Design
            </div>
            <div className="font-sans text-[8px] tracking-[0.3em] text-white/50 uppercase mt-0.5 font-semibold">
              Luxury Fabrics
            </div>
          </div>
        </Link>
        <span className="font-sans text-[10px] tracking-[0.2em] text-white/40 uppercase hidden md:block">
          Est. 2009 — {BUSINESS.city}
        </span>
      </div>

      {/* ── Main content grid ─────────────────────────────────────────── */}
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-12 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1 — About */}
        <div>
          <p className="font-sans text-[9px] tracking-[0.25em] text-white/40 uppercase font-semibold mb-4">
            ABOUT
          </p>
          <p className="font-sans text-[13px] leading-relaxed text-white/60">
            Curated couture and bridal fabrics, available by the metre. Bengaluru's finest fabric house since 2009.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={WA_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Col 2 — Navigation */}
        <div>
          <p className="font-sans text-[9px] tracking-[0.25em] text-white/40 uppercase font-semibold mb-4">
            NAVIGATE
          </p>
          <nav className="flex flex-col space-y-2.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="font-sans text-[13px] text-white/60 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Col 3 — Customer Care */}
        <div>
          <p className="font-sans text-[9px] tracking-[0.25em] text-white/40 uppercase font-semibold mb-4">
            CUSTOMER CARE
          </p>
          <nav className="flex flex-col space-y-2.5 font-sans text-[13px] text-white/60">
            {[
              'Shipping & Delivery',
              'Returns & Exchanges',
              'Fabric Care Guide',
              'Privacy Policy',
              'Terms of Service',
            ].map((label) => (
              <a
                key={label}
                href="#"
                className="hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Col 4 — Contact */}
        <div>
          <p className="font-sans text-[9px] tracking-[0.25em] text-white/40 uppercase font-semibold mb-4">
            SHOWROOM CONTACT
          </p>
          <div className="space-y-3.5 font-sans text-[13px] text-white/70">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-white/50 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[12px] leading-relaxed text-white/60">
                Commercial Street, Tasker Town, Bengaluru, Karnataka 560001
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-white/50 shrink-0" strokeWidth={1.5} />
              <a href={`tel:${BUSINESS.phoneRaw}`} className="hover:text-white transition-colors">
                +91 80 4123 4567
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-white/50 shrink-0" strokeWidth={1.5} />
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-white transition-colors break-all">
                hello@indesignfabrics.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div className="w-full border-t border-white/10 px-6 md:px-12 py-5">
        <div className="max-w-[1340px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-sans text-white/40 tracking-[0.15em] uppercase">
          <p>© {year} {BUSINESS.legalName}. All rights reserved.</p>
          <p>Curated in {BUSINESS.city} · Luxury Fabrics Since 2009</p>
        </div>
      </div>
    </footer>
  );
}
