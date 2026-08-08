import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { useAuth } from '../../context/AuthContext';
import { fetchRecommendedForUser } from '../../lib/recommendationsApi';
import ProductCard from '../ProductCard';
import Reveal from '../Reveal';
import SectionHeading from '../SectionHeading';
import type { Item } from '../../data/catalog';

export default function RecommendedForYou({ limit = 4 }: { limit?: number }) {
  const { user } = useAuth();
  const { items: catalog } = useCatalog();
  const [recommended, setRecommended] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchRecommendedForUser(limit).then((ids) => {
      if (ids.length > 0) {
        const matched = ids.map((id) => catalog.find((i) => i.id === id)).filter(Boolean) as Item[];
        setRecommended(matched);
      } else {
        // Cold start fallback: show top catalog items
        setRecommended(catalog.slice(0, limit));
      }
      setLoaded(true);
    });
  }, [user, catalog, limit]);

  if (!user || !loaded || !recommended.length) return null;

  return (
    <section className="bg-chocolate/30 py-12 sm:py-16 border-t border-gold/15">
      <div className="container-lux">
        <SectionHeading
          light
          kicker="Tailored For You"
          title="Recommended For You"
          sub="Handpicked couture fabrics based on your tastes and history."
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {recommended.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.05}>
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
