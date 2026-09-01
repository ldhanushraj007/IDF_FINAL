import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { inr } from '../lib/constants';

const CATEGORY_CARDS = [
  {
    id: 'bridal',
    title: 'BRIDAL',
    subtitle: 'Hand-embroidered tulles & organzas',
    image: '/images/collections/bridal.jpg',
  },
  {
    id: 'heritage',
    title: 'HERITAGE WEAVES',
    subtitle: 'Timeless weaves of India',
    image: '/images/collections/heritage.jpg',
  },
  {
    id: 'silks',
    title: 'SILKS',
    subtitle: 'Pure silks in their finest form',
    image: '/images/fabrics/f06.jpg',
  },
  {
    id: 'brocades',
    title: 'BROCADES',
    subtitle: 'Rich textures, Royal appeal',
    image: '/images/fabrics/f05.jpg',
  },
];

export default function CollectionsPage() {
  const { available } = useCatalog();

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
    <div className="bg-[#FAF7F5] text-[#1F1916] min-h-screen">
      {/* Breadcrumb Header */}
      <div className="w-full max-w-[1340px] mx-auto px-6 pt-6 pb-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60">
        <Link to="/" className="hover:text-[#1F1916] transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#1F1916]">COLLECTIONS</span>
      </div>

      {/* Hero Header with Full-Bleed Cherry Blossom Silk Background */}
      <section className="py-12 md:py-16 px-6 relative overflow-hidden bg-[#FAF7F5]">
        {/* Full-Bleed Right Background Image */}
        <div className="absolute right-0 top-0 w-full md:w-3/4 h-[480px] z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/collections-bg.jpg"
            alt="Cherry Blossom Branch on Silk"
            className="w-full h-full object-cover object-right-top scale-[1.24] origin-top-left"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
            }}
          />
          {/* Left-to-Right Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5] via-[#FAF7F5]/50 to-transparent pointer-events-none" />
          {/* Top-to-Bottom Fade Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5]/40 via-transparent to-[#FAF7F5] pointer-events-none" />
        </div>

        <div className="max-w-[1340px] mx-auto relative z-10">
          <h1 className="font-serif text-[44px] md:text-[68px] lg:text-[76px] text-[#1F1916] font-light leading-[1.05]">
            Explore<br />Our World
          </h1>
          <div className="w-14 h-[2px] bg-[#C5A059] mt-4 mb-10" />

          {/* 4 Rounded Category Grid matching Image 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORY_CARDS.map((card) => (
              <Link
                key={card.id}
                to={`/shop/${card.id}`}
                className="group flex flex-col bg-transparent overflow-hidden"
              >
                <div className="aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-2xl bg-[#E8E2DB] shadow-sm mb-4">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/fabrics/f01.jpg';
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-sans text-[13px] font-bold text-[#1F1916] tracking-[0.15em] uppercase">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-[#1F1916]/60 font-sans mt-1">
                    {card.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Collection Editorials */}
      {editorials.map((col, idx) => (
        <section
          key={col.category}
          className={`${idx % 2 === 0 ? 'bg-[#F3EEEA]' : 'bg-[#FAF7F5]'} py-16 md:py-24 px-6 border-t border-[#1F1916]/10`}
        >
          <div className="max-w-[1340px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <span className="text-[10px] font-sans tracking-[0.25em] text-[#1F1916]/50 uppercase font-semibold">{col.subtitle}</span>
                <h2 className="mt-3 font-serif text-[36px] md:text-[48px] text-[#1F1916] font-light leading-[1.05]">
                  {col.title}
                </h2>
                <p className="mt-5 text-[14px] text-[#1F1916]/70 leading-relaxed font-sans max-w-[440px]">
                  {col.description}
                </p>

                {/* Preview product list */}
                {col.items.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {col.items.map(item => (
                      <Link
                        key={item.id}
                        to={`/shop/product/${item.id}`}
                        className="flex items-center gap-4 py-2 group border-b border-[#1F1916]/5"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-sm"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-[15px] text-[#1F1916] group-hover:text-[#1F1916]/70 transition-colors truncate">
                            {item.name}
                          </p>
                          <p className="text-[12px] text-[#1F1916]/50 font-sans">{inr(item.pricePerMetre)} / metre</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  to={`/shop/${col.category}`}
                  className="inline-flex items-center justify-center bg-[#1F1916] text-white hover:bg-black transition-colors px-7 py-3 mt-8 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
                >
                  Shop {col.title} &rarr;
                </Link>
              </div>

              {/* Image */}
              <div className={`aspect-[4/5] overflow-hidden border border-[#1F1916]/10 shadow-sm ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                <img
                  src={col.image}
                  alt={col.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (col.items[0]) (e.target as HTMLImageElement).src = col.items[0].image;
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-[#1F1916] py-16 md:py-20 px-6 text-center text-white">
        <h2 className="font-serif text-[32px] md:text-[44px] text-white leading-tight font-light">
          Ready to discover?
        </h2>
        <p className="mt-4 text-[14px] text-white/70 max-w-[400px] mx-auto font-sans">
          Browse the complete catalogue, filter by category, and find the perfect fabric for your next creation.
        </p>
        <Link to="/shop" className="inline-block bg-[#E8E2DB] text-[#1F1916] hover:bg-white transition-colors px-8 py-3.5 mt-8 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase">
          Enter the Shop &rarr;
        </Link>
      </section>
    </div>
  );
}

