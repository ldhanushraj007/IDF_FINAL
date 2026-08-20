const ITEMS = [
  'NEW COLLECTIONS ARRIVING THIS WEEK',
  'GLOBAL SHIPPING AVAILABLE',
  'PREMIUM FABRICS CUT BY THE METRE',
  'VISIT OUR BANGALORE SHOWROOM'
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="grid-line bg-primary text-on-primary py-3 overflow-hidden whitespace-nowrap border-b border-[#1a1a1a]" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-0 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-6 pr-6 font-label-caps text-label-caps text-on-primary tracking-widest uppercase"
          >
            {item}
            <span className="text-brand-gold font-bold">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
