import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * WHY THIS FILE EXISTS
 *
 * Everything in this file is optional. The site works fully without it —
 * catalog editing via /#/admin + catalog.json, and WhatsApp-submitted
 * reviews — exactly as it did before. What Supabase adds on top, once
 * configured, is real accounts (Google or email+password+verification) for
 * anyone leaving a review, and changes the admin makes appearing live for
 * every visitor instead of needing a file upload.
 *
 * `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from a free project
 * at supabase.com. Until both are set, `isSupabaseConfigured` is false and
 * every piece of code that depends on this steps back to its non-Supabase
 * behaviour automatically — nothing breaks by leaving this unconfigured.
 *
 * See HANDOVER.md → "Accounts and live sync" for the exact setup steps.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * The Edge Function that handles admin login lives at this URL once deployed.
 * Built from the same project URL, so no separate env var is needed for it.
 */
export const adminAuthFunctionUrl = url ? `${url}/functions/v1/admin-auth` : '';

/**
 * The Edge Function that handles all protected admin operations (catalog,
 * reviews, orders, settings) — verifies the custom admin JWT server-side.
 */
export const adminApiFunctionUrl = url ? `${url}/functions/v1/admin-api` : '';
