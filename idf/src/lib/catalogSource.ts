/**
 * LIVE CATALOG LOADING
 *
 * The catalog in `src/data/catalog.ts` is only a fallback that ships inside the
 * JavaScript bundle. At runtime the site tries to load a fresher catalog so the
 * shop can change prices, stock and offers WITHOUT rebuilding or redeploying
 * the whole site.
 *
 * Order of preference:
 *   1. Google Sheet CSV, if `CATALOG_SOURCE.sheetCsvUrl` is set
 *   2. /catalog.json on the host
 *   3. the bundled fallback (so the shop is never blank if a fetch fails)
 */

import {
  CATALOG,
  type Item,
  type Stock,
  type Tag,
  STOCK_VALUES,
  TAG_VALUES,
  CATEGORY_VALUES,
  type Category,
} from '../data/catalog';
import { CATALOG_SOURCE } from './constants';

/** A site-wide offer strip the shop can switch on and off. */
export interface Offer {
  active: boolean;
  /** e.g. "Festive Week — 10% off all Bridal" */
  headline: string;
  /** Small print under the headline. Optional. */
  detail?: string;
}

export interface CatalogFile {
  /** Bumped by the editor so the shop can tell which file is newest. */
  updatedAt?: string;
  offer?: Offer;
  items: Item[];
}

export type CatalogOrigin = 'sheet' | 'json' | 'bundled';

export interface LoadedCatalog {
  items: Item[];
  offer: Offer;
  origin: CatalogOrigin;
  updatedAt?: string;
}

export const EMPTY_OFFER: Offer = { active: false, headline: '', detail: '' };

/* ------------------------------------------------------------------ *
 * Validation — never trust a hand-edited file to be well formed.
 * A single bad row should drop that row, not take the whole shop down.
 * ------------------------------------------------------------------ */

const asStock = (v: unknown): Stock =>
  STOCK_VALUES.includes(v as Stock) ? (v as Stock) : 'in';

const asCategory = (v: unknown): Category =>
  CATEGORY_VALUES.includes(v as Category) ? (v as Category) : 'Contemporary';

const asTags = (v: unknown): Tag[] => {
  const raw = Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? v.split(/[|,]/)
      : [];
  return raw
    .map((t) => String(t).trim().toLowerCase())
    .filter((t): t is Tag => TAG_VALUES.includes(t as Tag));
};

const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  // Tolerate "8,500" and "₹8500" from spreadsheets.
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Turns one loosely-typed record into a valid Item, or null if unusable. */
export function normaliseItem(raw: Record<string, unknown>): Item | null {
  const id = String(raw.id ?? '').trim();
  const name = String(raw.name ?? '').trim();
  if (!id || !name) return null;

  const pricePerMetre = asNumber(raw.pricePerMetre);
  if (pricePerMetre <= 0) return null;

  const mrp = asNumber(raw.mrp, 0);

  const galleryRaw = raw.gallery;
  const gallery = Array.isArray(galleryRaw)
    ? galleryRaw.map(String).filter(Boolean)
    : typeof galleryRaw === 'string' && galleryRaw.trim()
      ? galleryRaw.split(/[|,]/).map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    id,
    name,
    category: asCategory(raw.category),
    composition: String(raw.composition ?? '').trim(),
    width: String(raw.width ?? '44 in').trim(),
    pricePerMetre,
    // Only keep an MRP that is genuinely higher, otherwise the "Save ₹X"
    // badge would show a nonsense or negative saving.
    ...(mrp > pricePerMetre ? { mrp } : {}),
    minMetres: Math.max(1, asNumber(raw.minMetres, 1)),
    stock: asStock(raw.stock),
    tags: asTags(raw.tags),
    image: String(raw.image ?? '/images/fabrics/f01.jpg').trim(),
    blurb: String(raw.blurb ?? '').trim(),
    ...(gallery.length ? { gallery } : {}),
    ...(String(raw.details ?? '').trim() ? { details: String(raw.details).trim() } : {}),
  };
}

function normaliseOffer(raw: unknown): Offer {
  if (!raw || typeof raw !== 'object') return EMPTY_OFFER;
  const o = raw as Record<string, unknown>;
  const headline = String(o.headline ?? '').trim();
  return {
    active: Boolean(o.active) && headline.length > 0,
    headline,
    detail: String(o.detail ?? '').trim(),
  };
}

/* ------------------------------------------------------------------ *
 * CSV parsing (for the Google Sheet option)
 * Handles quoted fields, escaped quotes and commas inside values.
 * ------------------------------------------------------------------ */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      // Swallow the \n of a \r\n pair.
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Maps a CSV sheet (first row = headers) into items. */
export function itemsFromCsv(text: string): Item[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .map((cells) => {
      const rec: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        rec[h] = cells[i] ?? '';
      });
      return normaliseItem(rec);
    })
    .filter((i): i is Item => i !== null);
}

/* ------------------------------------------------------------------ *
 * The loader
 * ------------------------------------------------------------------ */

const bundled = (): LoadedCatalog => ({
  items: CATALOG,
  offer: EMPTY_OFFER,
  origin: 'bundled',
});

/** Cache-bust so the shop sees an uploaded file immediately, not tomorrow. */
const bust = (url: string) => `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

export async function loadCatalog(): Promise<LoadedCatalog> {
  // 1. Google Sheet, if configured.
  if (CATALOG_SOURCE.sheetCsvUrl) {
    try {
      const res = await fetch(bust(CATALOG_SOURCE.sheetCsvUrl), { cache: 'no-store' });
      if (res.ok) {
        const items = itemsFromCsv(await res.text());
        if (items.length) return { items, offer: EMPTY_OFFER, origin: 'sheet' };
      }
    } catch {
      /* fall through to the JSON file */
    }
  }

  // 2. catalog.json on the host.
  try {
    const res = await fetch(bust(CATALOG_SOURCE.jsonUrl), { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as CatalogFile;
      const items = (Array.isArray(data.items) ? data.items : [])
        .map((i) => normaliseItem(i as unknown as Record<string, unknown>))
        .filter((i): i is Item => i !== null);

      if (items.length) {
        return {
          items,
          offer: normaliseOffer(data.offer),
          origin: 'json',
          updatedAt: data.updatedAt,
        };
      }
    }
  } catch {
    /* fall through to the bundle */
  }

  // 3. Whatever shipped with the build. The shop is never empty.
  return bundled();
}
