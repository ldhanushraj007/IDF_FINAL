import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { fetchTopPicks } from '../../lib/recommendationsApi';
import ProductCard from '../ProductCard';
import Reveal from '../Reveal';
import SectionHeading from '../SectionHeading';
import type { Item } from '../../data/catalog';

export default function TopPicks({ limit = 4 }: { limit?: number }) {
  const { items: catalog } = useCatalog();
  const [topItems, setTopItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchTopPicks(limit).then((ids) => {
      if (ids.length > 0) {
        const matched = ids.map((id) => catalog.find((i) => i.id === id)).filter(Boolean) as Item[];
        setTopItems(matched);
      } else {
        // Cold start / static fallback: pick items with 'best-seller' tag or top catalog items
        const bestSellers = catalog.filter((i) => i.tags.includes('best-seller')).slice(0, limit);
        setTopItems(bestSellers.length ? bestSellers : catalog.slice(0, limit));
      }
      setLoaded(true);
    });
  }, [catalog, limit]);

  if (!loaded || !topItems.length) return null;

  return (
    <section className="bg-night py-12 sm:py-16 border-t border-gold/15">
      <div className="container-lux">
        <SectionHeading
          light
          kicker="Curated Selection"
          title="Top Picks"
          sub="Most favored luxury fabrics based on real customer interest."
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {topItems.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.05}>
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
