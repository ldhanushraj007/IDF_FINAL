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
  timeoutMs = 18000,
): Promise<T> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const body: Record<string, unknown> = { token: SCRIPT_TOKEN, action, ...payload };
  if (requireAdminToken) body.adminToken = getAdminToken() || '';

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json();
    if (!json.ok) {
      if (json.error === 'unauthorized_admin') clearAdminToken();
      throw new Error(json.error || 'Request failed');
    }
    return json.data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Google Sheets may be busy.`);
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
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
      email: 'indesignluxuryfabrics@gmail.com',
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

/** Direct 1-step login using email and password without OTP */
export async function adminDirectLogin(password: string, email: string = 'indesignluxuryfabrics@gmail.com'): Promise<void> {
  if (!isAdminConfigured) throw new Error('Backend not configured.');
  const res = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: SCRIPT_TOKEN, action: 'admin_direct_login', email, password }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Admin authentication failed.');
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
  id: String(r.id || ''),
  name: String(r.name || ''),
  category: (r.category || 'Contemporary') as Item['category'],
  categoryId: r.categoryId || r.category_id || undefined,
  composition: String(r.composition || ''),
  width: String(r.width || '44 in'),
  pricePerMetre: Number(r.pricePerMetre ?? r.price_per_metre ?? 0),
  ...(r.mrp ? { mrp: Number(r.mrp) } : {}),
  minMetres: Number(r.minMetres ?? r.min_metres ?? 0.5),
  stock: (r.stock || 'in') as Item['stock'],
  tags: (Array.isArray(r.tags)
    ? r.tags
    : typeof r.tags === 'string'
      ? r.tags.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean)
      : ['new-arrival']) as Item['tags'],
  image: String(r.image || '/images/fabrics/f01.jpg'),
  ...(r.gallery?.length ? { gallery: Array.isArray(r.gallery) ? r.gallery : String(r.gallery).split(/[|,]/) } : {}),
  blurb: String(r.blurb || ''),
  ...(r.details ? { details: String(r.details) } : {}),
  suggestedGarmentIds: Array.isArray(r.suggestedGarmentIds ?? r.suggested_garment_ids)
    ? (r.suggestedGarmentIds ?? r.suggested_garment_ids)
    : typeof (r.suggestedGarmentIds ?? r.suggested_garment_ids) === 'string' && (r.suggestedGarmentIds ?? r.suggested_garment_ids).trim()
      ? (r.suggestedGarmentIds ?? r.suggested_garment_ids).split('|').map((s: string) => s.trim()).filter(Boolean)
      : undefined,
  hidden: Boolean(r.hidden),
});

const itemToRow = (i: Item) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  category_id: i.categoryId || '',
  composition: i.composition,
  width: i.width,
  pricePerMetre: i.pricePerMetre,
  price_per_metre: i.pricePerMetre,
  mrp: i.mrp ?? null,
  minMetres: i.minMetres,
  min_metres: i.minMetres,
  stock: i.stock,
  tags: i.tags,
  image: i.image,
  gallery: i.gallery ?? [],
  blurb: i.blurb,
  details: i.details ?? '',
  suggested_garment_ids: i.suggestedGarmentIds ?? [],
  hidden: Boolean(i.hidden),
});

export async function fetchProducts(): Promise<Item[]> {
  const data = await adminPost<{ items: any[] }>('get_catalog');
  return (data.items || []).map(rowToItem);
}

export async function fetchOffer(): Promise<Offer> {
  const data = await adminPost<{ offer: Offer }>('get_catalog');
  return data.offer;
}

import { saveLocalCatalogCache } from './catalogSource';
import { DEFAULT_CATEGORIES, type CategoryConfig } from './categories';

export async function publishProducts(items: Item[], offer: Offer): Promise<Item[]> {
  // 1. Post to canonical database (Google Sheets backend)
  await adminPost('save_catalog', { items: items.map(itemToRow), offer });

  // 2. Fetch fresh canonical verification from the server
  let freshCatalog = items;
  try {
    const fresh = await fetchProducts();
    if (fresh.length > 0) freshCatalog = fresh;
  } catch (err) {
    console.warn('Post-save verification fetch failed:', err);
  }

  // 3. Invalidate & update storefront cache with verified data
  saveLocalCatalogCache(freshCatalog, offer);
  return freshCatalog;
}

export async function fetchProductById(id: string): Promise<Item | null> {
  if (!id) return null;
  if (isAdminConfigured) {
    try {
      const res = await adminPost<{ item: any }>('get_product', { id });
      if (res && res.item) {
        return rowToItem(res.item);
      }
    } catch (err) {
      console.warn('Direct get_product failed, falling back to full catalog fetch:', err);
    }
  }
  const products = await fetchProducts();
  return products.find((p) => p.id === id) || null;
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!isAdminConfigured) {
    throw new Error('Google Apps Script backend is not configured.');
  }

  // Convert file to base64 data URI to send to Apps Script DriveApp
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(new Error('Failed to read image file: ' + e));
    reader.readAsDataURL(file);
  });

  const res = await adminPost<{ url: string; fileId: string }>(
    'upload_image',
    {
      base64: base64Data,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
    },
    true,
    30000 // 30s timeout for image upload to Drive
  );

  if (!res || !res.url) {
    throw new Error('Google Drive upload did not return a public image URL.');
  }

  return res.url;
}

export async function cleanLegacyBase64Images(): Promise<{ cleanedCount: number }> {
  return await adminPost<{ cleanedCount: number }>('clean_catalog_images');
}

export async function saveProduct(item: Item, offer?: Offer): Promise<Item> {
  let verifiedItem: Item = item;

  // 1. Write the update to the SAME row in Google Sheets (match by unique product ID)
  if (isAdminConfigured) {
    try {
      const res = await adminPost<{ item: any; row: number; action: string }>(
        'save_product',
        { item: itemToRow(item) },
        true,
        20000
      );
      if (res && res.item) {
        verifiedItem = rowToItem(res.item);
      }
    } catch (err) {
      console.warn('save_product endpoint error, falling back to publishProducts:', err);
      const all = await fetchProducts().catch(() => []);
      const updatedAll = all.some(p => p.id === item.id)
        ? all.map(p => p.id === item.id ? item : p)
        : [item, ...all];
      const verified = await publishProducts(updatedAll, offer || { active: false, headline: '', detail: '' });
      return verified.find(p => p.id === item.id) || item;
    }
  }

  // 2. Refresh local storefront cache immediately without full re-fetch lag
  try {
    const cached = await fetchProducts().catch(() => []);
    if (cached.length > 0) {
      const updatedList = cached.some((p) => p.id === verifiedItem.id)
        ? cached.map((p) => (p.id === verifiedItem.id ? verifiedItem : p))
        : [verifiedItem, ...cached];
      saveLocalCatalogCache(updatedList, offer);
    } else {
      saveLocalCatalogCache([verifiedItem], offer);
    }
  } catch {
    saveLocalCatalogCache([verifiedItem], offer);
  }

  return verifiedItem;
}

// ── Admin Reviews ─────────────────────────────────────────────────────────────

export interface AdminReviewRow {
  id: string; name: string; city: string; rating: number; text: string;
  date: string; status: 'pending' | 'published' | 'private'; userEmail: string;
}

export async function fetchAllReviews(): Promise<AdminReviewRow[]> {
  const data = await adminPost<any[]>('fetch_reviews');
  return (data || []).map((r) => ({
    id: r.id, name: r.name, city: r.city, rating: r.rating, text: r.review_text || r.text || '',
    date: new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    status: r.status, userEmail: r.user_email || '',
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
  try {
    const res = await adminPost<any>('fetch_orders');
    const rawList = Array.isArray(res) ? res : (res?.data || []);
    return rawList.map((o: any) => ({
      ...o,
      items: (o.items || []).map((line: any) => ({
        item: { name: line.item?.name || 'Fabric' },
        metres: Number(line.metres || 1),
        lineTotal: Number(line.lineTotal || 0),
      })),
    }));
  } catch (err) {
    console.error('CRITICAL: fetch_orders failed from Google Sheets backend:', err);
    throw err; // Fail loudly instead of silently returning empty
  }
}

export async function reconcileDatabaseConflicts(): Promise<{ ok: boolean; report: any[] }> {
  return await adminPost('reconcile_conflicts');
}

export async function auditDatabase(): Promise<{
  ok: boolean;
  sheets: Array<{ name: string; rows: number; cols: number }>;
  conflictTabs: Array<{ name: string; rows: number }>;
  ordersRawCount: number;
  catalogRawCount: number;
  customersRawCount: number;
  reviewsRawCount: number;
}> {
  return await adminPost('audit_database');
}

export async function setOrderStatus(id: string, order_status?: string, payment_status?: string): Promise<void> {
  await adminPost('set_order_status', { id, order_status, payment_status });
}

export interface CustomerRow {
  id?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  signup_method: string;
  created_at?: string;
}

export async function fetchCustomers(): Promise<CustomerRow[]> {
  try {
    const data = await adminPost<any[]>('fetch_customers');
    return (data || []).map((c) => ({
      id: c.id || c.userId || c.user_id,
      name: c.name || 'Walk-in',
      phone: c.phone || '',
      email: c.email || c.userEmail || c.user_email || '—',
      city: c.city || 'Bengaluru',
      signup_method: c.signup_method || c.signupMethod || 'Online Checkout',
      created_at: c.created_at || c.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('fetch_customers backend endpoint fallback:', err);
    return [];
  }
}

export async function addManualCustomer(customer: any): Promise<void> {
  await adminPost('upsert_customer', {
    userId: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userEmail: customer.email,
    name: customer.name,
    phone: customer.phone,
    city: customer.city,
    signupMethod: customer.signup_method || 'Manual Registry',
  });
}

export async function addManualOrder(order: AdminOrderRow): Promise<void> {
  await adminPost('save_order', {
    userId: 'cust-walkin',
    userEmail: order.customers?.email || 'walkin@idf.com',
    order: {
      orderCode: order.order_code,
      customerName: order.customers?.name || 'Walk-in',
      phone: order.customers?.phone || '',
      fulfilment: order.fulfilment,
      address: order.address,
      city: order.city,
      pincode: order.pincode,
      items: order.items.map((i) => ({ name: i.item.name, metres: i.metres, lineTotal: i.lineTotal })),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      notes: order.requirement,
      paymentMethod: order.payment_method,
      paid: order.paid,
      paymentReference: order.payment_reference,
      orderStatus: order.order_status,
    },
  });
}

// ── Admin Categories ──────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<CategoryConfig[]> {
  try {
    const data = await adminPost<CategoryConfig[]>('get_categories');
    return data && data.length > 0 ? data : DEFAULT_CATEGORIES;
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategories(categories: CategoryConfig[]): Promise<void> {
  await adminPost('save_categories', { categories });
}

// ── Admin Settings ────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<Record<string, any>> {
  try {
    return await adminPost<Record<string, any>>('get_settings');
  } catch (err) {
    return {};
  }
}

export async function saveSettings(settings: Record<string, any>): Promise<void> {
  await adminPost('save_settings', { settings });
}
