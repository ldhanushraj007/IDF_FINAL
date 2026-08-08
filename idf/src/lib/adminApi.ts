import type { Item } from '../data/catalog';
import type { Review } from '../data/reviews';
import type { Offer } from './catalogSource';
import { adminAuthFunctionUrl, adminApiFunctionUrl } from './supabase';

const TOKEN_KEY = 'idf_admin_jwt';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/* ------------------------------------------------------------------ *
 * Admin Auth
 * ------------------------------------------------------------------ */

async function callAdminAuth(body: Record<string, unknown>) {
  const res = await fetch(adminAuthFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export async function requestAdminCode(username: string, password: string): Promise<void> {
  await callAdminAuth({ step: 'request', username, password });
}

export async function verifyAdminCode(username: string, code: string): Promise<string> {
  const data = await callAdminAuth({ step: 'verify', username, code });
  if (data.token) {
    setAdminToken(data.token);
    return data.token;
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
 * Admin API Calls (via admin-api Edge Function)
 * ------------------------------------------------------------------ */

async function callAdminApi(action: string, payload: Record<string, unknown> = {}) {
  const token = getAdminToken();
  if (!token) throw new Error('Not authenticated as admin');

  const res = await fetch(adminApiFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
    }
    throw new Error(data.error || 'Admin request failed');
  }
  return data;
}

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

const rowToItem = (r: ProductRow): Item => ({
  id: r.id,
  name: r.name,
  category: r.category,
  composition: r.composition,
  width: r.width,
  pricePerMetre: r.price_per_metre,
  ...(r.mrp && r.mrp > r.price_per_metre ? { mrp: r.mrp } : {}),
  minMetres: r.min_metres,
  stock: r.stock,
  tags: r.tags as Item['tags'],
  image: r.image,
  ...(r.gallery?.length ? { gallery: r.gallery } : {}),
  blurb: r.blurb,
  ...(r.details ? { details: r.details } : {}),
});

const itemToRow = (i: Item): ProductRow => ({
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
  const res = await callAdminApi('fetchProducts');
  return (res.data as ProductRow[]).map(rowToItem);
}

export async function fetchOffer(): Promise<Offer> {
  const res = await callAdminApi('fetchSettings');
  const data = res.data;
  if (!data) return { active: false, headline: '', detail: '' };
  return { active: data.offer_active, headline: data.offer_headline, detail: data.offer_detail };
}

export async function publishProducts(items: Item[], offer: Offer, originalIds: string[]): Promise<void> {
  await callAdminApi('publishCatalog', {
    items: items.map(itemToRow),
    offer: {
      active: offer.active,
      headline: offer.headline,
      detail: offer.detail ?? '',
    },
    originalIds,
  });
}

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
  const res = await callAdminApi('fetchReviews');
  return (res.data as Array<{
    id: string;
    name: string;
    city: string;
    rating: number;
    review_text: string;
    status: 'pending' | 'published' | 'private';
    user_email: string;
    created_at: string;
  }>).map((r) => ({
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
  await callAdminApi('setReviewStatus', { id, status });
}

export async function deleteReview(id: string): Promise<void> {
  await callAdminApi('deleteReview', { id });
}

export async function addManualReview(review: Review): Promise<void> {
  await callAdminApi('addReview', {
    name: review.name,
    city: review.city,
    rating: review.rating,
    text: review.text,
  });
}

export interface AdminOrderRow {
  id: string;
  order_code: string;
  items: Array<{ item: Item; metres: number; lineTotal: number }>;
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
  const res = await callAdminApi('fetchOrders');
  return res.data as AdminOrderRow[];
}

export async function setOrderStatus(
  id: string,
  order_status?: string,
  payment_status?: string,
): Promise<void> {
  await callAdminApi('setOrderStatus', { id, order_status, payment_status });
}
