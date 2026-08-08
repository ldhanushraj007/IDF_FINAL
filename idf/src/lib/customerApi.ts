/**
 * customerApi.ts
 * =============================================================================
 * All customer data (profiles, orders, wishlist) lives in Google Sheets and is
 * read/written via the Apps Script Web App endpoint. Supabase is used for Auth
 * only — no Supabase Postgres tables are touched here.
 *
 * HOW IT WORKS
 * Every request is a POST to VITE_APPS_SCRIPT_URL with a JSON body:
 *   { token, action, userId, userEmail, ...actionPayload }
 * The script verifies `token === SHARED_TOKEN` and routes on `action`.
 *
 * Set in .env.local:
 *   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/<id>/exec
 *   VITE_APPS_SCRIPT_TOKEN=idf-change-this-to-something-random-and-secret
 *   (Token must match SHARED_TOKEN in IDF_CustDetails_sync.gs)
 */

import { supabase } from './supabase';
import type { Item } from '../data/catalog';

// ─── Config ──────────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;

/** True when the Apps Script endpoint is configured. Falls back gracefully. */
export const isSheetsConfigured = Boolean(SCRIPT_URL && SCRIPT_TOKEN);

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function sheetsPost<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!isSheetsConfigured) return { ok: false, error: 'sheets_not_configured' };

  // Attach the current user's ID + email for every request so the script can
  // find/create the right row without a separate auth call.
  const { data: authData } = await supabase!.auth.getUser();
  const userId = authData?.user?.id ?? '';
  const userEmail = authData?.user?.email ?? '';

  try {
    const res = await fetch(SCRIPT_URL!, {
      method: 'POST',
      // Apps Script doPost() reads e.postData.contents — must be text/plain,
      // NOT application/json, otherwise Apps Script wraps it differently.
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

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Fetch the profile for the signed-in user from Sheets.
 * Returns null if Sheets isn't configured or the user has no row yet.
 */
export async function fetchProfile(): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured || !supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const result = await sheetsPost<CustomerProfile>('get_profile', {});
  if (!result.ok || !result.data) return { ...EMPTY_PROFILE, email: authData.user.email ?? '' };
  return result.data;
}

/**
 * Upsert profile fields. Call after sign-up or when the customer saves their
 * details in checkout / account page. Only sends non-undefined fields.
 */
export async function upsertProfile(
  fields: Partial<CustomerProfile>,
): Promise<CustomerProfile | null> {
  if (!isSheetsConfigured || !supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  await sheetsPost('upsert_customer', {
    name:         fields.name,
    phone:        fields.phone,
    city:         fields.city,
    signupMethod: fields.signup_method,
  });

  // Return the merged profile
  return fetchProfile();
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function saveOrder(order: OrderRecord): Promise<void> {
  if (!isSheetsConfigured) return;

  const { data: authData } = await supabase!.auth.getUser();

  await sheetsPost('save_order', {
    order: {
      orderCode:        order.orderCode,
      customerName:     '', // filled from profile row in script
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

export async function fetchMyOrders(): Promise<OrderHistoryRow[]> {
  if (!isSheetsConfigured) return [];
  const result = await sheetsPost<{
    orderCode: string;
    createdAt: string;
    itemNames: string;
    total: number;
    paid: boolean;
    status: string;
  }[]>('get_my_orders', {});

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

export async function fetchWishlistIds(): Promise<Set<string>> {
  if (!isSheetsConfigured) return new Set();
  const result = await sheetsPost<string[]>('get_wishlist', {});
  if (!result.ok || !result.data) return new Set();
  return new Set(result.data);
}

export async function toggleWishlist(productId: string, on: boolean): Promise<void> {
  if (!isSheetsConfigured) return;
  await sheetsPost('toggle_wishlist', { productId, on });
}
