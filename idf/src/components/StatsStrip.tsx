import Counter from './Counter';

const STATS = [
  { value: 15, label: 'Years of Heritage' },
  { value: 5000, label: 'Curated Fabrics' },
  { value: 800, label: 'Designers & Boutiques' },
  { value: 25, label: 'Countries Shipped' },
];

export default function StatsStrip() {
  return (
    <section className="relative overflow-hidden bg-maroon py-12 sm:py-16">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold/40" aria-hidden="true" />
      <div className="container-lux grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-y-10 lg:grid-cols-4">
        {STATS.map((s) => (
          <Counter key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold/40" aria-hidden="true" />
    </section>
  );
}
