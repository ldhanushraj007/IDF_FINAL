import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { getRecentlyViewedIds } from '../../lib/useTrackInteraction';
import ProductCard from '../ProductCard';
import Reveal from '../Reveal';
import type { Item } from '../../data/catalog';

interface Props {
  excludeId?: string;
  limit?: number;
}

export default function RecentlyViewed({ excludeId, limit = 4 }: Props) {
  const { items: catalog } = useCatalog();
  const [recentItems, setRecentItems] = useState<Item[]>([]);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    const filteredIds = excludeId ? ids.filter((id) => id !== excludeId) : ids;
    const matched = filteredIds
      .map((id) => catalog.find((i) => i.id === id))
      .filter(Boolean)
      .slice(0, limit) as Item[];
    setRecentItems(matched);
  }, [catalog, excludeId, limit]);

  if (!recentItems.length) return null;

  return (
    <div className="w-full">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {recentItems.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.05}>
            <ProductCard item={item} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
