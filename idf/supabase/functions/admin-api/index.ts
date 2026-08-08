// supabase/functions/admin-api/index.ts
//
// Unified admin API. Every request must carry the JWT issued by admin-auth
// in the Authorization header: "Bearer <token>".
//
// Routes (POST, body.action):
//   publishCatalog   — upsert products + update site_settings offer
//   fetchProducts    — return all products
//   fetchSettings    — return offer settings
//   fetchReviews     — return all reviews (any status)
//   setReviewStatus  — { id, status: 'published'|'private' }
//   deleteReview     — { id }
//   addReview        — { name, city, rating, text }
//   fetchOrders      — return all orders (newest first)
//   setOrderStatus   — { id, order_status, payment_status }
//
// DEPLOY:
//   supabase functions deploy admin-api
//
// SECRETS (shared with admin-auth):
//   supabase secrets set ADMIN_JWT_SECRET=<same value as admin-auth>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify as verifyJwt } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET') ?? '';

// Service-role client bypasses RLS — only used after JWT verification.
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function verifyAdminToken(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !JWT_SECRET) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    await verifyJwt(token, key);
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // ─── Auth gate ─────────────────────────────────────────────────────────
  const authorized = await verifyAdminToken(req);
  if (!authorized) return json({ error: 'Unauthorized' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const action = String(body.action ?? '');

  // ─── Catalog: fetch ─────────────────────────────────────────────────────
  if (action === 'fetchProducts') {
    const { data, error } = await db.from('products').select('*').order('name');
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // ─── Catalog: publish ────────────────────────────────────────────────────
  if (action === 'publishCatalog') {
    const items = body.items as Record<string, unknown>[];
    const offer = body.offer as Record<string, unknown>;
    const originalIds = (body.originalIds as string[]) ?? [];

    const currentIds = new Set(items.map((i) => i.id as string));
    const removedIds = originalIds.filter((id) => !currentIds.has(id));

    if (removedIds.length) {
      const { error } = await db.from('products').delete().in('id', removedIds);
      if (error) return json({ error: error.message }, 500);
    }
    if (items.length) {
      const { error } = await db.from('products').upsert(items);
      if (error) return json({ error: error.message }, 500);
    }
    const { error: settingsError } = await db
      .from('site_settings')
      .update({
        offer_active: offer.active,
        offer_headline: offer.headline,
        offer_detail: offer.detail ?? '',
      })
      .eq('id', true);
    if (settingsError) return json({ error: settingsError.message }, 500);
    return json({ ok: true });
  }

  // ─── Settings: fetch ─────────────────────────────────────────────────────
  if (action === 'fetchSettings') {
    const { data, error } = await db
      .from('site_settings')
      .select('offer_active, offer_headline, offer_detail')
      .eq('id', true)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // ─── Reviews: fetch all ──────────────────────────────────────────────────
  if (action === 'fetchReviews') {
    const { data, error } = await db
      .from('reviews')
      .select('id, name, city, rating, review_text, status, user_email, created_at')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // ─── Reviews: set status ─────────────────────────────────────────────────
  if (action === 'setReviewStatus') {
    const { id, status } = body;
    if (!id || !['published', 'private'].includes(status as string))
      return json({ error: 'Invalid params' }, 400);
    const { error } = await db.from('reviews').update({ status }).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ─── Reviews: delete ─────────────────────────────────────────────────────
  if (action === 'deleteReview') {
    const { id } = body;
    if (!id) return json({ error: 'id required' }, 400);
    const { error } = await db.from('reviews').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ─── Reviews: add manual ─────────────────────────────────────────────────
  if (action === 'addReview') {
    const { name, city, rating, text } = body;
    const { error } = await db.from('reviews').insert({
      user_id: null,
      user_email: '',
      name,
      city: city ?? '',
      rating,
      review_text: text,
      status: 'published',
    });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ─── Orders: fetch all ───────────────────────────────────────────────────
  if (action === 'fetchOrders') {
    const { data, error } = await db
      .from('orders')
      .select(`
        id, order_code, items, subtotal, discount, shipping, total,
        requirement, fulfilment, address, city, pincode,
        payment_method, paid, payment_reference,
        payment_status, order_status, created_at,
        customers ( name, phone, email )
      `)
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  // ─── Orders: update status ───────────────────────────────────────────────
  if (action === 'setOrderStatus') {
    const { id, order_status, payment_status } = body;
    if (!id) return json({ error: 'id required' }, 400);
    const update: Record<string, unknown> = {};
    if (order_status) update.order_status = order_status;
    if (payment_status) update.payment_status = payment_status;
    const { error } = await db.from('orders').update(update).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
