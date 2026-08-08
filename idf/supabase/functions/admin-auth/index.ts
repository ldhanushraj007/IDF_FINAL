// supabase/functions/admin-auth/index.ts
//
// Two-step admin login. Credentials are checked against the `admins` table
// (bcrypt password stored as password_hash). Completely independent of
// Supabase Auth — admin identity is never mixed with customer identity.
//
// Step 1  POST { step: "request", username, password }
//   → verifies password hash → generates a 6-digit OTP
//   → stores a bcrypt hash of the OTP (5 min expiry) in the admins row
//   → emails the OTP via Resend (or any fetch-compatible provider)
//   → returns { ok: true }
//
// Step 2  POST { step: "verify", username, code }
//   → checks OTP hash + expiry
//   → on success, issues a signed JWT valid for 12 h
//   → returns { token: "..." }
//
// DEPLOY:
//   supabase functions deploy admin-auth
//
// SECRETS (set once):
//   supabase secrets set ADMIN_JWT_SECRET=<random 64-char string>
//   supabase secrets set RESEND_API_KEY=re_xxxx
//   supabase secrets set RESEND_FROM=noreply@yourdomain.com
//   supabase secrets set SITE_NAME="In Design Luxury Fabrics"
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { create as createJwt } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'noreply@example.com';
const SITE_NAME = Deno.env.get('SITE_NAME') ?? 'In Design Luxury Fabrics';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const CODE_EXPIRY_MINUTES = 5;
const SESSION_HOURS = 12;

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

async function sendOtpEmail(to: string, code: string) {
  if (!RESEND_API_KEY) {
    // Dev fallback — log to function logs instead of emailing.
    console.log(`[admin-auth] OTP for ${to}: ${code}`);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${SITE_NAME} <${RESEND_FROM}>`,
      to: [to],
      subject: `${code} — your admin login code`,
      html: `
        <p>Hello,</p>
        <p>Your <strong>${SITE_NAME}</strong> admin login code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
        <p>This code expires in ${CODE_EXPIRY_MINUTES} minutes. If you did not request this, ignore this email.</p>
      `,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!JWT_SECRET) return json({ error: 'ADMIN_JWT_SECRET is not configured.' }, 500);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const username = String(body.username ?? '').trim().toLowerCase();

  // ─── STEP 1: username + password → email OTP ───────────────────────────
  if (body.step === 'request') {
    if (!username || !body.password) return json({ error: 'Username and password required' }, 400);

    // Rate limit: count recent failures for this username
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await db
      .from('admin_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)
      .eq('success', false)
      .gte('attempted_at', since);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return json({ error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` }, 429);
    }

    // Look up admin
    const { data: admin } = await db
      .from('admins')
      .select('id, username, password_hash, email')
      .eq('username', username)
      .maybeSingle();

    const passwordOk = admin
      ? await bcrypt.compare(String(body.password), admin.password_hash)
      : false;

    // Log attempt
    await db.from('admin_login_attempts').insert({ username, success: passwordOk, ip });

    if (!passwordOk) {
      return json({ error: 'Incorrect username or password' }, 401);
    }

    // Generate 6-digit code, hash it, store with expiry
    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const codeHash = await bcrypt.hash(code);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000).toISOString();

    await db
      .from('admins')
      .update({ login_code_hash: codeHash, login_code_expires_at: expiresAt })
      .eq('id', admin!.id);

    await sendOtpEmail(admin!.email, code);

    return json({ ok: true });
  }

  // ─── STEP 2: 6-digit code → signed JWT ─────────────────────────────────
  if (body.step === 'verify') {
    const code = String(body.code ?? '').trim();
    if (!/^\d{6}$/.test(code)) return json({ error: 'Enter the 6-digit code' }, 400);
    if (!username) return json({ error: 'Username required' }, 400);

    const { data: admin } = await db
      .from('admins')
      .select('id, username, email, login_code_hash, login_code_expires_at')
      .eq('username', username)
      .maybeSingle();

    if (!admin?.login_code_hash) return json({ error: 'No code has been sent' }, 400);

    const expired = !admin.login_code_expires_at || new Date(admin.login_code_expires_at) < new Date();
    const codeOk = !expired && await bcrypt.compare(code, admin.login_code_hash);

    if (!codeOk) {
      const msg = expired ? 'That code has expired. Request a new one.' : 'That code is incorrect.';
      return json({ error: msg }, 401);
    }

    // Invalidate code + record login time
    await db
      .from('admins')
      .update({ login_code_hash: null, login_code_expires_at: null, last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // Issue signed JWT
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
    const token = await createJwt({ alg: 'HS256', typ: 'JWT' }, { sub: admin.id, username: admin.username, exp }, key);

    return json({ token });
  }

  return json({ error: 'Unknown step' }, 400);
});
