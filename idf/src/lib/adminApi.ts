/**
 * adminApi.ts
 * =============================================================================
 * Admin Portal Backend API — calls Google Sheets Apps Script directly.
 * All admin actions are protected by a session token in sessionStorage.
 *
 * Credentials and catalog are stored securely in Google Sheets (no Supabase needed).
 */

import type { Item } from '../data/catalog';
import type { Review } from '../data/reviews';
import type { Offer } from './catalogSource';

const TOKEN_KEY = 'idf_admin_jwt';
const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;

export const isAdminConfigured = Boolean(SCRIPT_URL && SCRIPT_TOKEN);

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ─── Core POST helper ────────────────────────────────────────────────────────

async function sheetsAdminPost<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!isAdminConfigured) throw new Error('Google Sheets backend is not configured.');

  const adminToken = getAdminToken() || '';
  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: SCRIPT_TOKEN,
        adminToken,
        action,
        ...payload,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      if (json.error === 'unauthorized_admin') {
        clearAdminToken();
      }
      throw new Error(json.error || 'Request failed');
    }
    return json.data as T;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

/* ------------------------------------------------------------------ *
 * Admin Auth
 * ------------------------------------------------------------------ */

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      token: SCRIPT_TOKEN,
      action: 'admin_login',
      username,
      password,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'Authentication failed');
  }
  if (json.token) {
    setAdminToken(json.token);
    return json.token;
  }
  throw new Error('No token returned');
}

export function checkIsAdmin(): boolean {
  return Boolean(getAdminToken());
}

export function adminSignOut(): void {
  clearAdminToken();
}

/* ------------------------------------------------------------------ *
 * Admin Catalog API Calls
 * ------------------------------------------------------------------ */

interface ProductRow {
  id: string;
  name: string;
  category: Item['category'];
  composition: string;
  width: string;
  price_per_metre: number;
  mrp: number | null;
  min_metres: number;
  stock: Item['stock'];
  tags: string[];
  image: string;
  gallery: string[];
  blurb: string;
  details: string;
}

const rowToItem = (r: any): Item => ({
  id: r.id,
  name: r.name,
  category: r.category as Item['category'],
  composition: r.composition,
  width: r.width,
  pricePerMetre: r.pricePerMetre,
  ...(r.mrp ? { mrp: r.mrp } : {}),
  minMetres: r.minMetres,
  stock: r.stock as Item['stock'],
  tags: r.tags as Item['tags'],
  image: r.image,
  ...(r.gallery?.length ? { gallery: r.gallery } : {}),
  blurb: r.blurb,
  ...(r.details ? { details: r.details } : {}),
});

const itemToRow = (i: Item) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  composition: i.composition,
  width: i.width,
  price_per_metre: i.pricePerMetre,
  mrp: i.mrp ?? null,
  min_metres: i.minMetres,
  stock: i.stock,
  tags: i.tags,
  image: i.image,
  gallery: i.gallery ?? [],
  blurb: i.blurb,
  details: i.details ?? '',
});

export async function fetchProducts(): Promise<Item[]> {
  const data = await sheetsAdminPost<{ items: any[] }>('get_catalog');
  return (data.items || []).map(rowToItem);
}

export async function fetchOffer(): Promise<Offer> {
  const data = await sheetsAdminPost<{ offer: Offer }>('get_catalog');
  return data.offer;
}

export async function publishProducts(items: Item[], offer: Offer, _originalIds?: string[]): Promise<void> {
  await sheetsAdminPost('save_catalog', {
    items: items.map(itemToRow),
    offer,
  });
}

/* ------------------------------------------------------------------ *
 * Admin Reviews API Calls
 * ------------------------------------------------------------------ */

export interface AdminReviewRow {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  date: string;
  status: 'pending' | 'published' | 'private';
  userEmail: string;
}

export async function fetchAllReviews(): Promise<AdminReviewRow[]> {
  const data = await sheetsAdminPost<any[]>('fetch_reviews');
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    rating: r.rating,
    text: r.review_text,
    date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    status: r.status,
    userEmail: r.user_email,
  }));
}

export async function setReviewStatus(id: string, status: 'published' | 'private'): Promise<void> {
  await sheetsAdminPost('set_review_status', { id, status });
}

export async function deleteReview(id: string): Promise<void> {
  await sheetsAdminPost('delete_review', { id });
}

export async function addManualReview(review: Review): Promise<void> {
  await sheetsAdminPost('submit_review', {
    name: review.name,
    city: review.city,
    rating: review.rating,
    text: review.text,
  });
}

/* ------------------------------------------------------------------ *
 * Admin Orders API Calls
 * ------------------------------------------------------------------ */

export interface AdminOrderRow {
  id: string;
  order_code: string;
  items: Array<{ item: { name: string }; metres: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  requirement: string;
  fulfilment: string;
  address: string;
  city: string;
  pincode: string;
  payment_method: string;
  paid: boolean;
  payment_reference: string;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending_whatsapp' | 'confirmed' | 'fulfilled';
  created_at: string;
  customers?: { name: string; phone: string; email: string };
}

export async function fetchOrders(): Promise<AdminOrderRow[]> {
  const data = await sheetsAdminPost<any[]>('fetch_orders');
  return (data || []).map((o) => ({
    ...o,
    items: o.items.map((line: any) => ({
      item: { name: line.item.name },
      metres: line.metres,
      lineTotal: line.lineTotal || 0,
    })),
  }));
}

export async function setOrderStatus(
  id: string,
  order_status?: string,
  payment_status?: string,
): Promise<void> {
  await sheetsAdminPost('set_order_status', { id, order_status, payment_status });
}
