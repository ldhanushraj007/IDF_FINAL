import { GARMENT_YARDAGE } from "../data/garmentYardage";

const CATEGORY_DEFAULTS: Record<string, string[]> = {
  bridal: ["lehenga-skirt", "anarkali-suit", "blouse"],
  heritage: ["saree", "salwar-kameez-suit", "blouse"],
  contemporary: ["kurta-top", "salwar-trouser", "mens-shirt"],
  dyeable: ["kurta-top", "salwar-trouser"],
  printed: ["kurta-top", "salwar-kameez-suit"],
  plain: ["kurta-top", "mens-shirt", "mens-trouser"],
  imported: ["mens-shirt", "mens-trouser", "kurta-top"],
  brocade: ["blouse", "lehenga-skirt"],
  handprint: ["saree", "kurta-top"],
};

const NAME_KEYWORD_MAP: Record<string, string[]> = {
  saree: ["saree"],
  lehenga: ["lehenga-skirt"],
  anarkali: ["anarkali-suit"],
  blouse: ["blouse"],
  kurta: ["kurta-top"],
  shirt: ["mens-shirt"],
  trouser: ["mens-trouser", "salwar-trouser"],
  suit: ["salwar-kameez-suit"],
};

export function suggestGarmentIds(product: {
  categoryId?: string;
  name: string;
  description?: string;
}): string[] {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  const fromKeywords = Object.entries(NAME_KEYWORD_MAP)
    .filter(([kw]) => text.includes(kw))
    .flatMap(([, ids]) => ids);

  if (fromKeywords.length > 0) return [...new Set(fromKeywords)];

  return CATEGORY_DEFAULTS[product.categoryId ?? ""] ?? [];
}
