import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TAG_LABELS, type Tag } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { ORDER, inr } from '../lib/constants';
import ProductCard from './ProductCard';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

type Filter = 'all' | Tag;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All Fabrics' },
  { id: 'best-seller', label: TAG_LABELS['best-seller'] },
  { id: 'new-arrival', label: TAG_LABELS['new-arrival'] },
  { id: 'festival', label: TAG_LABELS.festival },
  { id: 'seasonal', label: TAG_LABELS.seasonal },
  { id: 'wholesale', label: TAG_LABELS.wholesale },
];

export default function Shop() {
  const { items: catalog } = useCatalog();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(
    () => (filter === 'all' ? catalog : catalog.filter((i) => i.tags.includes(filter))),
    [filter, catalog],
  );

  return (
    <section id="shop" className="scroll-mt-20 py-16 sm:py-24 lg:py-28" style={{ backgroundColor: '#884d23' }}>
      <div className="container-lux">
        <SectionHeading
          light
          kicker="The Shop"
          title="Order by the metre"
          sub="Cut to your requirement and shipped across India. Pay securely by UPI, or reserve and settle at the showroom."
        />

        {/* Filter rail — scrolls horizontally on phones */}
        <Reveal className="mt-8 sm:mt-12">
          <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap sm:justify-center">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={active}
                    className={`relative shrink-0 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 sm:px-5 ${
                      active ? 'text-night' : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="shop-pill"
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="absolute inset-0 rounded-full bg-gold"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {filter === 'wholesale' && (
          <Reveal className="mx-auto mt-6 max-w-2xl rounded-[3px] border border-gold/30 bg-gold/5 p-4 text-center">
            <p className="text-[13px] leading-relaxed text-ivory/75">
              Wholesale pricing applies automatically —{' '}
              <span className="font-semibold text-gold">
                {Math.round(ORDER.wholesaleDiscount * 100)}% off
              </span>{' '}
              on total orders of {ORDER.wholesaleMinMetres} metres or more, across any fabrics.
            </p>
          </Reveal>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 0.06}>
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center text-[12px] leading-relaxed text-ivory/45 sm:mt-12">
          <p>
            Free shipping across India on orders above {inr(ORDER.freeShippingAbove)} · Swatches
            posted on request · GST invoice provided
          </p>
        </Reveal>
      </div>
    </section>
  );
}
