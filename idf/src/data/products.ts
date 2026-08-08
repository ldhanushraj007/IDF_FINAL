export type Category = 'bridal' | 'heritage' | 'contemporary';

export interface Product {
  slug: string;
  name: string;
  category: Category;
  description: string;
  composition: string;
  width: string;
  gsm: string;
  price?: string;
  moq: string;
  availability: 'In Stock' | 'Made to Order' | 'Limited Edition';
  care: string;
  applications: string[];
  details: string;
  image: string;
  featured?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  bridal: 'Bridal & Red-Carpet Luxe',
  heritage: 'Heritage & Festive Silks',
  contemporary: 'Contemporary Designer',
};

/** Extra close-up shots shown on product detail pages, per category. */
export const CATEGORY_DETAIL_IMAGES: Record<Category, string[]> = {
  bridal: ['/images/fabrics/detail-bridal-1.jpg', '/images/fabrics/detail-bridal-2.jpg'],
  heritage: ['/images/fabrics/detail-heritage-1.jpg', '/images/fabrics/detail-heritage-2.jpg'],
  contemporary: [
    '/images/fabrics/detail-contemporary-1.jpg',
    '/images/fabrics/detail-contemporary-2.jpg',
  ],
};

export const PRODUCTS: Product[] = [
  // ── Bridal & Red-Carpet Luxe ────────────────────────────────
  {
    slug: 'aurelia-embroidered-tulle',
    name: 'Aurelia Hand-Embroidered Tulle',
    category: 'bridal',
    description:
      'A whisper-light silk tulle scattered with hand-set zardozi motifs and cut-glass beads — made for veils and trailing bridal overlays.',
    composition: 'Pure Silk Tulle · Zardozi Handwork',
    width: '54" / 137 cm',
    gsm: '45 GSM',
    price: '₹6,400 / metre',
    moq: '1 metre (trade 20 m+)',
    availability: 'Made to Order',
    care: 'Dry clean only. Store rolled in acid-free tissue and never fold across the embroidery.',
    applications: ['Bridal veils', 'Gown overlays', 'Trains & dupattas'],
    details:
      'Embroidered across a nine-inch repeat by our zardozi karigars in Lucknow. Motifs can be recoloured or scaled to order for full bridal ensembles.',
    image: '/images/fabrics/f01.jpg',
  },
  {
    slug: 'noor-pearl-organza',
    name: 'Noor Pearl Organza',
    category: 'bridal',
    description:
      'Crisp silk organza seeded with hand-sewn pearls and matte sequins — sculptural volume that still floats.',
    composition: '100% Silk Organza · Pearl Handwork',
    width: '44" / 112 cm',
    gsm: '55 GSM',
    price: '₹4,950 / metre',
    moq: '1 metre (trade 20 m+)',
    availability: 'In Stock',
    care: 'Dry clean. Press on low heat through a cotton cloth; keep steam away from the pearls.',
    applications: ['Reception gowns', 'Structured sleeves', 'Overskirts & capes'],
    details:
      'The pearl scatter grows denser towards one selvedge, letting designers place weight exactly where a silhouette needs it.',
    image: '/images/fabrics/f02.jpg',
    featured: true,
  },
  {
    slug: 'celestine-beaded-net',
    name: 'Celestine Beaded Net',
    category: 'bridal',
    description:
      'Champagne tulle showered with crystal beadwork that catches every camera flash — our red-carpet signature.',
    composition: 'Nylon-Silk Net · Crystal Beadwork',
    width: '54" / 137 cm',
    gsm: '60 GSM',
    price: '₹7,800 / metre',
    moq: '1 metre (trade 15 m+)',
    availability: 'Limited Edition',
    care: 'Dry clean only. Hang on padded hangers; avoid contact with velcro and rough surfaces.',
    applications: ['Red-carpet gowns', 'Sarees & drapes', 'Evening capes'],
    details:
      'Beaded in a graduated shower — sparse at the shoulder line, cascading dense at the hem — so a single length reads as a finished design.',
    image: '/images/fabrics/f03.jpg',
  },
  {
    slug: 'isabeau-duchess-satin',
    name: 'Isabeau Duchess Satin',
    category: 'bridal',
    description:
      'A double-faced mulberry duchess satin with a deep, quiet lustre — the architect of structured bridal silhouettes.',
    composition: '100% Mulberry Silk',
    width: '54" / 137 cm',
    gsm: '190 GSM',
    price: '₹5,600 / metre',
    moq: '1 metre (trade 25 m+)',
    availability: 'In Stock',
    care: 'Dry clean. Iron on reverse at silk setting. Store away from direct sunlight.',
    applications: ['Ball gowns', 'Corsetry & bodices', 'Structured lehengas'],
    details:
      'Woven at 190 GSM for body without bulk, it holds seams, box pleats and dramatic skirt volume beautifully.',
    image: '/images/fabrics/f04.jpg',
    featured: true,
  },

  // ── Heritage & Festive Silks ────────────────────────────────
  {
    slug: 'banarasi-kadhwa-brocade',
    name: 'Banarasi Kadhwa Brocade',
    category: 'heritage',
    description:
      'Handwoven in Varanasi on pit looms, this kadhwa brocade carries discontinuous gold zari bootas — no float threads, pure heirloom.',
    composition: 'Katan Silk · Tested Real Zari',
    width: '44" / 112 cm',
    gsm: '210 GSM',
    price: '₹9,200 / metre',
    moq: '1 metre (trade 12 m+)',
    availability: 'Limited Edition',
    care: 'Dry clean only. Wrap in muslin, refold along new lines every few months.',
    applications: ['Bridal lehengas', 'Heirloom sarees', 'Sherwanis & bandhgalas'],
    details:
      'Each six-metre length takes our weaver family 18–24 days on the loom. Zari is certified and every bolt ships with its provenance card.',
    image: '/images/fabrics/f05.jpg',
    featured: true,
  },
  {
    slug: 'kanjivaram-temple-silk',
    name: 'Kanjivaram Temple Silk',
    category: 'heritage',
    description:
      'South silk in its purest register — korvai borders, temple motifs and a zari that answers every light.',
    composition: 'Pure Mulberry Silk · Silver-Gold Zari',
    width: '46" / 117 cm',
    gsm: '240 GSM',
    moq: '1 metre (trade 12 m+)',
    availability: 'In Stock',
    care: 'Dry clean only. Air in shade twice a year; store flat with silica pouches.',
    applications: ['Kanjivaram sarees', 'Festive drapes', 'Occasion blouses'],
    details:
      'Sourced directly from Kanchipuram loom houses we have worked with for over a decade. Border and body colours can be paired to order.',
    image: '/images/fabrics/f06.jpg',
  },
  {
    slug: 'tussar-ghicha-handloom',
    name: 'Tussar Ghicha Handloom',
    category: 'heritage',
    description:
      'Wild tussar with ghicha slubs in warm honey — an organic, breathing silk for daywear with gravitas.',
    composition: '100% Tussar Silk (Handloom)',
    width: '46" / 117 cm',
    gsm: '110 GSM',
    price: '₹1,850 / metre',
    moq: '1 metre (trade 30 m+)',
    availability: 'In Stock',
    care: 'Gentle dry clean or cold hand wash with silk detergent. Iron slightly damp.',
    applications: ['Kurtas & bandis', 'Sarees', 'Unstructured jackets'],
    details:
      'Naturally golden and undyed at its heart — the slub texture is the loom speaking, and no two metres repeat exactly.',
    image: '/images/fabrics/f07.jpg',
  },
  {
    slug: 'rajwada-zardozi-velvet',
    name: 'Rajwada Zardozi Velvet',
    category: 'heritage',
    description:
      'Midnight-plum silk velvet embroidered with antique-gold zardozi jaal — royalty, by the metre.',
    composition: 'Silk Velvet · Zardozi & Dabka Work',
    width: '44" / 112 cm',
    gsm: '320 GSM',
    price: '₹11,500 / metre',
    moq: '1 metre (trade 10 m+)',
    availability: 'Made to Order',
    care: 'Specialist dry clean only. Store rolled, pile outwards, in breathable cotton.',
    applications: ['Grooms’ sherwanis', 'Bridal cholis', 'Ceremonial stoles'],
    details:
      'The jaal is worked in dabka, nakshi and antique sequins over a 12-inch repeat. Ground velvet available in six court colours.',
    image: '/images/fabrics/f08.jpg',
  },

  // ── Contemporary Designer Fabrics ───────────────────────────
  {
    slug: 'midnight-crepe-de-chine',
    name: 'Midnight Crêpe de Chine',
    category: 'contemporary',
    description:
      'A fluid four-ply crêpe in deep espresso with a dry, matte hand — the workhorse of modern eveningwear.',
    composition: '100% Silk Crêpe de Chine',
    width: '44" / 112 cm',
    gsm: '130 GSM',
    price: '₹2,450 / metre',
    moq: '1 metre (trade 30 m+)',
    availability: 'In Stock',
    care: 'Dry clean recommended. Cool iron on reverse; avoid wringing.',
    applications: ['Slip dresses', 'Evening separates', 'Couture linings'],
    details:
      'Its pebbled matte face resists glare under flash photography, making it a stylist favourite for press and screen.',
    image: '/images/fabrics/f09.jpg',
  },
  {
    slug: 'atelier-linen-silk',
    name: 'Atelier Linen-Silk',
    category: 'contemporary',
    description:
      'A dry-touch linen-silk chambray in raw oat — quiet luxury for structured resort and occasion tailoring.',
    composition: '55% Linen · 45% Silk',
    width: '54" / 137 cm',
    gsm: '165 GSM',
    price: '₹2,100 / metre',
    moq: '1 metre (trade 40 m+)',
    availability: 'In Stock',
    care: 'Dry clean or gentle cold wash. Iron at medium heat while damp for a crisp finish.',
    applications: ['Suits & co-ords', 'Resort wear', 'Luxury shirting'],
    details:
      'The silk warp gives a soft inner glow to an otherwise matte linen face — visible only when the wearer moves.',
    image: '/images/fabrics/f10.jpg',
  },
  {
    slug: 'moonstone-liquid-satin',
    name: 'Moonstone Liquid Satin',
    category: 'contemporary',
    description:
      'A heavy sand-washed satin that pours like honey — champagne-moonstone tone, zero glare.',
    composition: '100% Silk Satin (Sand-washed)',
    width: '44" / 112 cm',
    gsm: '145 GSM',
    price: '₹3,300 / metre',
    moq: '1 metre (trade 25 m+)',
    availability: 'In Stock',
    care: 'Dry clean. The sand-washed face should never be ironed directly — press on reverse.',
    applications: ['Cocktail gowns', 'Bias-cut skirts', 'Draped blouses'],
    details:
      'Sand-washing knocks the shine back to a moonlit sheen, so the drape — not the gloss — does the talking.',
    image: '/images/fabrics/f11.jpg',
    featured: true,
  },
  {
    slug: 'dupion-raw-silk',
    name: 'Architectural Dupion Raw Silk',
    category: 'contemporary',
    description:
      'Pronounced slubs and a burnished copper cast — a raw silk that holds pleats like sculpture.',
    composition: '100% Raw Silk (Dupion)',
    width: '44" / 112 cm',
    gsm: '160 GSM',
    price: '₹1,650 / metre',
    moq: '1 metre (trade 40 m+)',
    availability: 'In Stock',
    care: 'Dry clean only to preserve the crisp hand. Store flat.',
    applications: ['Lehengas', 'Jackets & bandhgalas', 'Home couture'],
    details:
      'A tightly woven dupion with an audible rustle — it takes knife pleats, box pleats and can-can volume without support.',
    image: '/images/fabrics/f12.jpg',
  },
];

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
