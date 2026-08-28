export interface GarmentYardage {
  id: string;
  label: string;
  minMetres: number;
  maxMetres: number;
  note?: string;
}

export const GARMENT_YARDAGE: GarmentYardage[] = [
  { id: "kurta-top", label: "Kurta / Top", minMetres: 2.0, maxMetres: 2.5 },
  { id: "salwar-trouser", label: "Salwar / Trousers", minMetres: 2.0, maxMetres: 2.5 },
  { id: "salwar-kameez-suit", label: "Full Salwar Kameez Suit", minMetres: 5.0, maxMetres: 6.5 },
  { id: "anarkali-suit", label: "Anarkali Suit", minMetres: 5.0, maxMetres: 6.0 },
  { id: "lehenga-skirt", label: "Lehenga / Skirt", minMetres: 3.0, maxMetres: 5.0, note: "More for heavy flares" },
  { id: "blouse", label: "Blouse", minMetres: 0.8, maxMetres: 1.0 },
  { id: "saree", label: "Saree", minMetres: 5.5, maxMetres: 6.0, note: "Standard length" },
  { id: "mens-shirt", label: "Men's Shirt", minMetres: 2.0, maxMetres: 2.3 },
  { id: "mens-trouser", label: "Men's Trouser / Pants", minMetres: 1.2, maxMetres: 1.5 },
];
