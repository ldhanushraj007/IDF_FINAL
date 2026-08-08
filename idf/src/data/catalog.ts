/**
 * FALLBACK CATALOG
 *
 * This file is the safety net that ships inside the JavaScript bundle. The
 * live catalog the shop edits day to day is `public/catalog.json`, which the
 * site loads at page load — see `src/lib/catalogSource.ts`.
 *
 * Editing this file still works, but it needs a rebuild. To change a price or
 * mark something sold out WITHOUT rebuilding, use the editor at /#/admin.
 */

export const STOCK_VALUES = ['in', 'low', 'out'] as const;
export type Stock = (typeof STOCK_VALUES)[number];

export const TAG_VALUES = [
  'best-seller',
  'new-arrival',
  'festival',
  'seasonal',
  'wholesale',
] as const;
export type Tag = (typeof TAG_VALUES)[number];

export const CATEGORY_VALUES = ['Bridal', 'Heritage', 'Contemporary'] as const;
export type Category = (typeof CATEGORY_VALUES)[number];

export interface Item {
  id: string;
  name: string;
  category: Category;
  composition: string;
  width: string;
  pricePerMetre: number;
  mrp?: number;
  minMetres: number;
  stock: Stock;
  tags: Tag[];
  image: string;
  blurb: string;
  /** Extra photos for the product page gallery. Falls back to [image] when empty. */
  gallery?: string[];
  /** Longer write-up for the product page. Falls back to `blurb` when empty. */
  details?: string;
}

export const TAG_LABELS: Record<Tag, string> = {
  'best-seller': 'Best Selling',
  'new-arrival': 'New Arrivals',
  festival: 'Festival Offers',
  seasonal: 'Seasonal Edit',
  wholesale: 'Wholesale',
};

export const STOCK_LABELS: Record<Stock, string> = {
  in: 'In Stock',
  low: 'Only a few metres left',
  out: 'Unavailable right now',
};

export const CATALOG: Item[] = [
  {
    id: 'aurelia-tulle',
    name: 'Aurelia Hand-Embroidered Tulle',
    category: 'Bridal',
    composition: 'Silk Tulle · Zardozi & Bead Work',
    width: '44 in',
    pricePerMetre: 6800,
    mrp: 7900,
    minMetres: 2,
    stock: 'in',
    tags: ['best-seller', 'festival'],
    image: '/images/fabrics/f01.jpg',
    blurb: 'Whisper-light tulle with hand-couched gold zardozi — the house bridal signature.',
  },
  {
    id: 'noor-organza',
    name: 'Noor Pearl Organza',
    category: 'Bridal',
    composition: 'Pure Silk Organza · Pearl Work',
    width: '44 in',
    pricePerMetre: 4200,
    minMetres: 2,
    stock: 'in',
    tags: ['new-arrival'],
    image: '/images/fabrics/f02.jpg',
    blurb: 'Crisp organza seeded with hand-sewn pearls. Holds sculptural shape beautifully.',
  },
  {
    id: 'celestine-net',
    name: 'Celestine Beaded Net',
    category: 'Bridal',
    composition: 'Silk Net · Crystal Beadwork',
    width: '44 in',
    pricePerMetre: 5600,
    minMetres: 2,
    stock: 'in',
    tags: ['best-seller'],
    image: '/images/fabrics/f03.jpg',
    blurb: 'Crystal-beaded net that catches every light. Restocking shortly.',
  },
  {
    id: 'isabeau-satin',
    name: 'Isabeau Duchess Satin',
    category: 'Bridal',
    composition: '100% Silk Duchess Satin',
    width: '58 in',
    pricePerMetre: 3900,
    minMetres: 2,
    stock: 'in',
    tags: ['seasonal'],
    image: '/images/fabrics/f04.jpg',
    blurb: 'Heavy, structured and luminous — the classic gown fabric.',
  },
  {
    id: 'banarasi-kadhwa',
    name: 'Banarasi Kadhwa Brocade',
    category: 'Heritage',
    composition: 'Katan Silk · Tested Real Zari',
    width: '45 in',
    pricePerMetre: 8500,
    mrp: 9800,
    minMetres: 2,
    stock: 'in',
    tags: ['best-seller', 'festival', 'wholesale'],
    image: '/images/fabrics/f05.jpg',
    blurb: 'Handwoven kadhwa bootis in real zari, straight from Varanasi looms.',
  },
  {
    id: 'kanjivaram-temple',
    name: 'Kanjivaram Temple Silk',
    category: 'Heritage',
    composition: 'Pure Mulberry Silk · Silver-Gold Zari',
    width: '46 in',
    pricePerMetre: 7200,
    mrp: 8400,
    minMetres: 2,
    stock: 'in',
    tags: ['festival', 'wholesale'],
    image: '/images/fabrics/f06.jpg',
    blurb: 'Korvai-woven temple border in contrast — a South Indian heirloom.',
  },
  {
    id: 'tussar-ghicha',
    name: 'Tussar Ghicha Handloom',
    category: 'Heritage',
    composition: '100% Tussar Silk (Handloom)',
    width: '44 in',
    pricePerMetre: 2400,
    minMetres: 3,
    stock: 'in',
    tags: ['seasonal', 'wholesale'],
    image: '/images/fabrics/f07.jpg',
    blurb: 'Textured ghicha slubs with a natural honey tone. Breathes wonderfully.',
  },
  {
    id: 'rajwada-velvet',
    name: 'Rajwada Zardozi Velvet',
    category: 'Heritage',
    composition: 'Silk Velvet · Zardozi & Dabka Work',
    width: '44 in',
    pricePerMetre: 9600,
    minMetres: 2,
    stock: 'in',
    tags: ['festival', 'new-arrival'],
    image: '/images/fabrics/f08.jpg',
    blurb: 'Plush plum velvet under an all-over gold jaal. Unapologetically regal.',
  },
  {
    id: 'midnight-crepe',
    name: 'Midnight Crêpe de Chine',
    category: 'Contemporary',
    composition: '100% Silk Crêpe de Chine',
    width: '44 in',
    pricePerMetre: 2900,
    minMetres: 2,
    stock: 'in',
    tags: ['new-arrival'],
    image: '/images/fabrics/f09.jpg',
    blurb: 'Fluid matte crêpe that drapes like liquid. Perfect for evening wear.',
  },
  {
    id: 'atelier-linen-silk',
    name: 'Atelier Linen-Silk',
    category: 'Contemporary',
    composition: '55% Linen · 45% Silk',
    width: '54 in',
    pricePerMetre: 1850,
    minMetres: 3,
    stock: 'in',
    tags: ['seasonal', 'wholesale', 'best-seller'],
    image: '/images/fabrics/f10.jpg',
    blurb: 'Slubbed, breathable and quietly luxurious — the summer favourite.',
  },
  {
    id: 'moonstone-satin',
    name: 'Moonstone Liquid Satin',
    category: 'Contemporary',
    composition: '100% Silk Satin (Sand-washed)',
    width: '54 in',
    pricePerMetre: 3400,
    minMetres: 2,
    stock: 'in',
    tags: ['new-arrival'],
    image: '/images/fabrics/f11.jpg',
    blurb: 'Sand-washed satin with a soft molten sheen. Back in stock soon.',
  },
  {
    id: 'architectural-dupion',
    name: 'Architectural Dupion Raw Silk',
    category: 'Contemporary',
    composition: '100% Raw Silk (Dupion)',
    width: '44 in',
    pricePerMetre: 1650,
    minMetres: 3,
    stock: 'in',
    tags: ['wholesale', 'seasonal'],
    image: '/images/fabrics/f12.jpg',
    blurb: 'Crisp body that holds a shape — a tailor’s dependable workhorse.',
  },
];
