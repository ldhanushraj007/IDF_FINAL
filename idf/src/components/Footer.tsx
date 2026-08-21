import { Instagram } from 'lucide-react';
import { BUSINESS } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="w-full bg-surface text-primary border-t border-[#1a1a1a]">
      {/* Index label row */}
      <div className="px-margin-page border-b border-[#1a1a1a] py-1.5 flex items-center">
        <span className="font-label-caps text-[10px] text-secondary">05</span>
      </div>

      {/* 4-column footer grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 px-margin-page py-8">

        {/* Col 1 — Need Help */}
        <div className="border-r border-[#1a1a1a] pr-8 flex flex-col justify-between min-h-[100px]">
          <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">NEED HELP?</h4>
          <a
            href={`tel:${BUSINESS.phoneRaw}`}
            className="font-body-lg text-primary hover:text-brand-gold transition-colors"
          >
            {BUSINESS.phoneDisplay}
          </a>
        </div>

        {/* Col 2 — Showroom */}
        <div className="border-r border-[#1a1a1a] px-8 flex flex-col justify-between min-h-[100px]">
          <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">SHOWROOM</h4>
          <p className="font-body-lg text-primary">{BUSINESS.city}</p>
        </div>

        {/* Col 3 — Hours */}
        <div className="border-r border-[#1a1a1a] px-8 flex flex-col justify-between min-h-[100px]">
          <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">HOURS</h4>
          <p className="font-body-lg text-primary">Mon – Sat: 10am – 8pm</p>
        </div>

        {/* Col 4 — Follow Us + Copyright — pr-16 keeps text clear of WhatsApp button */}
        <div className="pl-8 pr-16 flex flex-col justify-between items-start md:items-end min-h-[100px]">
          <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2 md:w-full md:text-right">
            FOLLOW US
          </h4>
          <div className="flex gap-4 md:w-full md:justify-end">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-brand-gold transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-4 font-label-caps text-[10px] text-secondary w-full text-left md:text-right uppercase tracking-widest leading-relaxed">
            © {new Date().getFullYear()} {BUSINESS.legalName}.<br className="md:hidden" /> ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>
    </footer>
  );
}
