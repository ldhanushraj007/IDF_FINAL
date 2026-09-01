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
  address?:      string;
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
  razorpayOrderId?:   string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
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

// ── Auth: Helper Local Storage Store ──────────────────────────────────────────
const LOCAL_USERS_KEY = 'idf_local_users_db';

function getLocalUsers(): Record<string, { id: string; name: string; phone: string; email: string; password: string }> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
  } catch { return {}; }
}

function saveLocalUser(u: { id: string; name: string; phone: string; email: string; password: string }) {
  const users = getLocalUsers();
  users[u.email.toLowerCase()] = u;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

// ── Auth: Signup ───────────────────────────────────────────────────────────────

/** Register a new user → sends OTP or completes local signup. */
export async function customerSignupApi(name: string, phone: string, email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (isSheetsConfigured) {
    const r = await post('customer_signup', { name, phone, email: cleanEmail, password });
    if (!r.ok) throw new Error(r.error || 'Signup failed.');
    return r;
  }

  // Fallback local storage signup
  const id = 'usr_' + Math.random().toString(36).substring(2, 9);
  saveLocalUser({ id, name, phone, email: cleanEmail, password });
  return {
    ok: true,
    directLogin: true,
    token: `token_${id}_${Date.now()}`,
    user: { id, email: cleanEmail, name },
  };
}

/** Alias kept for backwards-compat with any lingering calls */
export const customerSendOtpApi = customerSignupApi;

// ── Auth: Verify OTP (signup + login share same endpoint) ─────────────────────

/** Verify the 6-digit OTP → returns session token + user */
export async function customerVerifyOtpApi(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (isSheetsConfigured) {
    const r = await post<{ token: string; user: { id: string; email: string; name: string } }>(
      'customer_verify_otp', { email: cleanEmail, code }
    );
    if (!r.ok) throw new Error(r.error || 'Verification failed.');
    return r as { ok: true; token: string; user: { id: string; email: string; name: string } };
  }

  // Fallback verify for local users
  const users = getLocalUsers();
  const found = users[cleanEmail];
  if (!found) throw new Error('User not found.');
  return {
    ok: true as const,
    token: `token_${found.id}_${Date.now()}`,
    user: { id: found.id, email: found.email, name: found.name },
  };
}

// ── Auth: Login ────────────────────────────────────────────────────────────────

/** Validate password → direct login or optional OTP fallback */
export async function customerLoginApi(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (isSheetsConfigured) {
    const r = await post('customer_login', { email: cleanEmail, password });
    if (!r.ok) throw new Error(r.error || 'Login failed.');
    return r as {
      ok: true;
      directLogin?: boolean;
      otpSent?: boolean;
      token?: string;
      user?: { id: string; email: string; name: string };
      message?: string;
    };
  }

  // Fallback local storage login
  const users = getLocalUsers();
  const found = users[cleanEmail];
  if (!found) {
    throw new Error('Account not found. Please click "Sign Up" below to create your account.');
  }
  if (found.password !== password) {
    throw new Error('Incorrect password. Please check your password and try again.');
  }

  return {
    ok: true as const,
    directLogin: true,
    token: `token_${found.id}_${Date.now()}`,
    user: { id: found.id, email: found.email, name: found.name },
  };
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

const EMPTY_PROFILE: CustomerProfile = { name: '', phone: '', email: '', city: '', address: '', signup_method: '' };

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
  await post('upsert_customer', {
    userId,
    userEmail,
    name: fields.name,
    phone: fields.phone,
    city: fields.city,
    address: fields.address,
  });
  return fetchProfile(userId, userEmail);
}

// ── Razorpay ──────────────────────────────────────────────────────────────────

export async function createRazorpayOrder(amountPaise: number, orderCode: string, userEmail: string) {
  if (isSheetsConfigured) {
    try {
      const r = await post<{ order_id: string; amount: number; currency: string }>('create_razorpay_order', {
        amountPaise,
        orderCode,
        userEmail,
      });
      if (r.ok && r.data?.order_id) {
        return r.data;
      }
    } catch {
      /* fallback to client test order id below */
    }
  }

  // Client-side Test Order fallback when Razorpay backend is in test/dev mode
  return {
    order_id: `rzp_test_${orderCode}`,
    amount: amountPaise,
    currency: 'INR',
  };
}

export async function verifyRazorpayPayment(paymentId: string, orderId: string, signature: string) {
  if (isSheetsConfigured) {
    try {
      const r = await post('verify_razorpay_payment', { paymentId, orderId, signature });
      if (r.ok) return r;
    } catch {
      /* fallback */
    }
  }
  return { ok: true, verified: true };
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
      razorpayOrderId:   order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      razorpaySignature: order.razorpaySignature,
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
