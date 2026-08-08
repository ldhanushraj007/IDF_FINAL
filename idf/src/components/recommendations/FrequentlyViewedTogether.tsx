import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { fetchFrequentlyTogether } from '../../lib/recommendationsApi';
import ProductCard from '../ProductCard';
import Reveal from '../Reveal';
import type { Item } from '../../data/catalog';

interface Props {
  currentProduct: Item;
  limit?: number;
}

export default function FrequentlyViewedTogether({ currentProduct, limit = 4 }: Props) {
  const { items: catalog } = useCatalog();
  const [frequent, setFrequent] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!currentProduct) return;

    fetchFrequentlyTogether(currentProduct.id, limit).then((ids) => {
      if (ids.length > 0) {
        const matched = ids.map((id) => catalog.find((i) => i.id === id)).filter(Boolean) as Item[];
        setFrequent(matched);
      } else {
        // Fallback: items from the same category excluding current product
        const sameCategory = catalog.filter((i) => i.category === currentProduct.category && i.id !== currentProduct.id).slice(0, limit);
        setFrequent(sameCategory);
      }
      setLoaded(true);
    });
  }, [currentProduct, catalog, limit]);

  if (!loaded || !frequent.length) return null;

  return (
    <div className="mt-12 sm:mt-16 border-t border-gold/15 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Pairs Exceptionally Well</span>
          <h3 className="font-serif text-xl sm:text-2xl text-ivory mt-1">Frequently Viewed Together</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {frequent.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.05}>
            <ProductCard item={item} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
