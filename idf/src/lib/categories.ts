export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'bridal',
    name: 'Bridal',
    slug: 'bridal',
    description: 'Exquisite bridal silks, tulles, and hand-embroidered wedding fabrics.',
    active: true
  },
  {
    id: 'heritage',
    name: 'Heritage',
    slug: 'heritage',
    description: 'Traditional weaves and historic handlooms celebrating ancient craftsmanship.',
    active: true
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    slug: 'contemporary',
    description: 'Modern silhouettes, textures, and new-age weave architectures.',
    active: true
  },
  {
    id: 'dyeable-fabrics',
    name: 'Dyeable Fabrics',
    slug: 'dyeable-fabrics',
    description: 'Premium raw bases suitable for bespoke dyeing and color treatments.',
    active: true
  },
  {
    id: 'printed',
    name: 'Printed',
    slug: 'printed',
    description: 'Vibrant, printed designs ranging from traditional motifs to abstract expressions.',
    active: true
  },
  {
    id: 'plain',
    name: 'Plain',
    slug: 'plain',
    description: 'Elegant solid bases, flat silks, satins, and plain premium textiles.',
    active: true
  },
  {
    id: 'imported-fabrics',
    name: 'Imported Fabrics',
    slug: 'imported-fabrics',
    description: 'Hand-picked luxury fabrics sourced globally from renowned international weavers.',
    active: true
  },
  {
    id: 'brocade',
    name: 'Brocade',
    slug: 'brocade',
    description: 'Rich, ornamental shuttle-woven fabrics featuring intricate gold or silver patterns.',
    active: true
  },
  {
    id: 'handprint-fabrics',
    name: 'Handprint Fabrics',
    slug: 'handprint-fabrics',
    description: 'Artisanal hand-blocked and screen-printed organic Indian textiles.',
    active: true
  }
];

export function getCategoryById(id: string): CategoryConfig | undefined {
  return DEFAULT_CATEGORIES.find(c => c.id === id || c.slug === id);
}
