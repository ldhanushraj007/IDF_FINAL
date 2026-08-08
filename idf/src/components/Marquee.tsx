const ITEMS = [
  'Banarasi Silks',
  'Bridal Couture',
  'Zardozi Handwork',
  'Silk Organza',
  'Duchess Satin',
  'Kanjivaram',
  'Raw Silk',
  'Couture Velvets',
];

/** Continuous gold-thread ribbon of the house specialities. */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="group overflow-hidden border-y border-gold/25 bg-night py-4 sm:py-5" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-0 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-6 pr-6 text-[11px] uppercase tracking-[0.26em] text-ivory/70 sm:gap-8 sm:pr-8 sm:text-[13px] sm:tracking-[0.34em]"
          >
            {item}
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
