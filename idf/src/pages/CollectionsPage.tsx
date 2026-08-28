import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { BUSINESS, inr } from '../lib/constants';
import { COLLECTIONS } from '../data/collections';

export default function CollectionsPage() {
  const { available } = useCatalog();

  // Featured items for the collection preview
  const bridalItems = available.filter(i => i.category === 'Bridal').slice(0, 3);
  const heritageItems = available.filter(i => i.category === 'Heritage').slice(0, 3);
  const contemporaryItems = available.filter(i => i.category === 'Contemporary').slice(0, 3);

  const editorials = [
    {
      title: 'Bridal Edit',
      subtitle: 'For the day that begins forever',
      description: 'Hand-embroidered tulles, pearl organzas, and heirloom silks chosen for the most significant garment a woman will ever wear.',
      items: bridalItems,
      category: 'bridal',
      image: '/images/collections/bridal.jpg',
    },
    {
      title: 'Heritage Weaves',
      subtitle: 'Ancient looms, living tradition',
      description: 'Banarasi kadhwa, Kanjivaram temple silks, and tussar handlooms — each bolt carries the story of generations of weavers.',
      items: heritageItems,
      category: 'heritage',
      image: '/images/collections/heritage.jpg',
    },
    {
      title: 'Contemporary Drapes',
      subtitle: 'New silhouettes, refined textures',
      description: 'Crêpe de Chine, liquid satins, and linen-silk blends for the modern wardrobe — fluid, breathable, quietly luxurious.',
      items: contemporaryItems,
      category: 'contemporary',
      image: '/images/collections/contemporary.jpg',
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-white py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <span className="kicker-dark">The Collections</span>
          <h1 className="mt-4 font-serif text-[42px] md:text-[64px] lg:text-[80px] text-[#1F0505] leading-[0.95] tracking-tight max-w-[800px]">
            Three rooms,<br />one house.
          </h1>
          <p className="mt-6 text-[15px] text-[#1F0505]/50 max-w-[520px] leading-relaxed">
            Every length in the archive lives in one of three edits — from heirloom handlooms to red-carpet advancement. Explore the world of In Design.
          </p>
        </div>
      </section>

      {/* Collection editorials */}
      {editorials.map((col, idx) => (
        <section
          key={col.category}
          className={`${idx % 2 === 0 ? 'bg-[#FFE6E9]' : 'bg-white'} py-16 md:py-24 px-6 md:px-12`}
          style={{ borderTop: '1px solid rgba(31,5,5,0.06)' }}
        >
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <span className="kicker-dark">{col.subtitle}</span>
                <h2 className="mt-3 font-serif text-[36px] md:text-[48px] text-[#1F0505] leading-[1.05]">
                  {col.title}
                </h2>
                <p className="mt-5 text-[14px] text-[#1F0505]/50 leading-relaxed max-w-[440px]">
                  {col.description}
                </p>

                {/* Preview product list */}
                {col.items.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {col.items.map(item => (
                      <Link
                        key={item.id}
                        to={`/shop/product/${item.id}`}
                        className="flex items-center gap-4 py-2 group"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-[15px] text-[#1F0505] group-hover:text-[#1F0505]/70 transition-colors truncate">
                            {item.name}
                          </p>
                          <p className="text-[12px] text-[#1F0505]/40 font-sans">{inr(item.pricePerMetre)} / metre</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  to={`/shop/${col.category}`}
                  className="btn btn-dark btn-sheen mt-8"
                >
                  Shop {col.title}
                </Link>
              </div>

              {/* Image */}
              <div className={`aspect-[4/5] overflow-hidden ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                <img
                  src={col.image}
                  alt={col.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to first item image if collection image doesn't exist
                    if (col.items[0]) (e.target as HTMLImageElement).src = col.items[0].image;
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-[#1F0505] py-16 md:py-20 px-6 md:px-12 text-center">
        <h2 className="font-serif text-[32px] md:text-[44px] text-white leading-tight">
          Ready to discover?
        </h2>
        <p className="mt-4 text-[14px] text-white/50 max-w-[400px] mx-auto">
          Browse the complete catalogue, filter by category, and find the perfect fabric for your next creation.
        </p>
        <Link to="/shop" className="btn btn-blush btn-sheen mt-8 !text-[#1F0505]">
          Enter the Shop
        </Link>
      </section>
    </>
  );
}
