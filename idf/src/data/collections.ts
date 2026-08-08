import type { Category } from './products';

export interface Collection {
  slug: Category;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: 'bridal',
    name: 'Bridal & Red-Carpet Luxe',
    tagline: 'For vows and velvet ropes',
    description:
      'Hand-embellished tulles, pearl organzas and duchess satins for the most photographed days of a life.',
    image: '/images/collections/bridal.jpg',
  },
  {
    slug: 'heritage',
    name: 'Heritage & Festive Silks',
    tagline: 'Woven history, worn today',
    description:
      'Banarasi kadhwa, Kanjivaram temple silks and zardozi velvets, sourced directly from master weavers.',
    image: '/images/collections/heritage.jpg',
  },
  {
    slug: 'contemporary',
    name: 'Contemporary Designer Fabrics',
    tagline: 'The modern atelier',
    description:
      'Fluid crêpes, liquid satins and architectural raw silks for prêt, resort and occasion wear.',
    image: '/images/collections/contemporary.jpg',
  },
];
