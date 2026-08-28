/**
 * adminApi.ts — IN DESIGN Admin Portal Backend
 * Talks to the Google Apps Script Web App.
 * Falls back to PIN login when VITE_APPS_SCRIPT_URL is not set.
 */

import type { Item } from '../data/catalog';
import type { Review } from '../data/reviews';
import type { Offer } from './catalogSource';

const TOKEN_KEY   = 'idf_admin_jwt';
const SCRIPT_URL  = import.meta.env.VITE_APPS_SCRIPT_URL  as string | undefined;
const SCRIPT_TOKEN= import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;

// Only configured when the URL is a real deployed Apps Script URL
export const isAdminConfigured = Boolean(
  SCRIPT_URL &&
  SCRIPT_TOKEN &&
  SCRIPT_URL.includes('script.google.com') &&
  !SCRIPT_URL.includes('PASTE_YOUR')
);

export function getAdminToken(): string | null  { return sessionStorage.getItem(TOKEN_KEY); }
export function setAdminToken(t: string)        { sessionStorage.setItem(TOKEN_KEY, t); }
export function clearAdminToken()               { sessionStorage.removeItem(TOKEN_KEY); }
export function checkIsAdmin(): boolean         { return Boolean(getAdminToken()); }
export function adminSignOut()                  { clearAdminToken(); }

// ── Core POST helper ──────────────────────────────────────────────────────────

async function adminPost<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
  requireAdminToken = true,
): Promise<T> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const body: Record<string, unknown> = { token: SCRIPT_TOKEN, action, ...payload };
  if (requireAdminToken) body.adminToken = getAdminToken() || '';

  const res  = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    if (json.error === 'unauthorized_admin') clearAdminToken();
    throw new Error(json.error || 'Request failed');
  }
  return json.data as T;
}

// ── Admin Auth: OTP-based (when Apps Script is deployed) ──────────────────────

/** Step 1: validate password → sends OTP to indesignluxuryfabrics@gmail.com */
export async function adminRequestOtp(password: string): Promise<void> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const res = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      token: SCRIPT_TOKEN,
      action: 'admin_request_otp',
      email: 'admin3300@gmail.com',
      password,
    }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Admin auth failed.');
}

/** Step 2: verify OTP → stores admin session token */
export async function adminVerifyOtp(code: string): Promise<void> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const res = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: SCRIPT_TOKEN, action: 'admin_verify_otp', code }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'OTP verification failed.');
  if (json.token) setAdminToken(json.token);
  else throw new Error('No session token returned.');
}

/** Legacy: single-step username/password (used before OTP was added) */
export async function adminLogin(username: string, password: string): Promise<string> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const res = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: SCRIPT_TOKEN, action: 'admin_login', username, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(json.error || 'Authentication failed');
  if (json.token) { setAdminToken(json.token); return json.token; }
  throw new Error('No token returned');
}

// ── Admin Catalog ─────────────────────────────────────────────────────────────

interface ProductRow {
  id: string; name: string; category: Item['category']; composition: string;
  width: string; price_per_metre: number; mrp: number | null; min_metres: number;
  stock: Item['stock']; tags: string[]; image: string; gallery: string[]; blurb: string; details: string;
}

const rowToItem = (r: any): Item => ({
  id: r.id, name: r.name, category: r.category as Item['category'],
  composition: r.composition, width: r.width, pricePerMetre: r.pricePerMetre,
  ...(r.mrp ? { mrp: r.mrp } : {}), minMetres: r.minMetres,
  stock: r.stock as Item['stock'], tags: r.tags as Item['tags'],
  image: r.image, ...(r.gallery?.length ? { gallery: r.gallery } : {}),
  blurb: r.blurb, ...(r.details ? { details: r.details } : {}),
  suggestedGarmentIds: Array.isArray(r.suggestedGarmentIds)
    ? r.suggestedGarmentIds
    : typeof r.suggestedGarmentIds === 'string' && r.suggestedGarmentIds.trim()
      ? r.suggestedGarmentIds.split('|').map((s: string) => s.trim()).filter(Boolean)
      : undefined,
});

const itemToRow = (i: Item) => ({
  id: i.id, name: i.name, category: i.category, composition: i.composition,
  width: i.width, price_per_metre: i.pricePerMetre, mrp: i.mrp ?? null,
  min_metres: i.minMetres, stock: i.stock, tags: i.tags, image: i.image,
  gallery: i.gallery ?? [], blurb: i.blurb, details: i.details ?? '',
  suggested_garment_ids: i.suggestedGarmentIds ?? [],
});

export async function fetchProducts(): Promise<Item[]> {
  const data = await adminPost<{ items: any[] }>('get_catalog');
  return (data.items || []).map(rowToItem);
}

export async function fetchOffer(): Promise<Offer> {
  const data = await adminPost<{ offer: Offer }>('get_catalog');
  return data.offer;
}

export async function publishProducts(items: Item[], offer: Offer): Promise<void> {
  await adminPost('save_catalog', { items: items.map(itemToRow), offer });
}

// ── Admin Reviews ─────────────────────────────────────────────────────────────

export interface AdminReviewRow {
  id: string; name: string; city: string; rating: number; text: string;
  date: string; status: 'pending' | 'published' | 'private'; userEmail: string;
}

export async function fetchAllReviews(): Promise<AdminReviewRow[]> {
  const data = await adminPost<any[]>('fetch_reviews');
  return (data || []).map((r) => ({
    id: r.id, name: r.name, city: r.city, rating: r.rating, text: r.review_text,
    date: new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    status: r.status, userEmail: r.user_email,
  }));
}

export async function setReviewStatus(id: string, status: 'published' | 'private'): Promise<void> {
  await adminPost('set_review_status', { id, status });
}

export async function deleteReview(id: string): Promise<void> {
  await adminPost('delete_review', { id });
}

export async function addManualReview(review: Review): Promise<void> {
  await adminPost('submit_review', { name: review.name, city: review.city, rating: review.rating, text: review.text });
}

// ── Admin Orders ──────────────────────────────────────────────────────────────

export interface AdminOrderRow {
  id: string; order_code: string;
  items: Array<{ item: { name: string }; metres: number; lineTotal: number }>;
  subtotal: number; discount: number; shipping: number; total: number;
  requirement: string; fulfilment: string; address: string; city: string; pincode: string;
  payment_method: string; paid: boolean; payment_reference: string;
  payment_status: 'pending' | 'paid' | 'failed'; order_status: 'pending_whatsapp' | 'confirmed' | 'fulfilled';
  created_at: string; customers?: { name: string; phone: string; email: string };
}

export async function fetchOrders(): Promise<AdminOrderRow[]> {
  const data = await adminPost<any[]>('fetch_orders');
  return (data || []).map((o) => ({
    ...o,
    items: o.items.map((line: any) => ({
      item: { name: line.item.name }, metres: line.metres, lineTotal: line.lineTotal || 0,
    })),
  }));
}

export async function setOrderStatus(id: string, order_status?: string, payment_status?: string): Promise<void> {
  await adminPost('set_order_status', { id, order_status, payment_status });
}

export async function addManualCustomer(customer: any): Promise<void> {
  await adminPost('upsert_customer', {
    userId: `cust-${Math.random().toString(36).slice(2, 7)}`,
    userEmail: customer.email, name: customer.name, phone: customer.phone,
    city: customer.city, signupMethod: customer.signup_method,
  });
}

export async function addManualOrder(order: AdminOrderRow): Promise<void> {
  await adminPost('save_order', {
    userId: 'cust-walkin',
    userEmail: order.customers?.email || 'walkin@idf.com',
    order: {
      orderCode: order.order_code, customerName: order.customers?.name || '',
      phone: order.customers?.phone || '', fulfilment: order.fulfilment,
      address: order.address, city: order.city, pincode: order.pincode,
      items: order.items.map((i) => ({ name: i.item.name, metres: i.metres, lineTotal: i.lineTotal })),
      subtotal: order.subtotal, discount: order.discount, shipping: order.shipping,
      total: order.total, notes: order.requirement, paymentMethod: order.payment_method,
      paid: order.paid, paymentReference: order.payment_reference,
    },
  });
}
