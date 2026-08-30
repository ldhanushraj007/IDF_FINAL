/**
 * customerApi.ts — IN DESIGN Luxury Fabrics
 * All customer data (auth, profiles, orders, wishlist) lives in Google Sheets
 * accessed via the Apps Script Web App endpoint.
 */

import type { Item } from '../data/catalog';

const SCRIPT_URL   = import.meta.env.VITE_APPS_SCRIPT_URL  as string | undefined;
const SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;

// Only true when a real deployed Apps Script URL exists (not a placeholder)
export const isSheetsConfigured = Boolean(
  SCRIPT_URL &&
  SCRIPT_TOKEN &&
  SCRIPT_URL.startsWith('https://script.google.com') &&
  !SCRIPT_URL.includes('PASTE_YOUR')
);

// ── Core POST helper ──────────────────────────────────────────────────────────

async function post<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<{ ok: boolean; data?: T; error?: string; [key: string]: unknown }> {
  if (!isSheetsConfigured) return { ok: false, error: 'Sheets backend not configured.' };
  const res  = await fetch(SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: SCRIPT_TOKEN, action, ...payload }),
  });
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerProfile {
  name:          string;
  phone:         string;
  email:         string;
  city:          string;
  signup_method: string;
}

export interface OrderRecord {
  orderCode:        string;
  items:            { item: Item; metres: number; lineTotal: number }[];
  subtotal:         number;
  discount:         number;
  shipping:         number;
  total:            number;
  requirement:      string;
  fulfilment:       'delivery' | 'pickup';
  address:          string;
  city:             string;
  pincode:          string;
  paymentMethod:    string;
  paid:             boolean;
  paymentReference: string;
}

export interface OrderHistoryRow {
  id:        string;
  orderCode: string;
  itemNames: string;
  total:     number;
  paid:      boolean;
  txnId:     string;
  createdAt: string;
  status:    string;
}

// ── Auth: Signup ───────────────────────────────────────────────────────────────

/** Register a new user → sends OTP to their email. */
export async function customerSignupApi(name: string, phone: string, email: string, password: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  const r = await post('customer_signup', { name, phone, email, password });
  if (!r.ok) throw new Error(r.error || 'Signup failed.');
  return r;
}

/** Alias kept for backwards-compat with any lingering calls */
export const customerSendOtpApi = customerSignupApi;

// ── Auth: Verify OTP (signup + login share same endpoint) ─────────────────────

/** Verify the 6-digit OTP → returns session token + user */
export async function customerVerifyOtpApi(email: string, code: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  const r = await post<{ token: string; user: { id: string; email: string; name: string } }>(
    'customer_verify_otp', { email, code }
  );
  if (!r.ok) throw new Error(r.error || 'Verification failed.');
  return r as { ok: true; token: string; user: { id: string; email: string; name: string } };
}

// ── Auth: Login ────────────────────────────────────────────────────────────────

/** Validate password → sends OTP to the user's email */
export async function customerLoginApi(email: string, password: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  const r = await post('customer_login', { email, password });
  if (!r.ok) throw new Error(r.error || 'Login failed.');
  return r as { ok: true; otpSent: boolean; message: string };
}

// ── Auth: Admin OTP ────────────────────────────────────────────────────────────

/** Admin: validate password → sends OTP to indesignluxuryfabrics@gmail.com */
export async function adminRequestOtpApi(email: string, password: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  const r = await post('admin_request_otp', { email, password });
  if (!r.ok) throw new Error(r.error || 'Admin auth failed.');
  return r as { ok: true; message: string };
}

/** Admin: verify OTP → returns admin session token */
export async function adminVerifyOtpApi(code: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  const r = await post('admin_verify_otp', { code });
  if (!r.ok) throw new Error(r.error || 'Admin OTP verification failed.');
  return r as { ok: true; token: string; isAdmin: true; user: { id: string; email: string; name: string } };
}

// ── Auth: Session ──────────────────────────────────────────────────────────────

export async function customerSessionApi(customerToken: string) {
  if (!isSheetsConfigured) return null;
  try {
    const r = await post<{ id: string; email: string; name: string }>('customer_session', { customerToken });
    if (!r.ok) return null;
    return r.data ?? null;
  } catch { return null; }
}

// ── Profile ────────────────────────────────────────────────────────────────────

const EMPTY_PROFILE: CustomerProfile = { name: '', phone: '', email: '', city: '', signup_method: '' };

export async function fetchProfile(userId: string, userEmail: string): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured || !userEmail) return null;
  const r = await post<CustomerProfile>('get_profile', { userId, userEmail });
  if (!r.ok || !r.data) return { ...EMPTY_PROFILE, email: userEmail };
  return r.data;
}

export async function upsertProfile(
  userId: string,
  userEmail: string,
  fields: Partial<CustomerProfile>,
): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured) return null;
  await post('upsert_customer', { userId, userEmail, name: fields.name, phone: fields.phone, city: fields.city });
  return fetchProfile(userId, userEmail);
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export async function saveOrder(userId: string, userEmail: string, order: OrderRecord): Promise<void> {
  if (!isSheetsConfigured || !userEmail) return;
  await post('save_order', {
    userId, userEmail,
    order: {
      orderCode:        order.orderCode,
      items:            order.items.map(l => ({ name: l.item.name, metres: l.metres, lineTotal: l.lineTotal })),
      subtotal:         order.subtotal,
      discount:         order.discount,
      shipping:         order.shipping,
      total:            order.total,
      notes:            order.requirement,
      fulfilment:       order.fulfilment,
      address:          order.address,
      city:             order.city,
      pincode:          order.pincode,
      paymentMethod:    order.paymentMethod,
      paid:             order.paid,
      paymentReference: order.paymentReference,
    },
  });
}

export async function fetchMyOrders(userId: string, userEmail: string): Promise<OrderHistoryRow[]> {
  if (!isSheetsConfigured || !userEmail) return [];
  const r = await post<OrderHistoryRow[]>('get_my_orders', { userId, userEmail });
  if (!r.ok || !r.data) return [];
  return r.data.map((row, i) => ({
    ...row,
    id: String(i),
    createdAt: row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
  }));
}

// ── Wishlist ───────────────────────────────────────────────────────────────────

export async function fetchWishlistIds(userId: string, userEmail: string): Promise<Set<string>> {
  if (!isSheetsConfigured || !userEmail) return new Set();
  const r = await post<string[]>('get_wishlist', { userId, userEmail });
  if (!r.ok || !r.data) return new Set();
  return new Set(r.data);
}

export async function toggleWishlist(userId: string, userEmail: string, productId: string, on: boolean): Promise<void> {
  if (!isSheetsConfigured || !userEmail) return;
  await post('toggle_wishlist', { userId, userEmail, productId, on });
}
