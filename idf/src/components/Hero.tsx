import { BUSINESS } from '../lib/constants';

export default function Hero() {
  return (
    <section id="top" className="grid-line relative border-b border-[#1a1a1a] bg-[#F2F1EC]">
      <span className="index-badge">02</span>

      {/* 3-column hero grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0 min-h-[340px] md:min-h-[280px]">
        {/* Col 1 — Big headline */}
        <div className="flex items-end px-6 md:px-12 py-12 md:py-16">
          <h1 className="font-serif text-[54px] md:text-[84px] lg:text-[100px] text-primary leading-[0.9] tracking-tight">
            Order by<br />the metre.
          </h1>
        </div>

        {/* Col 2 — Numbered features */}
        <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[260px]">
          <ul className="space-y-0 w-full">
            {[
              { n: '01', label: 'PREMIUM FABRICS' },
              { n: '02', label: 'CUT TO YOUR REQUIREMENT' },
              { n: '03', label: 'SHIPPED ACROSS INDIA' },
              { n: '04', label: 'PAY SECURELY BY UPI' },
            ].map((f) => (
              <li key={f.n} className="flex items-center gap-4 py-3 border-b border-[#1a1a1a]/15 last:border-b-0">
                <span className="font-mono text-[10px] text-secondary w-5 shrink-0">{f.n}</span>
                <span className="font-label-caps text-[10px] tracking-[0.15em] text-secondary">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Tagline */}
        <div className="border-t md:border-t-0 md:border-l border-[#1a1a1a] px-8 py-12 flex items-center min-w-[220px]">
          <div>
            <div className="w-8 h-px bg-[#1a1a1a]/30 mb-4" />
            <p className="font-serif text-[18px] text-primary leading-snug max-w-[200px]">
              Luxury couture and bridal fabrics, curated in {BUSINESS.city}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
