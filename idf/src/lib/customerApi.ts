/**
 * customerApi.ts
 * =============================================================================
 * All customer data (profiles, orders, wishlist) lives in Google Sheets and is
 * read/written via the Apps Script Web App endpoint.
 *
 * Auth is handled by Google Identity Services (googleAuth.ts) OR custom email/password
 * OTP verification stored and executed inside Google Sheets.
 */

import type { Item } from '../data/catalog';

// ─── Config ──────────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;

export const isSheetsConfigured = Boolean(SCRIPT_URL && SCRIPT_TOKEN);

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function sheetsPost<T = unknown>(
  action: string,
  userId: string,
  userEmail: string,
  payload: Record<string, unknown> = {},
): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!isSheetsConfigured) return { ok: false, error: 'sheets_not_configured' };
  if (!userId) return { ok: false, error: 'not_signed_in' };

  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: SCRIPT_TOKEN, action, userId, userEmail, ...payload }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Exported types ───────────────────────────────────────────────────────────

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  city: string;
  signup_method: string;
}

const EMPTY_PROFILE: CustomerProfile = {
  name: '',
  phone: '',
  email: '',
  city: '',
  signup_method: '',
};

export interface OrderRecord {
  orderCode: string;
  items: { item: Item; metres: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  requirement: string;
  fulfilment: 'delivery' | 'pickup';
  address: string;
  city: string;
  pincode: string;
  paymentMethod: string;
  paid: boolean;
  paymentReference: string;
}

export interface OrderHistoryRow {
  id: string;
  orderCode: string;
  itemNames: string;
  total: number;
  paid: boolean;
  createdAt: string;
}

// ─── Custom Email Auth API Calls ─────────────────────────────────────────────

export async function customerLoginApi(email: string, password: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: SCRIPT_TOKEN,
        action: 'customer_login',
        email,
        password,
      }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Login failed');
    return json as { token: string; user: { id: string; email: string; name: string } };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

export async function customerSendOtpApi(name: string, phone: string, email: string, password: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: SCRIPT_TOKEN,
        action: 'customer_send_otp',
        name,
        phone,
        email,
        password,
      }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Failed to register/send OTP');
    return json;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

export async function customerVerifyOtpApi(email: string, code: string) {
  if (!isSheetsConfigured) throw new Error('Sheets backend not configured.');
  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: SCRIPT_TOKEN,
        action: 'customer_verify_otp',
        email,
        code,
      }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Verification failed');
    return json as { token: string; user: { id: string; email: string; name: string } };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

export async function customerSessionApi(customerToken: string) {
  if (!isSheetsConfigured) return null;
  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: SCRIPT_TOKEN,
        action: 'customer_session',
        customerToken,
      }),
    });
    const json = await res.json();
    if (!json.ok) return null;
    return json.user as { id: string; email: string; name: string };
  } catch (err) {
    return null;
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string, userEmail: string): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured || !userId) return null;
  const result = await sheetsPost<CustomerProfile>('get_profile', userId, userEmail);
  if (!result.ok || !result.data) return { ...EMPTY_PROFILE, email: userEmail };
  return result.data;
}

export async function upsertProfile(
  userId: string,
  userEmail: string,
  fields: Partial<CustomerProfile>,
): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured || !userId) return null;

  await sheetsPost('upsert_customer', userId, userEmail, {
    name:         fields.name,
    phone:        fields.phone,
    city:         fields.city,
    signupMethod: fields.signup_method,
  });

  return fetchProfile(userId, userEmail);
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function saveOrder(
  userId: string,
  userEmail: string,
  order: OrderRecord,
): Promise<void> {
  if (!isSheetsConfigured || !userId) return;

  await sheetsPost('save_order', userId, userEmail, {
    order: {
      orderCode:        order.orderCode,
      customerName:     '', 
      phone:            '',
      fulfilment:       order.fulfilment,
      address:          order.address,
      city:             order.city,
      pincode:          order.pincode,
      items:            order.items.map((l) => ({
                          name:    l.item.name,
                          metres:  l.metres,
                          lineTotal: l.lineTotal,
                        })),
      subtotal:         order.subtotal,
      discount:         order.discount,
      shipping:         order.shipping,
      total:            order.total,
      notes:            order.requirement,
      paymentMethod:    order.paymentMethod,
      paid:             order.paid,
      paymentReference: order.paymentReference,
    },
  });
}

export async function fetchMyOrders(userId: string, userEmail: string): Promise<OrderHistoryRow[]> {
  if (!isSheetsConfigured || !userId) return [];
  const result = await sheetsPost<{
    orderCode: string;
    createdAt: string;
    itemNames: string;
    total: number;
    paid: boolean;
    status: string;
  }[]>('get_my_orders', userId, userEmail);

  if (!result.ok || !result.data) return [];

  return result.data.map((r, i) => ({
    id:        String(i),
    orderCode: r.orderCode,
    itemNames: r.itemNames,
    total:     r.total,
    paid:      r.paid,
    createdAt: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : '—',
  }));
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function fetchWishlistIds(userId: string, userEmail: string): Promise<Set<string>> {
  if (!isSheetsConfigured || !userId) return new Set();
  const result = await sheetsPost<string[]>('get_wishlist', userId, userEmail);
  if (!result.ok || !result.data) return new Set();
  return new Set(result.data);
}

export async function toggleWishlist(
  userId: string,
  userEmail: string,
  productId: string,
  on: boolean,
): Promise<void> {
  if (!isSheetsConfigured || !userId) return;
  await sheetsPost('toggle_wishlist', userId, userEmail, { productId, on });
}
