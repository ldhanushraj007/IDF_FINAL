import { Instagram, MapPin, Phone, MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BUSINESS, NAV_LINKS, WA_DEFAULT } from '../lib/constants';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#1F0505] text-white" style={{ borderTop: '2px solid #1F0505' }}>

      {/* ── Brand masthead strip ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 md:px-12 py-5"
        style={{ borderBottom: '1px solid rgba(255,230,233,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/images/logo/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="h-8 w-auto object-contain opacity-80"
          />
          <div>
            <div className="font-serif text-[18px] tracking-[0.1em] text-white uppercase leading-none font-medium">
              In Design
            </div>
            <div className="font-sans text-[7px] tracking-[0.3em] text-white/40 uppercase mt-0.5 font-semibold">
              Luxury Fabrics
            </div>
          </div>
        </div>
        <span className="font-sans text-[9px] tracking-[0.22em] text-white/30 uppercase hidden md:block">
          Est. 2009 — {BUSINESS.city}
        </span>
      </div>

      {/* ── Main content grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

        {/* Col 1 — About */}
        <div
          className="px-6 md:px-8 py-10"
          style={{ borderRight: '1px solid rgba(255,230,233,0.1)', borderBottom: '1px solid rgba(255,230,233,0.1)' }}
        >
          <p className="font-sans text-[8px] tracking-[0.28em] text-white/30 uppercase font-bold mb-4">
            About
          </p>
          <p className="font-sans text-[12px] leading-relaxed text-white/50 max-w-[240px]">
            Curated couture and bridal fabrics, available by the metre. Bengaluru's finest fabric house since 2009.
          </p>
          {/* Social */}
          <div className="flex items-center gap-3 mt-6">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center justify-center w-8 h-8 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={WA_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex items-center justify-center w-8 h-8 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Col 2 — Navigation */}
        <div
          className="px-6 md:px-8 py-10"
          style={{ borderRight: '1px solid rgba(255,230,233,0.1)', borderBottom: '1px solid rgba(255,230,233,0.1)' }}
        >
          <p className="font-sans text-[8px] tracking-[0.28em] text-white/30 uppercase font-bold mb-4">
            Navigate
          </p>
          <nav className="flex flex-col">
            {NAV_LINKS.map((l, i) => (
              <Link
                key={l.href}
                to={l.href}
                className="font-sans text-[12px] text-white/50 hover:text-white transition-colors py-2 flex items-center gap-2"
                style={i < NAV_LINKS.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}
              >
                <span className="text-white/20 text-[9px] font-medium">{String(i + 1).padStart(2, '0')}</span>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Col 3 — Customer Care */}
        <div
          className="px-6 md:px-8 py-10"
          style={{ borderRight: '1px solid rgba(255,230,233,0.1)', borderBottom: '1px solid rgba(255,230,233,0.1)' }}
        >
          <p className="font-sans text-[8px] tracking-[0.28em] text-white/30 uppercase font-bold mb-4">
            Customer Care
          </p>
          <nav className="flex flex-col">
            {[
              'Shipping & Delivery',
              'Returns & Exchanges',
              'Fabric Care Guide',
              'Privacy Policy',
              'Terms of Service',
            ].map((label, i, arr) => (
              <a
                key={label}
                href="#"
                className="font-sans text-[12px] text-white/50 hover:text-white transition-colors py-2"
                style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Col 4 — Contact */}
        <div
          className="px-6 md:px-8 py-10"
          style={{ borderBottom: '1px solid rgba(255,230,233,0.1)' }}
        >
          <p className="font-sans text-[8px] tracking-[0.28em] text-white/30 uppercase font-bold mb-4">
            Contact
          </p>
          <div className="space-y-4">
            <a
              href={`tel:${BUSINESS.phoneRaw}`}
              className="flex items-center gap-3 group"
            >
              <span
                className="flex items-center justify-center w-7 h-7 shrink-0 text-white/40 group-hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className="font-sans text-[12px] text-white/60 group-hover:text-white transition-colors">
                {BUSINESS.phoneDisplay}
              </span>
            </a>
            <a
              href={WA_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <span
                className="flex items-center justify-center w-7 h-7 shrink-0 text-white/40 group-hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
              <span className="font-sans text-[12px] text-white/60 group-hover:text-white transition-colors">
                WhatsApp Us
              </span>
            </a>
            <a
              href={`mailto:${BUSINESS.email}`}
              className="flex items-center gap-3 group"
            >
              <span
                className="flex items-center justify-center w-7 h-7 shrink-0 text-white/40 group-hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Mail className="h-3.5 w-3.5" />
              </span>
              <span className="font-sans text-[11px] text-white/60 group-hover:text-white transition-colors break-all">
                {BUSINESS.email}
              </span>
            </a>
            <div className="flex items-start gap-3">
              <span
                className="flex items-center justify-center w-7 h-7 shrink-0 text-white/30"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <div className="font-sans text-[11px] text-white/40 leading-relaxed">
                <p>{BUSINESS.addressLine1}</p>
                <p>{BUSINESS.addressLine2}</p>
                <p>{BUSINESS.addressLine3}</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-sans text-[8px] tracking-[0.25em] text-white/25 uppercase font-bold mb-2">
              Showroom Hours
            </p>
            {BUSINESS.hours.map(h => (
              <div key={h.days} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-sans text-[10px] text-white/40">{h.days}</span>
                <span className="font-sans text-[10px] text-white/60 font-semibold">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(255,230,233,0.12)' }}
      >
        <p className="font-sans text-[9px] text-white/25 tracking-[0.18em] uppercase font-medium">
          © {year} {BUSINESS.legalName}. All rights reserved.
        </p>
        <p className="font-sans text-[9px] text-white/20 tracking-[0.12em] uppercase">
          Curated in {BUSINESS.city} · Luxury Fabrics Since 2009
        </p>
      </div>
    </footer>
  );
}
