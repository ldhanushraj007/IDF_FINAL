import { Instagram, Lock, ShieldCheck } from 'lucide-react';
import { BUSINESS } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="grid-line-top grid grid-cols-1 md:grid-cols-4 w-full px-margin-page py-8 bg-surface text-primary border-t border-[#1a1a1a] relative">
      <span className="index-badge">05</span>
      
      <div className="border-r border-[#1a1a1a] pr-8 pl-8 md:pl-0 flex flex-col justify-between min-h-[100px]">
        <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">NEED HELP?</h4>
        <a href={`tel:${BUSINESS.phoneRaw}`} className="font-body-lg text-primary hover:text-brand-gold transition-colors">
          {BUSINESS.phoneDisplay}
        </a>
      </div>

      <div className="border-r border-[#1a1a1a] px-8 flex flex-col justify-between min-h-[100px]">
        <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">SHOWROOM</h4>
        <p className="font-body-lg text-primary">{BUSINESS.city}</p>
      </div>

      <div className="border-r border-[#1a1a1a] px-8 flex flex-col justify-between min-h-[100px]">
        <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2">HOURS</h4>
        <p className="font-body-lg text-primary">Mon - Sat: 10am - 8pm</p>
      </div>

      <div className="px-8 flex flex-col justify-between items-start md:items-end min-h-[100px] relative">
        <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-2 md:w-full md:text-right">FOLLOW US</h4>
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
        <p className="mt-4 font-label-caps text-[10px] text-secondary w-full text-left md:text-right uppercase tracking-widest">
          © {new Date().getFullYear()} {BUSINESS.legalName}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
